
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getDaysInMonth } from 'date-fns';
import { getRoleFromToken } from '../helpers';
import { z } from 'zod';

const generateIndividualSchema = z.object({
  employeeId: z.string().uuid(),
  month: z.string(),
  year: z.number(),
});

export async function POST(req: Request) {
    const requestingUserRole = getRoleFromToken(req);

    if (requestingUserRole !== 'Admin') {
        return NextResponse.json({ message: 'Forbidden: You do not have permission.' }, { status: 403 });
    }

    const client = await db.connect();
    try {
        const body = await req.json();
        const validation = generateIndividualSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid input.', errors: validation.error.issues }, { status: 400 });
        }

        const { employeeId, month, year } = validation.data;
        
        await client.query('BEGIN');

        // Check if a payslip for this employee and month already exists
        const { rows: existingSlips } = await client.query(
            `SELECT id FROM pay_slips WHERE employee_id = $1 AND month = $2 AND year = $3`,
            [employeeId, month, year]
        );

        if (existingSlips.length > 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: `Payslip for ${month}, ${year} already exists for this employee.` }, { status: 409 });
        }
        
        const monthIndex = new Date(Date.parse(month +" 1, 2012")).getMonth();
        const daysInMonth = getDaysInMonth(new Date(year, monthIndex));
        const firstDayOfMonth = new Date(year, monthIndex, 1);
        const lastDayOfMonth = new Date(year, monthIndex, daysInMonth);

        // Fetch salary structure
        const { rows: salaryRows } = await client.query(
            `SELECT basic_salary, hra, other_allowances, pf FROM salary_structures WHERE employee_id = $1`,
            [employeeId]
        );

        if (salaryRows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: 'No salary structure found for this employee.' }, { status: 404 });
        }
        const salary = salaryRows[0];
        const totalMonthlySalary = parseFloat(salary.basic_salary) + parseFloat(salary.hra) + parseFloat(salary.other_allowances);
        const totalMonthlyDeductions = parseFloat(salary.pf);

        // Fetch attendance and leave records for the month
        const { rows: attendanceRecords } = await client.query(
            `SELECT status, record_date FROM attendance_records WHERE employee_id = $1 AND record_date >= $2 AND record_date <= $3`,
            [employeeId, firstDayOfMonth, lastDayOfMonth]
        );

        const { rows: leaveRecords } = await client.query(
            `SELECT start_date, end_date, leave_type FROM leave_requests WHERE employee_id = $1 AND status = 'Approved' AND start_date <= $2 AND end_date >= $3`,
            [employeeId, lastDayOfMonth, firstDayOfMonth]
        );

        // Calculate payable days
        let payableDays = 0;
        const leaveDays = new Set<string>();

        leaveRecords.forEach(leave => {
            const leaveStart = new Date(leave.start_date);
            const leaveEnd = new Date(leave.end_date);
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

        attendanceRecords.forEach(att => {
             const attDate = new Date(att.record_date).toISOString().split('T')[0];
             if (!leaveDays.has(attDate)) {
                if (att.status === 'Present') payableDays++;
                if (att.status === 'Half-day') payableDays += 0.5;
             }
        });

        // Pro-rate salary and deductions
        const perDaySalary = totalMonthlySalary / daysInMonth;
        const perDayDeduction = totalMonthlyDeductions / daysInMonth;
        
        const finalSalary = perDaySalary * payableDays;
        const finalDeductions = perDayDeduction * payableDays;
        const netSalary = finalSalary - finalDeductions;
        
        const basicComponent = (parseFloat(salary.basic_salary) / daysInMonth) * payableDays;
        const allowancesComponent = ((parseFloat(salary.hra) + parseFloat(salary.other_allowances)) / daysInMonth) * payableDays;

        // Insert the new payslip
        await client.query(
            `INSERT INTO pay_slips (employee_id, month, year, basic_salary, allowances, deductions, net_salary)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [employeeId, month, year, basicComponent, allowancesComponent, finalDeductions, netSalary]
        );

        await client.query('COMMIT');
        
        return NextResponse.json({ message: `Successfully generated payslip for ${month}, ${year}.` });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('API Error generating individual payslip:', error);
        return NextResponse.json({ message: 'Failed to generate payslip' }, { status: 500 });
    } finally {
        client.release();
    }
}
