
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, password, employeeId, role } = await req.json();

    // Basic validation
    if (!name || !email || !password || !employeeId || !role) {
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
    
    // Insert new user
    const { rows: newUsers } = await db.query(
      'INSERT INTO employees (name, email, password_hash, employee_id, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, employee_id, avatar_url, position, department',
      [name, email, passwordHash, employeeId, role]
    );

    const newUser = newUsers[0];

    // Don't send password hash back to client
    const { password_hash, ...userToReturn } = newUser;
    
    return NextResponse.json(userToReturn);

  } catch (error) {
    console.error('Signup API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
