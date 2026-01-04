
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { z } from 'zod';
import { differenceInMinutes } from 'date-fns';

const attendanceSchema = z.object({
  employeeId: z.string().uuid(),
});

// Helper to format minutes into "Xh Ym"
const formatMinutes = (minutes: number) => {
    if (minutes < 0) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
};


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
      query += ' ORDER BY record_date DESC, employee_id';
    }

    const { rows } = await db.query(query, params);
    
    // Map database snake_case to camelCase and calculate total hours
    const attendanceRecords = rows.map(row => {
        let totalHours = null;
        if (row.check_in_time && row.check_out_time) {
            const minutes = differenceInMinutes(new Date(row.check_out_time), new Date(row.check_in_time));
            totalHours = formatMinutes(minutes);
        }

        return {
            id: row.id,
            employeeId: row.employee_id,
            date: new Date(row.record_date).toISOString().split('T')[0],
            status: row.status,
            checkIn: row.check_in_time ? new Date(row.check_in_time).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }) : null,
            checkOut: row.check_out_time ? new Date(row.check_out_time).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }) : null,
            totalHours, // Add the calculated total hours
        }
    });


    return NextResponse.json(attendanceRecords);
  } catch (error) {
    console.error('API Error fetching attendance:', error);
    return NextResponse.json({ message: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const client = await db.connect();
  try {
    const { employeeId, action } = await req.json();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMonth = now.toLocaleString('default', { month: 'long' });
    const currentYear = now.getFullYear();

    // --- PAYROLL LOCK-OUT CHECK ---
    const { rows: existingSlips } = await client.query(
      `SELECT id FROM pay_slips WHERE employee_id = $1 AND month = $2 AND year = $3`,
      [employeeId, currentMonth, currentYear]
    );

    if (existingSlips.length > 0) {
      return NextResponse.json({ message: 'Cannot mark attendance. Payroll for this month has already been finalized.' }, { status: 403 }); // 403 Forbidden
    }
    // --- END CHECK ---

    await client.query('BEGIN');

    if (action === 'checkin') {
      const { rows } = await client.query(
        `INSERT INTO attendance_records (employee_id, record_date, status, check_in_time)
         VALUES ($1, $2, 'Present', $3)
         ON CONFLICT (employee_id, record_date)
         DO UPDATE SET status = 'Present', check_in_time = $3
         RETURNING *`,
        [employeeId, today, now]
      );
      await client.query('COMMIT');
      return NextResponse.json(rows[0]);
    } else if (action === 'checkout') {
      const { rows } = await client.query(
        `UPDATE attendance_records
         SET check_out_time = $1
         WHERE employee_id = $2 AND record_date = $3
         RETURNING *`,
        [now, employeeId, today]
      );
      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'No check-in record found for today.' }, { status: 404 });
      }
      await client.query('COMMIT');
      return NextResponse.json(rows[0]);
    }

    await client.query('ROLLBACK');
    return NextResponse.json({ message: 'Invalid action.' }, { status: 400 });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('API Error updating attendance:', error);
    return NextResponse.json({ message: 'Failed to update attendance' }, { status: 500 });
  } finally {
    client.release();
  }
}
