
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import type { PaySlip, SalaryStructure } from "@/lib/types";
import { MoreHorizontal, Pencil, FileText, Users, ReceiptIndianRupee, AreaChart, CircleDot } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

interface PayrollStats {
    totalEmployees: number;
    totalMonthlyPayroll: number;
    averageSalary: number;
}
interface DepartmentBreakdown {
    name: string;
    total: number;
}

interface IndividualGenerationState {
  isOpen: boolean;
  employee: SalaryStructure | null;
  month: string;
  year: number;
}

export default function PayrollPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [paySlips, setPaySlips] = useState<PaySlip[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [stats, setStats] = useState<PayrollStats | null>(null);
  const [departmentBreakdown, setDepartmentBreakdown] = useState<DepartmentBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<SalaryStructure | null>(null);

  const [individualGenerateState, setIndividualGenerateState] = useState<IndividualGenerationState>({
    isOpen: false,
    employee: null,
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(),
  });

  const fetchPayrollData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (role === 'Admin' || role === 'HR') {
        const res = await fetch('/api/payroll');
        if (!res.ok) throw new Error("Failed to fetch salary structures.");
        const data = await res.json();
        setSalaryStructures(data.salaryStructures);
        setStats(data.stats);
        setDepartmentBreakdown(data.departmentBreakdown);
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
  }, [user, role]);

  const handleEditClick = (structure: SalaryStructure) => {
    setSelectedStructure(structure);
    setIsEditFormOpen(true);
  };

  const onFormSubmit = () => {
    fetchPayrollData();
    setIsEditFormOpen(false);
  }
  
  const handleBulkGenerateSlips = async () => {
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

  const handleIndividualGenerateClick = (employee: SalaryStructure) => {
    setIndividualGenerateState({
        ...individualGenerateState,
        isOpen: true,
        employee,
    });
  }

  const handleIndividualGenerateConfirm = async () => {
    if (!individualGenerateState.employee) return;
    try {
      const res = await fetch('/api/payroll/generate-individual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          employeeId: individualGenerateState.employee.employeeDbId,
          month: individualGenerateState.month,
          year: individualGenerateState.year,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Failed to generate payslip for ${individualGenerateState.employee.employeeName}.`);
      
      toast({
        title: "Payslip Generated",
        description: data.message,
      });

    } catch(error: any) {
       toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message,
      });
    } finally {
      setIndividualGenerateState({ ...individualGenerateState, isOpen: false, employee: null });
    }
  }

  const isAdminOrHR = role === "Admin" || role === "HR";

  if (loading) {
     return (
        <div className="space-y-6">
            <PageHeader
                title="Payroll"
                description={isAdminOrHR ? "Manage employee salaries and view financial insights." : "View your payroll information and salary details."}
            />
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Skeleton className="lg:col-span-3 h-80" />
                <Skeleton className="lg:col-span-2 h-80" />
            </div>
        </div>
     )
  }

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAdminOrHR ? "Payroll Command Center" : "Payroll"}
        description={isAdminOrHR ? "Manage employee salaries and view financial insights." : "View your payroll information and salary details."}
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
                  This will generate new payslips for all employees for the current month. Existing slips for this month will not be overridden. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkGenerateSlips}>Generate</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </PageHeader>
      {isAdminOrHR ? (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Monthly Payroll</CardTitle>
                        <ReceiptIndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats?.totalMonthlyPayroll || 0)}</div>
                        <p className="text-xs text-muted-foreground">Estimated total for current structures</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalEmployees || 0}</div>
                        <p className="text-xs text-muted-foreground">Employees with salary structures</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Monthly Salary</CardTitle>
                        <AreaChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats?.averageSalary || 0)}</div>
                        <p className="text-xs text-muted-foreground">Mean salary across all employees</p>
                    </CardContent>
                </Card>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle>Payroll by Department</CardTitle>
                    <CardDescription>A visual breakdown of salary allocation across departments.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={departmentBreakdown} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value as number)} />
                            <Tooltip
                                cursor={{fill: 'hsl(var(--muted))'}}
                                content={({ active, payload }) =>
                                    active && payload && payload.length ? (
                                    <Card className="p-2 shadow-lg">
                                        <p className="font-bold">{`${payload[0].payload.name}`}</p>
                                        <p className="text-sm text-primary">{`Total Payroll: ${formatCurrency(payload[0].value as number)}`}</p>
                                    </Card>
                                    ) : null
                                }
                            />
                            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
             </Card>

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
                            <TableHead className="text-right">Allowances</TableHead>
                            <TableHead className="text-right">Deductions (PF)</TableHead>
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
                                <TableCell className="text-right font-mono">{formatCurrency(structure.hra + structure.otherAllowances)}</TableCell>
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
                                             <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleIndividualGenerateClick(structure)}>
                                                <CircleDot className="mr-2 h-4 w-4" />
                                                Generate Slip
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

            <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
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

             <Dialog open={individualGenerateState.isOpen} onOpenChange={(isOpen) => setIndividualGenerateState({...individualGenerateState, isOpen})}>
                 <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Generate Individual Payslip</DialogTitle>
                        <DialogDescription>
                            Generate a payslip for {individualGenerateState.employee?.employeeName} for a specific month. This is useful for final settlements.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="month-select">Month</Label>
                                <Select value={individualGenerateState.month} onValueChange={(value) => setIndividualGenerateState({...individualGenerateState, month: value})}>
                                    <SelectTrigger id="month-select">
                                        <SelectValue placeholder="Select month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="year-select">Year</Label>
                                <Select value={String(individualGenerateState.year)} onValueChange={(value) => setIndividualGenerateState({...individualGenerateState, year: Number(value)})}>
                                    <SelectTrigger id="year-select">
                                        <SelectValue placeholder="Select year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIndividualGenerateState({...individualGenerateState, isOpen: false})}>Cancel</Button>
                      <Button onClick={handleIndividualGenerateConfirm}>Generate and Save</Button>
                    </DialogFooter>
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

