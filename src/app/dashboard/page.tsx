'use client';

import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentLeaveRequests } from '@/components/dashboard/recent-leave-requests';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { AdminCharts } from '@/components/dashboard/admin-charts';
import { EmployeeCharts } from '@/components/dashboard/employee-charts';
import { EmployeeDashboardCards } from '@/components/dashboard/employee-dashboard-cards';
import { useEffect, useState, useMemo, useRef } from 'react';
import type { User, AttendanceRecord, LeaveRequest } from '@/lib/types';
import { FilteredEmployeeRoster } from '@/components/dashboard/filtered-employee-roster';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { DailyStatusList } from '@/components/dashboard/daily-status-list';


const getWelcomeContent = (role: string | null, name?: string) => {
  switch (role) {
    case 'Admin':
      return {
        title: 'Admin Dashboard',
        description: "Here's a summary of HR activities today.",
      };
    case 'HR':
      return {
        title: `Welcome, ${name}!`,
        description: "Here's an overview of employee management.",
      };
    case 'Employee':
    default:
      return {
        title: `Welcome, ${name}!`,
        description:
          'Manage your profile, attendance, and leave requests.',
      };
  }
};

type EmployeeFilter = 'all' | 'present' | 'absent' | 'onLeave';


export default function DashboardPage() {
  const { user, role } = useAuth();
  const { title, description } = getWelcomeContent(role, user?.name);
  const isAdminOrHR = role === 'Admin' || role === 'HR';
  
  const [activeFilter, setActiveFilter] = useState<EmployeeFilter>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(isAdminOrHR);
  const rosterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAdminOrHR) return;

    async function fetchDashboardData() {
      setLoading(true);
      try {
        const [employeesRes, attendanceRes, leaveRes] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/attendance'),
          fetch('/api/leave'),
        ]);

        if (!employeesRes.ok) throw new Error('Failed to fetch employees');
        if (!attendanceRes.ok) throw new Error('Failed to fetch attendance');
        if (!leaveRes.ok) throw new Error('Failed to fetch leave requests');

        const employeeData: User[] = (await employeesRes.json()).map((item: any) => ({
             id: item.id,
            name: item.name,
            email: item.email,
            role: item.role,
            avatarUrl: item.avatar_url,
            employeeDetails: {
                id: item.id,
                employeeId: item.employee_id,
                department: item.department,
                position: item.position,
                dateOfJoining: '',
                contactNumber: '',
                address: '',
                emergencyContact: { name: '', relationship: '', phone: '' }
            }
        }));
        const attendanceData = await attendanceRes.json();
        const leaveData = await leaveRes.json();

        setEmployees(employeeData);
        setAttendance(attendanceData);
        setLeaveRequests(leaveData);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [isAdminOrHR]);


  const filteredEmployees = useMemo(() => {
    if (!isAdminOrHR) return [];
    
    let departmentFiltered = employees;
    if (selectedDepartment) {
      departmentFiltered = employees.filter(e => e.employeeDetails?.department === selectedDepartment);
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    const presentIds = new Set(attendance.filter(a => a.date === today && a.status === 'Present').map(a => a.employeeId));
    const onLeaveIds = new Set(leaveRequests.filter(l => l.status === 'Approved' && new Date(today) >= new Date(l.startDate) && new Date(today) <= new Date(l.endDate)).map(l => l.employeeId));

    switch (activeFilter) {
      case 'all':
        return departmentFiltered;
      case 'present':
        return departmentFiltered.filter(e => presentIds.has(e.id));
      case 'onLeave':
        return departmentFiltered.filter(e => onLeaveIds.has(e.id));
      case 'absent':
        return departmentFiltered.filter(e => !presentIds.has(e.id) && !onLeaveIds.has(e.id));
      default:
        return departmentFiltered;
    }
  }, [activeFilter, selectedDepartment, employees, attendance, leaveRequests, isAdminOrHR]);
  
  
  const handleDepartmentSelect = (department: string | null) => {
    setSelectedDepartment(department);
    // Scroll to the roster section when a department is selected
    if (department) {
      rosterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      {isAdminOrHR ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
             <StatsCards 
                activeFilter={activeFilter} 
                onFilterChange={setActiveFilter}
                employees={employees}
                attendance={attendance}
                leaveRequests={leaveRequests}
              />
               <DailyStatusList 
                employees={employees}
                attendance={attendance}
                leaveRequests={leaveRequests}
              />
              <div ref={rosterRef}>
                <FilteredEmployeeRoster 
                    department={selectedDepartment}
                    statusFilter={activeFilter}
                    onClearDepartment={() => setSelectedDepartment(null)}
                />
              </div>
          </div>
          <div className="lg:col-span-1 space-y-6">
             <AdminCharts onDepartmentSelect={handleDepartmentSelect} selectedDepartment={selectedDepartment} />
             <Card className="h-full">
                <CardHeader>
                  <CardTitle>Recent Leave Requests</CardTitle>
                  <CardDescription>
                    A summary of the most recent leave requests.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentLeaveRequests employees={employees} />
                </CardContent>
              </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <EmployeeDashboardCards />
          <EmployeeCharts />
        </div>
      )}
    </div>
  );
}
