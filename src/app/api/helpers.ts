
import jwt from 'jsonwebtoken';
import type { UserRole } from '@/lib/types';

// Helper to decode JWT and get user role
export const getRoleFromToken = (req: Request): UserRole | null => {
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
