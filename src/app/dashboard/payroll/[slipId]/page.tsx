'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Payslip } from '@/components/payroll/payslip';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { PaySlip as PaySlipType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PayslipDetailPage() {
  const params = useParams();
  const { slipId } = params;
  const { toast } = useToast();
  const [payslip, setPayslip] = useState<PaySlipType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slipId) return;

    async function fetchPayslip() {
      try {
        const res = await fetch(`/api/payroll/${slipId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch payslip details.');
        }
        const data = await res.json();
        setPayslip(data);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchPayslip();
  }, [slipId, toast]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pay Slip"
        description={payslip ? `Details for ${payslip.month} ${payslip.year}` : 'Loading...'}
      >
        <div className='flex gap-2'>
            <Button variant="outline" asChild>
                <Link href="/dashboard/payroll">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Payroll
                </Link>
            </Button>
            <Button onClick={handlePrint} disabled={loading || !payslip}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
        </div>
      </PageHeader>

      {loading ? (
        <div className="space-y-4 @container">
          <Skeleton className="h-[700px] w-full" />
        </div>
      ) : payslip ? (
        <div className="@container">
          <Payslip data={payslip} />
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          Payslip not found or an error occurred.
        </div>
      )}
    </div>
  );
}
