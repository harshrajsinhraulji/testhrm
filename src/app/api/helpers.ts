
import jwt from 'jsonwebtoken';
import type { UserRole } from '@/lib/types';
import { NextRequest } from 'next/server';

/**
 * Decodes the JWT from the Authorization header and returns the user's role.
 * This is the single source of truth for API authorization.
 * @param req The NextRequest object from the API route.
 * @returns The user's role ('Admin', 'HR', 'Employee') or null if token is invalid or missing.
 */
export const getRoleFromToken = (req: NextRequest): UserRole | null => {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
        console.error("Authorization token is missing.");
        return null;
    }

    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("JWT_SECRET is not set in environment variables.");
        }
        const decoded = jwt.verify(token, secret) as { userId: string, role: UserRole };
        return decoded.role;
    } catch (error) {
        console.error("Invalid token:", error);
        return null;
    }
}
