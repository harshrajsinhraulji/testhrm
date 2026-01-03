import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic'; // Ensures the route is not cached

export async function GET() {
  try {
    // Selects all the columns needed, including the unique UUID `id`.
    const { rows } = await db.query('SELECT id, employee_id, name, email, role, department, avatar_url, position FROM employees');
    
    // The Next.js Response object is extended by NextResponse
    // to provide better TypeScript support and helper functions.
    return NextResponse.json(rows);
  } catch (error) {
    console.error('API Error fetching employees:', error);
    // Return a standard error response.
    return NextResponse.json({ message: 'Failed to fetch employees' }, { status: 500 });
  }
}
