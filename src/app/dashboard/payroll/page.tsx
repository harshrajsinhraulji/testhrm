"use client";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/componentsui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { mockPaySlips, mockSalaryStructures } from "@/lib/data";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export default function PayrollPage() {
  const { user, role } = useAuth();

  const userPaySlips = mockPaySlips.filter(p => p.employeeId === user?.employeeDetails?.employeeId);

  return (
    <div>
      <PageHeader
        title="Payroll"
        description="View your payroll information and salary details."
      />
      {role === "Admin" || role === "HR" ? (
        <Card>
          <CardHeader>
            <CardTitle>Employee Salary Structures</CardTitle>
            <CardDescription>View and manage salary details for all employees.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>HRA</TableHead>
                  <TableHead>PF</TableHead>
                  <TableHead>Total CTC</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSalaryStructures.map((structure) => (
                  <TableRow key={structure.employeeId}>
                    <TableCell className="font-medium">{structure.employeeId}</TableCell>
                    <TableCell>{formatCurrency(structure.basicSalary)}</TableCell>
                    <TableCell>{formatCurrency(structure.hra)}</TableCell>
                    <TableCell>{formatCurrency(structure.pf)}</TableCell>
                    <TableCell>{formatCurrency(structure.basicSalary + structure.hra + structure.otherAllowances)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit Structure</DropdownMenuItem>
                          <DropdownMenuItem>View Payslips</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Pay Slips</CardTitle>
            <CardDescription>A history of your monthly salary statements.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userPaySlips.map((slip) => (
                  <TableRow key={slip.id}>
                    <TableCell className="font-medium">{slip.month} {slip.year}</TableCell>
                    <TableCell>{formatCurrency(slip.netSalary)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">Download</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
