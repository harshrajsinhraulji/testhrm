
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import type { SalaryStructure, PaySlip } from '@/lib/types';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const salaryStructureUpdateSchema = z.object({
  employeeId: z.string(), // This is the employee's DB UUID
  basicSalary: z.number().min(0),
  hra: z.number().min(0),
  otherAllowances: z.number().min(0),
  pf: z.number().min(0),
});

// Mock table for pay slips as it's not in the provided schema
const createPaySlipsTable = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS pay_slips (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            month VARCHAR(20) NOT NULL,
            year INT NOT NULL,
            basic_salary NUMERIC(12, 2) NOT NULL,
            allowances NUMERIC(12, 2) NOT NULL,
            deductions NUMERIC(12, 2) NOT NULL,
            net_salary NUMERIC(12, 2) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);
};

// Mock table for salary structures as it's not in the provided schema
const createSalaryStructuresTable = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS salary_structures (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            employee_id UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
            basic_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
            hra NUMERIC(10, 2) NOT NULL DEFAULT 0,
            other_allowances NUMERIC(10, 2) NOT NULL DEFAULT 0,
            pf NUMERIC(10, 2) NOT NULL DEFAULT 0
        );
    `);
};


export async function GET(req: Request) {
  try {
    await createSalaryStructuresTable();
    await createPaySlipsTable();

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
      // Fetching all salary structures for admin view and calculating stats
      const { rows } = await db.query(
        `SELECT 
          e.id as "employeeDbId",
          e.employee_id as "employeeId",
          e.name as "employeeName",
          e.department,
          COALESCE(ss.basic_salary, 0) as "basicSalary",
          COALESCE(ss.hra, 0) as "hra",
          COALESCE(ss.other_allowances, 0) as "otherAllowances",
          COALESCE(ss.pf, 0) as "pf"
         FROM employees e
         LEFT JOIN salary_structures ss ON e.id = ss.employee_id
         ORDER BY e.name`
      );

       const salaryStructures: SalaryStructure[] = rows.map(row => ({
        employeeDbId: row.employeeDbId,
        employeeId: row.employeeId,
        employeeName: row.employeeName,
        department: row.department,
        basicSalary: parseFloat(row.basicSalary),
        hra: parseFloat(row.hra),
        otherAllowances: parseFloat(row.otherAllowances),
        pf: parseFloat(row.pf),
        tax: 0 // tax calculation can be added later
      }));

      // Calculate statistics
      const totalEmployees = salaryStructures.length;
      const totalMonthlyPayroll = salaryStructures.reduce((acc, curr) => acc + curr.basicSalary + curr.hra + curr.otherAllowances, 0);
      const averageSalary = totalEmployees > 0 ? totalMonthlyPayroll / totalEmployees : 0;
      
      const departmentPayroll = salaryStructures.reduce((acc, curr) => {
          const dept = curr.department || 'Unassigned';
          const salary = curr.basicSalary + curr.hra + curr.otherAllowances;
          acc[dept] = (acc[dept] || 0) + salary;
          return acc;
      }, {} as Record<string, number>);

      const departmentBreakdown = Object.entries(departmentPayroll).map(([name, total]) => ({ name, total }));

      return NextResponse.json({
          salaryStructures,
          stats: {
              totalEmployees,
              totalMonthlyPayroll,
              averageSalary,
          },
          departmentBreakdown,
      });
    }
  } catch (error) {
    console.error('API Error fetching payroll data:', error);
    return NextResponse.json({ message: 'Failed to fetch payroll data' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
    try {
        await createSalaryStructuresTable();
        const body = await req.json();
        const validation = salaryStructureUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid input', errors: validation.error.issues }, { status: 400 });
        }

        const { employeeId, basicSalary, hra, otherAllowances, pf } = validation.data;

        const query = `
            INSERT INTO salary_structures (employee_id, basic_salary, hra, other_allowances, pf)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (employee_id)
            DO UPDATE SET
                basic_salary = EXCLUDED.basic_salary,
                hra = EXCLUDED.hra,
                other_allowances = EXCLUDED.other_allowances,
                pf = EXCLUDED.pf
            RETURNING *;
        `;

        const { rows } = await db.query(query, [employeeId, basicSalary, hra, otherAllowances, pf]);

        return NextResponse.json(rows[0]);

    } catch (error) {
        console.error('API Error updating salary structure:', error);
        return NextResponse.json({ message: 'Failed to update salary structure' }, { status: 500 });
    }
}
