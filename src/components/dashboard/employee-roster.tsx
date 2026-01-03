
"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import type { User } from "@/lib/types";

export function EmployeeRoster() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        setLoading(true);
        const response = await fetch('/api/employees');
        if (!response.ok) {
          throw new Error('Failed to fetch employees');
        }
        const data = await response.json();
        // The API returns employee details directly, so we can map them.
        const users: User[] = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            email: item.email,
            role: item.role,
            avatarUrl: item.avatar_url,
            employeeDetails: {
                employeeId: item.employee_id,
                department: item.department,
                position: item.position,
                // Add default empty strings for other details not fetched here
                dateOfJoining: '',
                contactNumber: '',
                address: '',
                emergencyContact: { name: '', relationship: '', phone: '' }
            }
        }));
        setEmployees(users);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="max-h-[350px] overflow-auto">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Role</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {employees.length > 0 ? employees.map((employee) => (
                    <TableRow key={employee.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={employee.avatarUrl} alt={employee.name} />
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
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                            No employees found. Try signing up a new user.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
  );
}
