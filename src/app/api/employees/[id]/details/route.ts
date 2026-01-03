import { NextResponse } from 'next/server';
import db from '@/lib/db';
import type { User } from '@/lib/types';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params; // Employee UUID

        if (!id) {
            return NextResponse.json({ message: 'Employee ID is required' }, { status: 400 });
        }
        
        // Fetch all details for the employee
        const { rows } = await db.query('SELECT * FROM employees WHERE id = $1', [id]);

        if (rows.length === 0) {
            return NextResponse.json({ message: 'Employee not found' }, { status: 404 });
        }

        const userFromDb = rows[0];

        // Construct the full User object, including all details needed for the profile form
        const user: User = {
            id: userFromDb.id,
            name: userFromDb.name,
            email: userFromDb.email,
            role: userFromDb.role,
            avatarUrl: userFromDb.avatar_url,
            employeeDetails: {
                id: userFromDb.id,
                employeeId: userFromDb.employee_id,
                department: userFromDb.department,
                position: userFromDb.position,
                dateOfJoining: new Date(userFromDb.date_of_joining).toISOString(),
                contactNumber: userFromDb.contact_number,
                address: userFromDb.address,
                emergencyContact: {
                    name: userFromDb.emergency_contact_name,
                    relationship: userFromDb.emergency_contact_relationship,
                    phone: userFromDb.emergency_contact_phone,
                }
            }
        };

        return NextResponse.json(user);

    } catch (error) {
        console.error('API Error fetching employee details:', error);
        return NextResponse.json({ message: 'Failed to fetch employee details' }, { status: 500 });
    }
}
