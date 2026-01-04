"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "../ui/badge";
import type { User, LeaveRequest, AttendanceRecord } from "@/lib/types";
import { Button } from "../ui/button";
import { Eye, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

type EmployeeFilter = 'all' | 'present' | 'absent' | 'onLeave';

interface FilteredEmployeeRosterProps {
  department: string | null;
  statusFilter: EmployeeFilter;
  onClearDepartment: () => void;
}

export function FilteredEmployeeRoster({ department, statusFilter, onClearDepartment }: FilteredEmployeeRosterProps) {
  const router = useRouter();
  const [employees, setEmployees] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        setLoading(true);
        try {
            const [employeesRes, attendanceRes, leaveRes] = await Promise.all([
                fetch('/api/employees'),
                fetch('/api/attendance'),
                fetch('/api/leave'),
            ]);
            const employeeData = await employeesRes.json();
            const users: User[] = employeeData.map((item: any) => ({
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
                    dateOfJoining: '', contactNumber: '', address: '',
                    emergencyContact: { name: '', relationship: '', phone: '' }
                }
            }));

            setEmployees(users);
            setAttendance(await attendanceRes.json());
            setLeaveRequests(await leaveRes.json());

        } catch (error) {
            console.error("Failed to fetch roster data", error);
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, []);

  const filteredEmployees = useMemo(() => {
    let departmentFiltered = department ? employees.filter(e => e.employeeDetails?.department === department) : employees;
    
    const today = new Date().toISOString().split('T')[0];
    const presentIds = new Set(attendance.filter(a => a.date === today && a.status === 'Present').map(a => a.employeeId));
    const onLeaveIds = new Set(leaveRequests.filter(l => l.status === 'Approved' && new Date(today) >= new Date(l.startDate) && new Date(today) <= new Date(l.endDate)).map(l => l.employeeId));

    switch (statusFilter) {
      case 'present':
        return departmentFiltered.filter(e => presentIds.has(e.id));
      case 'onLeave':
        return departmentFiltered.filter(e => onLeaveIds.has(e.id));
      case 'absent':
        return departmentFiltered.filter(e => !presentIds.has(e.id) && !onLeaveIds.has(e.id));
      default: // 'all'
        return departmentFiltered;
    }
  }, [department, statusFilter, employees, attendance, leaveRequests]);

  const getRosterTitleAndDescription = () => {
    let title = "Employee Roster";
    let description = "A complete list of all employees.";
    
    if (department) {
        title = `Employees in ${department}`;
        description = `A list of all employees in the ${department} department.`;
    }

    if (statusFilter !== 'all') {
        title = `Employees ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`;
        description = `Employees matching the status '${statusFilter}' for today.`;
        if (department) {
            title += ` in ${department}`;
            description = `Employees in ${department} matching the status '${statusFilter}'.`
        }
    }

    return { title, description };
  }
  
  const { title, description } = getRosterTitleAndDescription();

  const handleViewProfile = (employeeId: string) => {
    router.push(`/dashboard/employees/${employeeId}`);
  };

  return (
    <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
                {department && (
                    <Button variant="ghost" size="sm" onClick={onClearDepartment}>
                        <X className="mr-2 h-4 w-4" />
                        Clear Filter
                    </Button>
                )}
            </div>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredEmployees.length > 0 ? filteredEmployees.map((employee) => (
                            <TableRow key={employee.id} className="hover:bg-muted/50">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={employee.avatarUrl} alt={employee.name} className="object-cover"/>
                                            <AvatarFallback>{employee.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="grid gap-0.5">
                                            <p className="font-medium">{employee.name}</p>
                                            <p className="text-xs text-muted-foreground">{employee.employeeDetails?.employeeId}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{employee.employeeDetails?.department || 'N/A'}</TableCell>
                                <TableCell>
                                    <Badge variant={employee.role === 'Admin' ? 'default' : 'secondary'}>{employee.role}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => handleViewProfile(employee.id)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View
                                </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No employees match the current filters.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
        </CardContent>
    </Card>
  );
}
