import { NextResponse } from 'next/server';
import db from '@/lib/db';
import type { PaySlip } from '@/lib/types';

export async function GET(req: Request, { params }: { params: { slipId: string } }) {
  try {
    const { slipId } = params;

    if (!slipId) {
      return NextResponse.json({ message: 'Payslip ID is required' }, { status: 400 });
    }

    const { rows } = await db.query(
      `SELECT 
        ps.id, ps.employee_id, ps.month, ps.year, ps.basic_salary, ps.allowances, ps.deductions, ps.net_salary,
        e.name as employee_name, e.employee_id as employee_code, e.position, e.department
       FROM pay_slips ps
       JOIN employees e ON ps.employee_id = e.id
       WHERE ps.id = $1`,
      [slipId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Payslip not found' }, { status: 404 });
    }

    const row = rows[0];
    const paySlip: PaySlip = {
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      employeeCode: row.employee_code,
      position: row.position,
      department: row.department,
      month: row.month,
      year: row.year,
      basicSalary: parseFloat(row.basic_salary),
      allowances: parseFloat(row.allowances),
      deductions: parseFloat(row.deductions),
      netSalary: parseFloat(row.net_salary),
    };

    return NextResponse.json(paySlip);
  } catch (error) {
    console.error('API Error fetching payslip:', error);
    return NextResponse.json({ message: 'Failed to fetch payslip' }, { status: 500 });
  }
}
