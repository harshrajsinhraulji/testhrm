
import type { User, Employee, AttendanceRecord, LeaveRequest, PaySlip, SalaryStructure } from './types';

// Mock data is cleared. The application will now rely on database calls.

export const mockEmployees: (User & { employeeDetails: Employee, password?: string })[] = [];

export const mockUsers: User[] = [];

export const getEmployeeDataForUser = (userId: string): User | null => {
    // This function will need to be replaced with a database call.
    return null;
}

export let mockAttendance: AttendanceRecord[] = [];

export let mockLeaveRequests: LeaveRequest[] = [];

export const mockSalaryStructures: SalaryStructure[] = [];

export const mockPaySlips: PaySlip[] = [];
