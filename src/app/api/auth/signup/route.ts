
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getPredefinedSalary } from '@/lib/salary-config';

export async function POST(req: Request) {
  try {
    const { name, email, password, employeeId, department, position } = await req.json();

    // Basic validation
    if (!name || !email || !password || !employeeId || !department || !position) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if user already exists
    const { rows: existingUsers } = await db.query('SELECT * FROM employees WHERE email = $1 OR employee_id = $2', [email, employeeId]);
    if (existingUsers.length > 0) {
      return NextResponse.json({ message: 'User with this email or employee ID already exists' }, { status: 409 });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // New users are always 'Employee'
    const role = 'Employee';

    // Begin a transaction
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Insert new user with department and position
        const { rows: newUsers } = await client.query(
          'INSERT INTO employees (name, email, password_hash, employee_id, role, department, position) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role, employee_id, avatar_url, position, department',
          [name, email, passwordHash, employeeId, role, department, position]
        );

        const newUser = newUsers[0];
        const newEmployeeDbId = newUser.id;

        // Get predefined salary and create the salary structure
        const predefinedSalary = getPredefinedSalary(department, position);

        // Ensure salary structures and payslips tables exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS salary_structures (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                employee_id UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
                basic_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
                hra NUMERIC(10, 2) NOT NULL DEFAULT 0,
                other_allowances NUMERIC(10, 2) NOT NULL DEFAULT 0,
                pf NUMERIC(10, 2) NOT NULL DEFAULT 0
            );
        `);
         await client.query(`
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

        // Insert default salary structure
        await client.query(
            `INSERT INTO salary_structures (employee_id, basic_salary, hra, other_allowances, pf)
            VALUES ($1, $2, $3, $4, $5)`,
            [newEmployeeDbId, predefinedSalary.basic, predefinedSalary.hra, predefinedSalary.otherAllowances, predefinedSalary.pf]
        );
        
        await client.query('COMMIT');

        // Don't send password hash back to client
        const { password_hash, ...userToReturn } = newUser;
        
        return NextResponse.json(userToReturn);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Signup transaction error:', error);
        return NextResponse.json({ message: 'Failed to create user and salary structure' }, { status: 500 });
    } finally {
        client.release();
    }

  } catch (error) {
    console.error('Signup API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
