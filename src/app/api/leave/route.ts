
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { z } from 'zod';
import type { LeaveRequest, Employee } from '@/lib/types';

const leaveRequestSchema = z.object({
  employeeId: z.string().min(1), // Can be either UUID or human-readable, we handle it now
  leaveType: z.enum(["Paid", "Sick", "Unpaid", "Maternity"]),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid start date" }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid end date" }),
  reason: z.string().min(1).max(500),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId'); // This is the Employee DB UUID

    let query = `
      SELECT 
        lr.id, 
        lr.employee_id, 
        e.name as employee_name, 
        lr.leave_type, 
        lr.start_date, 
        lr.end_date, 
        lr.reason, 
        lr.status, 
        lr.admin_comments
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
    `;
    const params = [];

    if (employeeId) {
      query += ' WHERE lr.employee_id = $1 ORDER BY lr.start_date DESC';
      params.push(employeeId);
    } else {
      query += ' ORDER BY lr.start_date DESC';
    }

    const { rows } = await db.query(query, params);
    
    const leaveRequests: LeaveRequest[] = rows.map(row => ({
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      leaveType: row.leave_type,
      startDate: new Date(row.start_date).toISOString().split('T')[0],
      endDate: new Date(row.end_date).toISOString().split('T')[0],
      reason: row.reason,
      status: row.status,
      comments: row.admin_comments,
    }));

    return NextResponse.json(leaveRequests);
  } catch (error) {
    console.error('API Error fetching leave requests:', error);
    return NextResponse.json({ message: 'Failed to fetch leave requests' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = leaveRequestSchema.safeParse(body);

    if (!validation.success) {
        return NextResponse.json({ message: 'Invalid input.', errors: validation.error.issues }, { status: 400 });
    }

    // The `employeeId` from the frontend is the employee's database UUID now
    const { employeeId, leaveType, startDate, endDate, reason } = validation.data;

    const { rows } = await db.query(
      `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'Pending')
       RETURNING *`,
      [employeeId, leaveType, startDate, endDate, reason]
    );

    return NextResponse.json(rows[0], { status: 201 });

  } catch (error) {
    console.error('API Error creating leave request:', error);
    return NextResponse.json({ message: 'Failed to create leave request' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const { status } = await req.json();

        if (!id || !status) {
            return NextResponse.json({ message: 'Missing request ID or status' }, { status: 400 });
        }

        if (!['Approved', 'Rejected'].includes(status)) {
            return NextResponse.json({ message: 'Invalid status value' }, { status: 400 });
        }

        const { rows } = await db.query(
            'UPDATE leave_requests SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ message: 'Leave request not found' }, { status: 404 });
        }

        return NextResponse.json(rows[0]);

    } catch (error) {
        console.error('API Error updating leave request:', error);
        return NextResponse.json({ message: 'Failed to update leave request' }, { status: 500 });
    }
}
