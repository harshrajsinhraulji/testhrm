"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "../ui/badge";
import type { User } from "@/lib/types";
import { Button } from "../ui/button";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";

interface FilteredEmployeeRosterProps {
  employees: User[];
}

export function FilteredEmployeeRoster({ employees }: FilteredEmployeeRosterProps) {
  const router = useRouter();

  const handleViewProfile = (employeeId: string) => {
    router.push(`/dashboard/employees/${employeeId}`);
  };

  return (
    <div className="w-full">
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
                {employees.length > 0 ? employees.map((employee) => (
                    <TableRow key={employee.id}>
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
                            No employees match the current filter.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
  );
}
