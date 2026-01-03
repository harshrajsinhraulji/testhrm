'use client';

import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import type { LeaveRequest, LeaveStatus } from '@/lib/types';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, useEffect, useCallback } from 'react';
import { LeaveRequestForm } from '@/components/leave/leave-request-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const getStatusClasses = (status: LeaveStatus) => {
  switch (status) {
    case 'Approved':
      return "bg-[#DCFCE7] text-[#16A34A] border-[#16A34A]/20";
    case 'Rejected':
      return "bg-[#FEE2E2] text-[#DC2626] border-[#DC2626]/20";
    case 'Pending':
      return "bg-[#FEF3C7] text-[#D97706] border-[#D97706]/20";
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

export default function LeavePage() {
  const { user, role } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null
  );
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const { toast } = useToast();

  const fetchLeaveRequests = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const url =
        role === 'Admin' || role === 'HR'
          ? '/api/leave'
          : `/api/leave?employeeId=${user.id}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch leave requests.');
      const data = await res.json();
      setLeaveRequests(data);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [user, role, toast]);

  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  const handleStatusUpdate = async (id: string, status: LeaveStatus) => {
    try {
      const res = await fetch(`/api/leave?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`Failed to ${status.toLowerCase()} request.`);

      toast({
        title: `Request ${status}`,
        description: `The leave request has been successfully ${status.toLowerCase()}.`,
      });
      fetchLeaveRequests();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const handleViewDetailsClick = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setIsDetailViewOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Leave Management"
        description="Apply for leave and view the status of your requests."
      >
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Apply for Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>New Leave Request</DialogTitle>
            </DialogHeader>
            <LeaveRequestForm
              setOpen={setIsFormOpen}
              onFormSubmit={fetchLeaveRequests}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Your Leave History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {role !== 'Employee' && <TableHead>Employee</TableHead>}
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.length > 0 ? (
                  leaveRequests.map((request: LeaveRequest) => (
                    <TableRow key={request.id}>
                      {role !== 'Employee' && (
                        <TableCell className="font-medium">
                          {request.employeeName}
                        </TableCell>
                      )}
                      <TableCell>{request.leaveType}</TableCell>
                      <TableCell>
                        {new Date(request.startDate).toLocaleDateString()} -{' '}
                        {new Date(request.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("border font-medium", getStatusClasses(request.status))}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDetailsClick(request)}
                            >
                              View Details
                            </DropdownMenuItem>
                            {(role === 'Admin' || role === 'HR') &&
                              request.status === 'Pending' && (
                                <>
                                  <DropdownMenuItem
                                    className="text-green-600 focus:text-green-600"
                                    onClick={() =>
                                      handleStatusUpdate(request.id, 'Approved')
                                    }
                                  >
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() =>
                                      handleStatusUpdate(request.id, 'Rejected')
                                    }
                                  >
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={role !== 'Employee' ? 5 : 4}
                      className="h-24 text-center"
                    >
                      No leave requests found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
            <DialogDescription>
              Full details for the selected leave request.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium text-muted-foreground">
                  Employee
                </div>
                <div>{selectedRequest.employeeName}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium text-muted-foreground">
                  Leave Type
                </div>
                <div>{selectedRequest.leaveType}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium text-muted-foreground">Dates</div>
                <div>
                  {new Date(selectedRequest.startDate).toLocaleDateString()} -{' '}
                  {new Date(selectedRequest.endDate).toLocaleDateString()}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium text-muted-foreground">Status</div>
                <div>
                  <Badge className={cn("border", getStatusClasses(selectedRequest.status))}>
                    {selectedRequest.status}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div>
                <p className="font-medium text-muted-foreground mb-1">
                  Reason provided by employee:
                </p>
                <p className="p-2 bg-muted rounded-md">
                  {selectedRequest.reason}
                </p>
              </div>
              {selectedRequest.comments && (
                <div>
                  <p className="font-medium text-muted-foreground mb-1">
                    Admin Comments:
                  </p>
                  <p className="p-2 bg-muted rounded-md">
                    {selectedRequest.comments}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
