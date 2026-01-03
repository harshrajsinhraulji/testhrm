
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import type { SalaryStructure, PaySlip } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId'); // Employee DB UUID

    if (employeeId) {
      // Fetching pay slips for a specific employee
      const { rows: paySlipRows } = await db.query(
        `SELECT id, employee_id, month, year, basic_salary, allowances, deductions, net_salary
         FROM pay_slips
         WHERE employee_id = $1
         ORDER BY year DESC, month DESC`,
        [employeeId]
      );
      
      const paySlips: PaySlip[] = paySlipRows.map(row => ({
        id: row.id,
        employeeId: row.employee_id,
        month: row.month,
        year: row.year,
        basicSalary: parseFloat(row.basic_salary),
        allowances: parseFloat(row.allowances),
        deductions: parseFloat(row.deductions),
        netSalary: parseFloat(row.net_salary),
      }));

      return NextResponse.json(paySlips);

    } else {
      // Fetching all salary structures for admin view
      const { rows } = await db.query(
        `SELECT 
          e.employee_id as "employeeId",
          e.name as "employeeName",
          COALESCE(ss.basic_salary, 0) as "basicSalary",
          COALESCE(ss.hra, 0) as "hra",
          COALESCE(ss.other_allowances, 0) as "otherAllowances",
          COALESCE(ss.pf, 0) as "pf"
         FROM employees e
         LEFT JOIN salary_structures ss ON e.id = ss.employee_id
         ORDER BY e.name`
      );

       const salaryStructures: SalaryStructure[] = rows.map(row => ({
        employeeId: row.employeeId,
        employeeName: row.employeeName,
        basicSalary: parseFloat(row.basicSalary),
        hra: parseFloat(row.hra),
        otherAllowances: parseFloat(row.otherAllowances),
        pf: parseFloat(row.pf),
        tax: 0 // tax calculation can be added later
      }));

      return NextResponse.json(salaryStructures);
    }
  } catch (error) {
    console.error('API Error fetching payroll data:', error);
    return NextResponse.json({ message: 'Failed to fetch payroll data' }, { status: 500 });
  }
}
