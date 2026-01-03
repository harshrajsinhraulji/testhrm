

export type UserRole = "Admin" | "HR" | "Employee";
export type EmployeeUUID = string;

export interface User {
  id: string; // This is the Firebase Auth UID
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  is_verified?: boolean;
  employeeDetails?: Employee;
}

export interface Employee {
  id: EmployeeUUID; // This is the employee record's primary key (UUID) from the database
  employeeId: string; // This is the human-readable ID like "DF001"
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
  employeeId: EmployeeUUID;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
}

export type LeaveType = "Paid" | "Sick" | "Unpaid" | "Maternity";
export type LeaveStatus = "Pending" | "Approved" | "Rejected";

export interface LeaveRequest {
  id: string;
  employeeId: EmployeeUUID;
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
