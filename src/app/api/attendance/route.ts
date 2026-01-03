
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { z } from 'zod';

const attendanceSchema = z.object({
  employeeId: z.string().uuid(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');

    let query = 'SELECT * FROM attendance_records';
    const params = [];

    if (employeeId) {
      query += ' WHERE employee_id = $1 ORDER BY record_date DESC';
      params.push(employeeId);
    } else {
      // This part could be enhanced for admin roles, e.g., fetching all for a certain date
      query += ' ORDER BY record_date DESC, employee_id';
    }

    const { rows } = await db.query(query, params);
    
    // Map database snake_case to camelCase
    const attendanceRecords = rows.map(row => ({
        id: row.id,
        employeeId: row.employee_id,
        date: new Date(row.record_date).toISOString().split('T')[0],
        status: row.status,
        checkIn: row.check_in_time ? new Date(row.check_in_time).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }) : null,
        checkOut: row.check_out_time ? new Date(row.check_out_time).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }) : null,
    }));


    return NextResponse.json(attendanceRecords);
  } catch (error) {
    console.error('API Error fetching attendance:', error);
    return NextResponse.json({ message: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { employeeId, action } = await req.json();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    if (action === 'checkin') {
      // Upsert logic: Insert a new record or update the status if one exists for today
      const { rows } = await db.query(
        `INSERT INTO attendance_records (employee_id, record_date, status, check_in_time)
         VALUES ($1, $2, 'Present', $3)
         ON CONFLICT (employee_id, record_date)
         DO UPDATE SET status = 'Present', check_in_time = $3
         RETURNING *`,
        [employeeId, today, now]
      );
      return NextResponse.json(rows[0]);
    } else if (action === 'checkout') {
      const { rows } = await db.query(
        `UPDATE attendance_records
         SET check_out_time = $1
         WHERE employee_id = $2 AND record_date = $3
         RETURNING *`,
        [now, employeeId, today]
      );
      if (rows.length === 0) {
        return NextResponse.json({ message: 'No check-in record found for today.' }, { status: 404 });
      }
      return NextResponse.json(rows[0]);
    }

    return NextResponse.json({ message: 'Invalid action.' }, { status: 400 });

  } catch (error) {
    console.error('API Error updating attendance:', error);
    return NextResponse.json({ message: 'Failed to update attendance' }, { status: 500 });
  }
}

