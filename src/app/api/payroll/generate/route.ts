
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getDaysInMonth } from 'date-fns';

// Helper to verify role from JWT - assuming you have this utility
import { getRoleFromToken } from '../helpers';
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
        const month = now.toLocaleString('default', { month: 'long' });
        const daysInMonth = getDaysInMonth(now);
        const firstDayOfMonth = new Date(year, now.getMonth(), 1);
        const lastDayOfMonth = new Date(year, now.getMonth() + 1, 0);

        // 1. Fetch all employees
        const { rows: employees } = await client.query('SELECT id FROM employees');
        let slipsGeneratedCount = 0;

        for (const employee of employees) {
            const employeeId = employee.id;

            // Check if a payslip for this employee and month already exists
            const { rows: existingSlips } = await client.query(
                `SELECT id FROM pay_slips WHERE employee_id = $1 AND month = $2 AND year = $3`,
                [employeeId, month, year]
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
                continue; // Skip employee if no salary structure is found
            }
            const salary = salaryRows[0];
            const totalMonthlySalary = parseFloat(salary.basic_salary) + parseFloat(salary.hra) + parseFloat(salary.other_allowances);
            const totalMonthlyDeductions = parseFloat(salary.pf);

            // 3. Fetch attendance and leave records for the month
            const { rows: attendanceRecords } = await client.query(
                `SELECT status FROM attendance_records WHERE employee_id = $1 AND record_date >= $2 AND record_date <= $3`,
                [employeeId, firstDayOfMonth, lastDayOfMonth]
            );
            const { rows: leaveRecords } = await client.query(
                `SELECT start_date, end_date, leave_type FROM leave_requests WHERE employee_id = $1 AND status = 'Approved' AND start_date <= $2 AND end_date >= $3`,
                [employeeId, lastDayOfMonth, firstDayOfMonth]
            );

            // 4. Calculate payable days
            let payableDays = 0;
            const leaveDays = new Set<string>();

            // Account for approved leave days within the month
            leaveRecords.forEach(leave => {
                const leaveStart = new Date(leave.start_date);
                const leaveEnd = new Date(leave.end_date);
                // Only count paid leave types as payable
                if (['Paid', 'Maternity'].includes(leave.leave_type)) {
                    for (let d = leaveStart; d <= leaveEnd; d.setDate(d.getDate() + 1)) {
                        if (d >= firstDayOfMonth && d <= lastDayOfMonth) {
                           const dateString = d.toISOString().split('T')[0];
                           if (!leaveDays.has(dateString)) {
                               payableDays++;
                               leaveDays.add(dateString);
                           }
                        }
                    }
                }
            });

            // Account for attendance records, avoiding double-counting leave days
            attendanceRecords.forEach(att => {
                 const attDate = new Date(att.record_date).toISOString().split('T')[0];
                 if (!leaveDays.has(attDate)) {
                    if (att.status === 'Present') payableDays++;
                    if (att.status === 'Half-day') payableDays += 0.5;
                 }
            });

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
                [employeeId, month, year, basicComponent, allowancesComponent, finalDeductions, netSalary]
            );
            slipsGeneratedCount++;
        }

        await client.query('COMMIT');
        
        return NextResponse.json({ message: `Successfully generated ${slipsGeneratedCount} new payslips for ${month}, ${year}.` });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('API Error generating payslips:', error);
        return NextResponse.json({ message: 'Failed to generate payslips' }, { status: 500 });
    } finally {
        client.release();
    }
}
