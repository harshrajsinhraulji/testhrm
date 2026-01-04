
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getDaysInMonth, eachDayOfInterval, format, getDay } from 'date-fns';
import { getRoleFromToken } from '@/app/api/helpers';

export async function POST(req: Request) {
    const requestingUserRole = getRoleFromToken(req);

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

        const { rows: employees } = await client.query('SELECT id FROM employees');
        let slipsGeneratedCount = 0;
        let employeesSkipped = 0;

        for (const employee of employees) {
            const employeeId = employee.id;

            const { rows: existingSlips } = await client.query(
                `SELECT id FROM pay_slips WHERE employee_id = $1 AND month = $2 AND year = $3`,
                [employeeId, monthName, year]
            );

            if (existingSlips.length > 0) continue;

            const { rows: salaryRows } = await client.query(
                `SELECT basic_salary, hra, other_allowances, pf FROM salary_structures WHERE employee_id = $1`,
                [employeeId]
            );

            if (salaryRows.length === 0) {
                console.warn(`No salary structure for employee ${employeeId}. Skipping.`);
                employeesSkipped++;
                continue;
            }
            const salary = salaryRows[0];
            const totalMonthlySalary = parseFloat(salary.basic_salary) + parseFloat(salary.hra) + parseFloat(salary.other_allowances);
            const totalMonthlyDeductions = parseFloat(salary.pf);

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
                    if (day.getMonth() === monthIndex) {
                        leaveMap.set(format(day, 'yyyy-MM-dd'), leave.leave_type);
                    }
                });
            });

            let payableDays = 0;
            const monthDays = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

            for (const day of monthDays) {
                const dayString = format(day, 'yyyy-MM-dd');
                const dayOfWeek = getDay(day);

                if (dayOfWeek === 0) continue; // Skip Sundays

                const leaveType = leaveMap.get(dayString);
                const attendanceStatus = attendanceMap.get(dayString);

                if (leaveType && ['Paid', 'Maternity', 'Sick'].includes(leaveType)) {
                    payableDays += 1;
                } else if (attendanceStatus === 'Present') {
                    payableDays += 1;
                } else if (attendanceStatus === 'Half-day') {
                    payableDays += 0.5;
                }
            }

            const perDaySalary = totalMonthlySalary / daysInMonth;
            const perDayDeduction = totalMonthlyDeductions / daysInMonth;

            const finalSalary = perDaySalary * payableDays;
            const finalDeductions = perDayDeduction * payableDays;
            const netSalary = finalSalary - finalDeductions;
            
            const basicComponent = (parseFloat(salary.basic_salary) / daysInMonth) * payableDays;
            const allowancesComponent = ((parseFloat(salary.hra) + parseFloat(salary.other_allowances)) / daysInMonth) * payableDays;

            if (isNaN(netSalary) || isNaN(basicComponent) || isNaN(allowancesComponent) || isNaN(finalDeductions)) {
                console.error(`NaN calculated for employee ${employeeId}. Skipping.`);
                employeesSkipped++;
                continue;
            }

            await client.query(
                `INSERT INTO pay_slips (employee_id, month, year, basic_salary, allowances, deductions, net_salary)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [employeeId, monthName, year, basicComponent.toFixed(2), allowancesComponent.toFixed(2), finalDeductions.toFixed(2), netSalary.toFixed(2)]
            );
            slipsGeneratedCount++;
        }

        await client.query('COMMIT');
        
        let message = `Successfully generated ${slipsGeneratedCount} new payslips for ${monthName}, ${year}.`;
        if (employeesSkipped > 0) {
            message += ` Skipped ${employeesSkipped} employees due to missing salary structure or calculation errors.`
        }
        
        return NextResponse.json({ message });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('API Error generating payslips:', error);
        return NextResponse.json({ message: 'Failed to generate payslips due to a server error.' }, { status: 500 });
    } finally {
        client.release();
    }
}
