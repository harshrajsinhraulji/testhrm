"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import type { PaySlip, SalaryStructure } from "@/lib/types";
import { MoreHorizontal, Pencil, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EditSalaryForm } from "@/components/payroll/edit-salary-form";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

export default function PayrollPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [paySlips, setPaySlips] = useState<PaySlip[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<SalaryStructure | null>(null);

  const fetchPayrollData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (role === 'Admin' || role === 'HR') {
        const res = await fetch('/api/payroll');
        if (!res.ok) throw new Error("Failed to fetch salary structures.");
        const data = await res.json();
        setSalaryStructures(data);
      } else {
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

  useEffect(() => {
    if (user) {
      fetchPayrollData();
    }
  }, [user]);

  const handleEditClick = (structure: SalaryStructure) => {
    setSelectedStructure(structure);
    setIsFormOpen(true);
  };

  const onFormSubmit = () => {
    fetchPayrollData();
    setIsFormOpen(false);
  }
  
  const handleGenerateSlips = async () => {
    try {
      const res = await fetch('/api/payroll/generate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to generate payslips.");
      toast({
        title: "Payslips Generated",
        description: data.message,
      });
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }

  const isAdminOrHR = role === "Admin" || role === "HR";

  if (loading) {
     return (
        <div className="space-y-6">
            <PageHeader
                title="Payroll"
                description={isAdminOrHR ? "View and manage employee salary details." : "View your payroll information and salary details."}
            />
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
     )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description={isAdminOrHR ? "View and manage employee salary details." : "View your payroll information and salary details."}
      >
        {isAdminOrHR && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Generate Slips for Month
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will generate new payslips for all employees for the current month based on their saved salary structures. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleGenerateSlips}>Generate</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </PageHeader>
      {isAdminOrHR ? (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Employee Salary Structures</CardTitle>
                    <CardDescription>View and manage salary details for all employees.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead className="text-right">Basic Salary</TableHead>
                            <TableHead className="text-right">HRA</TableHead>
                            <TableHead className="text-right">PF</TableHead>
                            <TableHead className="text-right">Total CTC</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {salaryStructures.length > 0 ? salaryStructures.map((structure) => (
                            <TableRow key={structure.employeeId}>
                                <TableCell>
                                    <div className="font-medium">{structure.employeeName}</div>
                                    <div className="text-xs text-muted-foreground">{structure.employeeId}</div>
                                </TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(structure.basicSalary)}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(structure.hra)}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(structure.pf)}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(structure.basicSalary + structure.hra + structure.otherAllowances)}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEditClick(structure)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit Structure
                                            </DropdownMenuItem>
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
                </CardContent>
            </Card>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                 <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Edit Salary Structure</DialogTitle>
                        <DialogDescription>
                            Editing for {selectedStructure?.employeeName} ({selectedStructure?.employeeId})
                        </DialogDescription>
                    </DialogHeader>
                    {selectedStructure && (
                        <EditSalaryForm 
                            structure={selectedStructure}
                            onFormSubmit={onFormSubmit} 
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
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
                    <TableHead className="text-right">Net Salary</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paySlips.length > 0 ? paySlips.map((slip) => (
                    <TableRow key={slip.id}>
                      <TableCell className="font-medium">{slip.month} {slip.year}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(slip.netSalary)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/payroll/${slip.id}`}>View Details</Link>
                        </Button>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
