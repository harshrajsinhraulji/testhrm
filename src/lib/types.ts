

export type UserRole = "Admin" | "HR" | "Employee";

export interface User {
  id: string; // This is the Firebase Auth UID or DB UUID for non-firebase auth
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  employeeDetails?: Employee;
}

export interface Employee {
  id: string; // This is the employee record's primary key (UUID) from the database
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
  employeeId: string; // Should be the Employee DB UUID
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
}

export type LeaveType = "Paid" | "Sick" | "Unpaid" | "Maternity";
export type LeaveStatus = "Pending" | "Approved" | "Rejected";

export interface LeaveRequest {
  id: string;
  employeeId: string; // Employee DB UUID
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
  employeeId: string; // Employee DB UUID
  employeeName?: string;
  employeeCode?: string;
  position?: string;
  department?: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
}

export interface SalaryStructure {
  employeeDbId: string; // The database UUID for the employee
  employeeId: string; // This is the human-readable ID like "DF001"
  employeeName?: string; // Name of the employee
  basicSalary: number;
  hra: number;
  otherAllowances: number;
  pf: number;
  tax: number;
}
