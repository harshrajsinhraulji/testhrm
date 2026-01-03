
import type { User, Employee, AttendanceRecord, LeaveRequest, PaySlip, SalaryStructure } from './types';

// Function to generate random attendance data for the last few months
const generateMockAttendance = (employeeId: string, joinDate: string): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  let currentDate = new Date(joinDate);

  while (currentDate <= today) {
    const dayOfWeek = currentDate.getDay();
    // No records for weekends
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const chance = Math.random();
      let status: 'Present' | 'Absent' | 'Half-day' | 'Leave' = 'Present';
      let checkIn: string | undefined = '09:00 AM';
      let checkOut: string | undefined = '05:00 PM';

      if (chance < 0.05) { // 5% chance of being absent
        status = 'Absent';
        checkIn = undefined;
        checkOut = undefined;
      } else if (chance < 0.1) { // 5% chance of half-day
        status = 'Half-day';
        checkOut = '01:00 PM';
      } else if (chance < 0.12) { // 2% chance of being on leave
        status = 'Leave';
        checkIn = undefined;
        checkOut = undefined;
      }
      
      records.push({
        id: `att-${employeeId}-${records.length}`,
        employeeId,
        date: currentDate.toISOString().split('T')[0],
        status,
        checkIn,
        checkOut,
      });
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return records;
}


export const mockEmployees: (User & { employeeDetails: Employee, password?: string })[] = [
  {
    id: 'user-1',
    name: 'Sarah Chen',
    email: 'admin@dayflow.com',
    password: 'admin',
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
    email: 'user@dayflow.com',
    password: 'user',
    role: 'Employee',
    avatarUrl: 'https://picsum.photos/seed/mike/100/100',
    employeeDetails: {
      employeeId: 'DF002',
      department: 'Engineering',
      position: 'Frontend Developer',
      dateOfJoining: '2023-06-01',
      contactNumber: '098-765-4321',
      address: '456 Code Lane, San Francisco, CA',
      emergencyContact: { name: 'Maria Rivera', relationship: 'Sister', phone: '444-555-6666' }
    }
  },
  {
    id: 'user-3',
    name: 'Emily Carter',
    email: 'emily.carter@dayflow.com',
    password: 'password123',
    role: 'Employee',
    avatarUrl: 'https://picsum.photos/seed/emily/100/100',
    employeeDetails: {
      employeeId: 'DF003',
      department: 'Design',
      position: 'UI/UX Designer',
      dateOfJoining: '2023-09-20',
      contactNumber: '555-666-7777',
      address: '789 Pixel Road, Oakland, CA',
      emergencyContact: { name: 'David Carter', relationship: 'Brother', phone: '888-999-0000' }
    }
  },
  {
    id: 'user-4',
    name: 'David Lee',
    email: 'david.lee@dayflow.com',
    password: 'password123',
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

export const mockUsers: User[] = mockEmployees.map(({ employeeDetails, password, ...user }) => user);

export const getEmployeeDataForUser = (userId: string): User | null => {
    return mockEmployees.find(emp => emp.id === userId) || null;
}

export let mockAttendance: AttendanceRecord[] = mockEmployees.flatMap(emp => 
  generateMockAttendance(emp.employeeDetails.employeeId, emp.employeeDetails.dateOfJoining)
);

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
