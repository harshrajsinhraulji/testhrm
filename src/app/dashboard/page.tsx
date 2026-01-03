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
import { useEffect, useState, useMemo } from 'react';
import type { User, AttendanceRecord, LeaveRequest } from '@/lib/types';
import { FilteredEmployeeRoster } from '@/components/dashboard/filtered-employee-roster';
import { Skeleton } from '@/components/ui/skeleton';


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
  const [employees, setEmployees] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(isAdminOrHR);

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
    
    const today = new Date().toISOString().split('T')[0];
    
    const presentIds = new Set(attendance.filter(a => a.date === today && a.status === 'Present').map(a => a.employeeId));
    const onLeaveIds = new Set(leaveRequests.filter(l => l.status === 'Approved' && new Date(today) >= new Date(l.startDate) && new Date(today) <= new Date(l.endDate)).map(l => l.employeeId));

    switch (activeFilter) {
      case 'all':
        return employees;
      case 'present':
        return employees.filter(e => presentIds.has(e.id));
      case 'onLeave':
        return employees.filter(e => onLeaveIds.has(e.id));
      case 'absent':
        return employees.filter(e => !presentIds.has(e.id) && !onLeaveIds.has(e.id));
      default:
        return employees;
    }
  }, [activeFilter, employees, attendance, leaveRequests, isAdminOrHR]);
  
  const getRosterTitleAndDescription = () => {
    switch (activeFilter) {
        case 'all': return { title: 'All Employees', description: 'A complete list of all employees.' };
        case 'present': return { title: 'Employees Present Today', description: 'Employees who have checked in today.' };
        case 'onLeave': return { title: 'Employees on Leave', description: 'Employees with an approved leave request for today.' };
        case 'absent': return { title: 'Absent Employees', description: 'Employees not present or on approved leave today.' };
        default: return { title: 'Employee Roster', description: 'An overview of all employees.' };
    }
  }

  const rosterInfo = getRosterTitleAndDescription();


  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      {isAdminOrHR ? (
        <>
          <StatsCards 
            activeFilter={activeFilter} 
            onFilterChange={setActiveFilter}
            employees={employees}
            attendance={attendance}
            leaveRequests={leaveRequests}
          />
          <AdminCharts />
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>{rosterInfo.title}</CardTitle>
                <CardDescription>
                  {rosterInfo.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : (
                    <FilteredEmployeeRoster employees={filteredEmployees} />
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Leave Requests</CardTitle>
                <CardDescription>
                  A summary of the most recent leave requests.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentLeaveRequests />
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <EmployeeDashboardCards />
          <EmployeeCharts />
        </div>
      )}
    </div>
  );
}
