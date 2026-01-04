import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { z } from 'zod';
import { getPredefinedSalary } from '@/lib/salary-config';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@/lib/types';


// Helper to decode JWT and get user role
const getRoleFromToken = (req: Request): UserRole | null => {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-key') as { userId: string, role: UserRole };
        return decoded.role;
    } catch (error) {
        return null;
    }
}


// Schema for validating the update payload
const employeeUpdateSchema = z.object({
  contactNumber: z.string().min(10, "Invalid phone number").optional(),
  address: z.string().min(5, "Address is too short").optional(),
  emergencyContactName: z.string().min(2, "Name is too short").optional(),
  emergencyContactRelationship: z.string().min(2, "Relationship is too short").optional(),
  emergencyContactPhone: z.string().min(10, "Invalid phone number").optional(),
  avatarUrl: z.string().url().or(z.string().startsWith("data:image/")).optional(),
  // Admin & HR fields
  name: z.string().min(2, "Name is too short").optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  // Admin-only fields
  role: z.enum(['Admin', 'HR', 'Employee']).optional(),
});


export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const client = await db.connect();
    try {
        // First, verify the role of the user making the request
        const requestingUserRole = getRoleFromToken(req);

        const { id } = params; // Employee UUID from the URL
        const body = await req.json();

        const validation = employeeUpdateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid input', errors: validation.error.issues }, { status: 400 });
        }

        const {
            contactNumber, address, emergencyContactName,
            emergencyContactRelationship, emergencyContactPhone,
            name, avatarUrl, department, position, role
        } = validation.data;

        // Security Check: Only Admins can change the role
        if (role && requestingUserRole !== 'Admin') {
            return NextResponse.json({ message: 'Forbidden: Only admins can change user roles.' }, { status: 403 });
        }


        await client.query('BEGIN');

        // Fetch current employee data to check for role change
        const { rows: existingEmployeeRows } = await client.query('SELECT department, position FROM employees WHERE id = $1', [id]);
        if (existingEmployeeRows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: 'Employee not found' }, { status: 404 });
        }
        const existingEmployee = existingEmployeeRows[0];

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
        if (department) { fieldsToUpdate.push(`department = $${queryIndex++}`); values.push(department); }
        if (position) { fieldsToUpdate.push(`position = $${queryIndex++}`); values.push(position); }
        if (role) { fieldsToUpdate.push(`role = $${queryIndex++}`); values.push(role); }

        if (fieldsToUpdate.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
        }

        const query = `
          UPDATE employees 
          SET ${fieldsToUpdate.join(', ')} 
          WHERE id = $${queryIndex} 
          RETURNING id, name, email, role, avatar_url, employee_id, department, position, contact_number, address, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, date_of_joining
        `;
        values.push(id);

        const { rows } = await client.query(query, values);

        // Check if department or position has changed
        const newDepartment = department || existingEmployee.department;
        const newPosition = position || existingEmployee.position;
        if (newDepartment !== existingEmployee.department || newPosition !== existingEmployee.position) {
            const predefinedSalary = getPredefinedSalary(newDepartment, newPosition);

            await client.query(`
                INSERT INTO salary_structures (employee_id, basic_salary, hra, other_allowances, pf)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (employee_id)
                DO UPDATE SET
                    basic_salary = EXCLUDED.basic_salary,
                    hra = EXCLUDED.hra,
                    other_allowances = EXCLUDED.other_allowances,
                    pf = EXCLUDED.pf
            `, [id, predefinedSalary.basic, predefinedSalary.hra, predefinedSalary.otherAllowances, predefinedSalary.pf]);
        }

        await client.query('COMMIT');

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
        await client.query('ROLLBACK');
        console.error('API Error updating employee:', error);
        return NextResponse.json({ message: 'Failed to update employee' }, { status: 500 });
    } finally {
        client.release();
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
