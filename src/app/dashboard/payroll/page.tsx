
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import type { PaySlip, SalaryStructure } from "@/lib/types";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

export default function PayrollPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [paySlips, setPaySlips] = useState<PaySlip[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayrollData() {
      if (!user) return;
      setLoading(true);
      try {
        if (role === 'Admin' || role === 'HR') {
          // Fetch all salary structures for admin
          const res = await fetch('/api/payroll');
          if (!res.ok) throw new Error("Failed to fetch salary structures.");
          const data = await res.json();
          setSalaryStructures(data);
        } else {
          // Fetch payslips for the logged-in employee
          const res = await fetch(`/api/payroll?employeeId=${user.employeeDetails?.id}`);
          if (!res.ok) throw new Error("Failed to fetch your payslips.");
          const data = await res.json();
          setPaySlips(data);
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchPayrollData();
  }, [user, role, toast]);

  const isAdminOrHR = role === "Admin" || role === "HR";

  return (
    <div>
      <PageHeader
        title="Payroll"
        description={isAdminOrHR ? "View and manage employee salary details." : "View your payroll information and salary details."}
      />
      {isAdminOrHR ? (
        <Card>
          <CardHeader>
            <CardTitle>Employee Salary Structures</CardTitle>
            <CardDescription>View and manage salary details for all employees.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Basic Salary</TableHead>
                    <TableHead>HRA</TableHead>
                    <TableHead>PF</TableHead>
                    <TableHead>Total CTC</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryStructures.length > 0 ? salaryStructures.map((structure) => (
                    <TableRow key={structure.employeeId}>
                      <TableCell className="font-medium">
                        <div className="font-medium">{structure.employeeName}</div>
                        <div className="text-xs text-muted-foreground">{structure.employeeId}</div>
                      </TableCell>
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
                            <DropdownMenuItem disabled>Edit Structure</DropdownMenuItem>
                            <DropdownMenuItem disabled>View Payslips</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            No salary structures found.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Pay Slips</CardTitle>
            <CardDescription>A history of your monthly salary statements.</CardDescription>
          </CardHeader>
          <CardContent>
             {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paySlips.length > 0 ? paySlips.map((slip) => (
                    <TableRow key={slip.id}>
                      <TableCell className="font-medium">{slip.month} {slip.year}</TableCell>
                      <TableCell>{formatCurrency(slip.netSalary)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" disabled>Download</Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                     <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                            No payslips available for your account.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
