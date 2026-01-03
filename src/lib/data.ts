import type { User, Employee, AttendanceRecord, LeaveRequest, PaySlip, SalaryStructure } from './types';

export const mockEmployees: (User & { employeeDetails: Employee })[] = [
  {
    id: 'user-1',
    name: 'Sarah Chen',
    email: 'sarah.chen@dayflow.com',
    role: 'Admin',
    avatarUrl: 'https://picsum.photos/seed/sarah/100/100',
    employeeDetails: {
      employeeId: 'DF001',
      department: 'Management',
      position: 'HR Manager',
      dateOfJoining: '2020-01-15',
      contactNumber: '123-456-7890',
      address: '123 Tech Avenue, Silicon Valley, CA',
      emergencyContact: { name: 'John Chen', relationship: 'Spouse', phone: '111-222-3333' }
    }
  },
  {
    id: 'user-2',
    name: 'Mike Rivera',
    email: 'mike.rivera@dayflow.com',
    role: 'Employee',
    avatarUrl: 'https://picsum.photos/seed/mike/100/100',
    employeeDetails: {
      employeeId: 'DF002',
      department: 'Engineering',
      position: 'Frontend Developer',
      dateOfJoining: '2022-06-01',
      contactNumber: '098-765-4321',
      address: '456 Code Lane, San Francisco, CA',
      emergencyContact: { name: 'Maria Rivera', relationship: 'Sister', phone: '444-555-6666' }
    }
  },
  {
    id: 'user-3',
    name: 'Emily Carter',
    email: 'emily.carter@dayflow.com',
    role: 'Employee',
    avatarUrl: 'https://picsum.photos/seed/emily/100/100',
    employeeDetails: {
      employeeId: 'DF003',
      department: 'Design',
      position: 'UI/UX Designer',
      dateOfJoining: '2021-09-20',
      contactNumber: '555-666-7777',
      address: '789 Pixel Road, Oakland, CA',
      emergencyContact: { name: 'David Carter', relationship: 'Brother', phone: '888-999-0000' }
    }
  },
  {
    id: 'user-4',
    name: 'David Lee',
    email: 'david.lee@dayflow.com',
    role: 'HR',
    avatarUrl: 'https://picsum.photos/seed/david/100/100',
    employeeDetails: {
      employeeId: 'DF004',
      department: 'HR',
      position: 'HR Specialist',
      dateOfJoining: '2023-02-10',
      contactNumber: '222-333-4444',
      address: '321 People St, San Jose, CA',
      emergencyContact: { name: 'Sophia Lee', relationship: 'Wife', phone: '111-333-5555' }
    }
  }
];

export const mockUsers: User[] = mockEmployees.map(({ employeeDetails, ...user }) => user);

export const getEmployeeDataForUser = (userId: string): User | null => {
    return mockEmployees.find(emp => emp.id === userId) || null;
}

export const mockAttendance: AttendanceRecord[] = [
  { id: 'att-1', employeeId: 'DF001', date: '2024-07-29', status: 'Present', checkIn: '09:05 AM', checkOut: '05:02 PM' },
  { id: 'att-2', employeeId: 'DF002', date: '2024-07-29', status: 'Present', checkIn: '09:15 AM', checkOut: '05:30 PM' },
  { id: 'att-3', employeeId: 'DF003', date: '2024-07-29', status: 'Leave', },
  { id: 'att-4', employeeId: 'DF004', date: '2024-07-29', status: 'Present', checkIn: '08:58 AM', checkOut: '05:00 PM' },
  { id: 'att-5', employeeId: 'DF002', date: '2024-07-28', status: 'Half-day', checkIn: '09:00 AM', checkOut: '01:00 PM' },
];

export const mockLeaveRequests: LeaveRequest[] = [
  { id: 'leave-1', employeeId: 'DF003', employeeName: 'Emily Carter', leaveType: 'Paid', startDate: '2024-07-29', endDate: '2024-07-30', reason: 'Family vacation', status: 'Approved' },
  { id: 'leave-2', employeeId: 'DF002', employeeName: 'Mike Rivera', leaveType: 'Sick', startDate: '2024-08-05', endDate: '2024-08-05', reason: 'Fever and cold', status: 'Pending' },
  { id: 'leave-3', employeeId: 'DF004', employeeName: 'David Lee', leaveType: 'Unpaid', startDate: '2024-07-22', endDate: '2024-07-22', reason: 'Personal appointment', status: 'Rejected', comments: 'Insufficient notice' },
];

export const mockSalaryStructures: SalaryStructure[] = [
    { employeeId: 'DF001', basicSalary: 80000, hra: 32000, otherAllowances: 10000, pf: 5000, tax: 15000 },
    { employeeId: 'DF002', basicSalary: 60000, hra: 24000, otherAllowances: 8000, pf: 4000, tax: 10000 },
    { employeeId: 'DF003', basicSalary: 55000, hra: 22000, otherAllowances: 7000, pf: 3500, tax: 8000 },
    { employeeId: 'DF004', basicSalary: 65000, hra: 26000, otherAllowances: 8500, pf: 4500, tax: 12000 },
];

export const mockPaySlips: PaySlip[] = [
    { id: 'ps-1', employeeId: 'DF002', month: 'June', year: 2024, basicSalary: 5000, allowances: 2000, deductions: 500, netSalary: 6500 },
    { id: 'ps-2', employeeId: 'DF002', month: 'May', year: 2024, basicSalary: 5000, allowances: 2000, deductions: 500, netSalary: 6500 },
    { id: 'ps-3', employeeId: 'DF002', month: 'April', year: 2024, basicSalary: 5000, allowances: 2000, deductions: 500, netSalary: 6500 },
];
