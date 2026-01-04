
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getDaysInMonth, eachDayOfInterval, format } from 'date-fns';

// Helper to verify role from JWT - assuming you have this utility
import { getRoleFromToken } from '@/app/api/helpers';
import type { UserRole } from '@/lib/types';


export async function POST(req: Request) {
    const requestingUserRole = getRoleFromToken(req);

    // Security: Only Admins can generate payroll
    if (requestingUserRole !== 'Admin') {
        return NextResponse.json({ message: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const now = new Date();
        const year = now.getFullYear();
        const monthName = now.toLocaleString('default', { month: 'long' });
        const monthIndex = now.getMonth();
        const daysInMonth = getDaysInMonth(now);
        const firstDayOfMonth = new Date(year, monthIndex, 1);
        const lastDayOfMonth = new Date(year, monthIndex, daysInMonth);

        // 1. Fetch all employees
        const { rows: employees } = await client.query('SELECT id FROM employees');
        let slipsGeneratedCount = 0;

        for (const employee of employees) {
            const employeeId = employee.id;

            // Check if a payslip for this employee and month already exists
            const { rows: existingSlips } = await client.query(
                `SELECT id FROM pay_slips WHERE employee_id = $1 AND month = $2 AND year = $3`,
                [employeeId, monthName, year]
            );

            if (existingSlips.length > 0) {
                continue; // Skip if payslip already exists
            }

            // 2. Fetch salary structure
            const { rows: salaryRows } = await client.query(
                `SELECT basic_salary, hra, other_allowances, pf FROM salary_structures WHERE employee_id = $1`,
                [employeeId]
            );

            if (salaryRows.length === 0) {
                console.warn(`No salary structure for employee ${employeeId}. Skipping.`);
                continue; // Skip employee if no salary structure is found
            }
            const salary = salaryRows[0];
            const totalMonthlySalary = parseFloat(salary.basic_salary) + parseFloat(salary.hra) + parseFloat(salary.other_allowances);
            const totalMonthlyDeductions = parseFloat(salary.pf);

            // 3. Fetch all relevant attendance and leave records for the month
            const { rows: attendanceRows } = await client.query(
                `SELECT status, record_date FROM attendance_records WHERE employee_id = $1 AND record_date >= $2 AND record_date <= $3`,
                [employeeId, firstDayOfMonth, lastDayOfMonth]
            );
            const attendanceMap = new Map(attendanceRows.map(r => [format(new Date(r.record_date), 'yyyy-MM-dd'), r.status]));

            const { rows: leaveRows } = await client.query(
                `SELECT start_date, end_date, leave_type FROM leave_requests WHERE employee_id = $1 AND status = 'Approved' AND start_date <= $2 AND end_date >= $3`,
                [employeeId, lastDayOfMonth, firstDayOfMonth]
            );

            const leaveMap = new Map<string, string>();
            leaveRows.forEach(leave => {
                const interval = { start: new Date(leave.start_date), end: new Date(leave.end_date) };
                eachDayOfInterval(interval).forEach(day => {
                    if (day.getMonth() === monthIndex) { // Ensure day is within the current month
                        leaveMap.set(format(day, 'yyyy-MM-dd'), leave.leave_type);
                    }
                });
            });

            // 4. Calculate payable days
            let payableDays = 0;
            const monthDays = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

            for (const day of monthDays) {
                const dayString = format(day, 'yyyy-MM-dd');
                const isPaidLeave = leaveMap.has(dayString) && ['Paid', 'Maternity'].includes(leaveMap.get(dayString)!);
                
                if (isPaidLeave) {
                    payableDays += 1;
                } else if (attendanceMap.has(dayString)) {
                    const status = attendanceMap.get(dayString);
                    if (status === 'Present') {
                        payableDays += 1;
                    } else if (status === 'Half-day') {
                        payableDays += 0.5;
                    }
                }
            }

            // 5. Pro-rate salary and deductions
            const perDaySalary = totalMonthlySalary / daysInMonth;
            const perDayDeduction = totalMonthlyDeductions / daysInMonth;

            const finalSalary = perDaySalary * payableDays;
            const finalDeductions = perDayDeduction * payableDays;
            const netSalary = finalSalary - finalDeductions;
            
            const basicComponent = (parseFloat(salary.basic_salary) / daysInMonth) * payableDays;
            const allowancesComponent = ((parseFloat(salary.hra) + parseFloat(salary.other_allowances)) / daysInMonth) * payableDays;


            // 6. Insert the new payslip
            await client.query(
                `INSERT INTO pay_slips (employee_id, month, year, basic_salary, allowances, deductions, net_salary)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [employeeId, monthName, year, basicComponent, allowancesComponent, finalDeductions, netSalary]
            );
            slipsGeneratedCount++;
        }

        await client.query('COMMIT');
        
        return NextResponse.json({ message: `Successfully generated ${slipsGeneratedCount} new payslips for ${monthName}, ${year}.` });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('API Error generating payslips:', error);
        return NextResponse.json({ message: 'Failed to generate payslips' }, { status: 500 });
    } finally {
        client.release();
    }
}
