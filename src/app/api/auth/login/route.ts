
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { User } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Find the user by email
    const { rows: users } = await db.query('SELECT * FROM employees WHERE email = $1', [email]);
    if (users.length === 0) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const userFromDb = users[0];

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, userFromDb.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    
    // Construct user object to return, excluding sensitive data
    const user: User = {
        id: userFromDb.id, // Auth UID will be set from client, this is DB id for now
        name: userFromDb.name,
        email: userFromDb.email,
        role: userFromDb.role,
        avatarUrl: userFromDb.avatar_url,
        employeeDetails: {
            id: userFromDb.id, // This is the crucial employee UUID from the database
            employeeId: userFromDb.employee_id,
            department: userFromDb.department,
            position: userFromDb.position,
            dateOfJoining: userFromDb.date_of_joining,
            contactNumber: userFromDb.contact_number,
            address: userFromDb.address,
            emergencyContact: {
                name: userFromDb.emergency_contact_name,
                relationship: userFromDb.emergency_contact_relationship,
                phone: userFromDb.emergency_contact_phone,
            }
        }
    };


    // Create JWT token
    const secret = process.env.JWT_SECRET || 'your-super-secret-key';
    const token = jwt.sign({ userId: user.id, role: user.role }, secret, {
      expiresIn: '1h',
    });

    // In the response, we send back the full user object including the DB UUID
    // and the JWT token.
    return NextResponse.json({ user, token });

  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
