'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DayflowLogo } from '@/components/icons';
import type { PaySlip } from '@/lib/types';
import { Badge } from '../ui/badge';

interface PayslipProps {
  data: PaySlip;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

export function Payslip({ data }: PayslipProps) {
  const totalEarnings = data.basicSalary + data.allowances;

  return (
    <Card className="max-w-4xl mx-auto print:shadow-none print:border-none">
      <CardHeader className="bg-muted/30 p-4 print:bg-transparent">
        <div className="flex justify-between items-start">
          <div className="grid gap-1">
            <div className="flex items-center gap-3">
              <DayflowLogo className="w-10 h-10 text-primary" />
              <h1 className="text-2xl font-bold font-headline">Dayflow</h1>
            </div>
            <p className="text-sm text-muted-foreground">123 Business Rd, HR City, 500081</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-primary">PAYSLIP</h2>
            <p className="text-sm text-muted-foreground">{data.month} {data.year}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Employee Details</h3>
          <Separator />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
            <div>
              <p className="font-medium">Employee Name</p>
              <p className="text-muted-foreground">{data.employeeName}</p>
            </div>
            <div>
              <p className="font-medium">Employee ID</p>
              <p className="text-muted-foreground">{data.employeeCode}</p>
            </div>
            <div>
              <p className="font-medium">Department</p>
              <p className="text-muted-foreground">{data.department}</p>
            </div>
            <div>
              <p className="font-medium">Position</p>
              <p className="text-muted-foreground">{data.position}</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Earnings</h3>
            <Separator />
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Basic Salary</span>
                <span>{formatCurrency(data.basicSalary)}</span>
              </div>
              <div className="flex justify-between">
                <span>Allowances</span>
                <span>{formatCurrency(data.allowances)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total Earnings</span>
                <span>{formatCurrency(totalEarnings)}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Deductions</h3>
            <Separator />
            <div className="mt-4 space-y-2 text-sm">
               <div className="flex justify-between">
                <span>Provident Fund (PF) & Tax</span>
                <span>{formatCurrency(data.deductions)}</span>
              </div>
               <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total Deductions</span>
                <span>{formatCurrency(data.deductions)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/30 p-4 print:bg-transparent">
        <div className="w-full flex justify-between items-center">
            <p className="text-xs text-muted-foreground">This is a computer-generated payslip and does not require a signature.</p>
            <div className="text-right">
                <p className="font-semibold text-lg">Net Salary</p>
                <p className="font-bold text-xl text-primary">{formatCurrency(data.netSalary)}</p>
            </div>
        </div>
      </CardFooter>
    </Card>
  );
}
