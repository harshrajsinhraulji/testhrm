
export type UserRole = "Admin" | "HR" | "Employee";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  is_verified?: boolean;
  employeeDetails?: Employee;
}

export interface Employee {
  employeeId: string;
  department: string;
  position: string;
  dateOfJoining: string;
  contactNumber: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export type AttendanceStatus = "Present" | "Absent" | "Half-day" | "Leave";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
}

export type LeaveType = "Paid" | "Sick" | "Unpaid" | "Maternity";
export type LeaveStatus = "Pending" | "Approved" | "Rejected";

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  comments?: string;
}

export interface PaySlip {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
}

export interface SalaryStructure {
  employeeId: string;
  basicSalary: number;
  hra: number;
  otherAllowances: number;
  pf: number;
  tax: number;
}
