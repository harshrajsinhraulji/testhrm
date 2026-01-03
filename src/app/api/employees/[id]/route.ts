import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { z } from 'zod';

// Schema for validating the update payload
const employeeUpdateSchema = z.object({
  contactNumber: z.string().min(10, "Invalid phone number").optional(),
  address: z.string().min(5, "Address is too short").optional(),
  emergencyContactName: z.string().min(2, "Name is too short").optional(),
  emergencyContactRelationship: z.string().min(2, "Relationship is too short").optional(),
  emergencyContactPhone: z.string().min(10, "Invalid phone number").optional(),
  avatarUrl: z.string().url().or(z.string().startsWith("data:image/")).optional(),
  // Admin-only fields
  name: z.string().min(2, "Name is too short").optional(),
});


export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params; // Employee UUID from the URL
    const body = await req.json();

    // You would typically have authorization here to check if the user is an admin
    // or if the user is updating their own profile. For now, we'll proceed.

    const validation = employeeUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.issues }, { status: 400 });
    }

    const { 
        contactNumber, address, emergencyContactName, 
        emergencyContactRelationship, emergencyContactPhone, 
        name, avatarUrl
    } = validation.data;
    
    // Dynamically build the update query based on the fields provided
    const fieldsToUpdate = [];
    const values = [];
    let queryIndex = 1;

    if (name) { fieldsToUpdate.push(`name = $${queryIndex++}`); values.push(name); }
    if (contactNumber) { fieldsToUpdate.push(`contact_number = $${queryIndex++}`); values.push(contactNumber); }
    if (address) { fieldsToUpdate.push(`address = $${queryIndex++}`); values.push(address); }
    if (emergencyContactName) { fieldsToUpdate.push(`emergency_contact_name = $${queryIndex++}`); values.push(emergencyContactName); }
    if (emergencyContactRelationship) { fieldsToUpdate.push(`emergency_contact_relationship = $${queryIndex++}`); values.push(emergencyContactRelationship); }
    if (emergencyContactPhone) { fieldsToUpdate.push(`emergency_contact_phone = $${queryIndex++}`); values.push(emergencyContactPhone); }
    if (avatarUrl) { fieldsToUpdate.push(`avatar_url = $${queryIndex++}`); values.push(avatarUrl); }

    if (fieldsToUpdate.length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    const query = `
      UPDATE employees 
      SET ${fieldsToUpdate.join(', ')} 
      WHERE id = $${queryIndex} 
      RETURNING id, name, email, role, avatar_url, employee_id, department, position, contact_number, address, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, date_of_joining
    `;
    values.push(id);

    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Employee not found' }, { status: 404 });
    }

    const updatedDbUser = rows[0];
     const user = {
        id: updatedDbUser.id,
        name: updatedDbUser.name,
        email: updatedDbUser.email,
        role: updatedDbUser.role,
        avatarUrl: updatedDbUser.avatar_url,
        employeeDetails: {
            id: updatedDbUser.id,
            employeeId: updatedDbUser.employee_id,
            department: updatedDbUser.department,
            position: updatedDbUser.position,
            dateOfJoining: new Date(updatedDbUser.date_of_joining).toISOString(),
            contactNumber: updatedDbUser.contact_number,
            address: updatedDbUser.address,
            emergencyContact: {
                name: updatedDbUser.emergency_contact_name,
                relationship: updatedDbUser.emergency_contact_relationship,
                phone: updatedDbUser.emergency_contact_phone,
            }
        }
    };


    return NextResponse.json(user);

  } catch (error) {
    console.error('API Error updating employee:', error);
    return NextResponse.json({ message: 'Failed to update employee' }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params; // Employee UUID

        if (!id) {
            return NextResponse.json({ message: 'Employee ID is required' }, { status: 400 });
        }
        
        const { rows } = await db.query('SELECT * FROM employees WHERE id = $1', [id]);

        if (rows.length === 0) {
            return NextResponse.json({ message: 'Employee not found' }, { status: 404 });
        }

        const userFromDb = rows[0];

        const user = {
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
        console.error('API Error fetching employee:', error);
        return NextResponse.json({ message: 'Failed to fetch employee' }, { status: 500 });
    }
}
