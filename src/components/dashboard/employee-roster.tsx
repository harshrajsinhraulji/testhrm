
"use client";

import { mockEmployees } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "../ui/badge";

export function EmployeeRoster() {
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
                {mockEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={employee.avatarUrl} alt={employee.name} />
                                    <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-0.5">
                                    <p className="font-medium">{employee.name}</p>
                                    <p className="text-xs text-muted-foreground">{employee.employeeDetails.employeeId}</p>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>{employee.employeeDetails.department}</TableCell>
                        <TableCell>
                            <Badge variant={employee.role === 'Admin' ? 'default' : 'secondary'}>{employee.role}</Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
  );
}
