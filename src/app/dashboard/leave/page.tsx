'use client';

import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import { PlusCircle, MoreHorizontal, Eye, Check, X, Pencil } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const getStatusClasses = (status: LeaveStatus) => {
  switch (status) {
    case 'Approved':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'Rejected':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'Pending':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    default:
      return 'text-slate-600 bg-slate-50 border-slate-200';
  }
};

export default function LeavePage() {
  const { user, role } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [isRejectionViewOpen, setIsRejectionViewOpen] = useState(false);
  const [rejectionComments, setRejectionComments] = useState("");
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

  const handleStatusUpdate = async (id: string, status: LeaveStatus, comments?: string) => {
    try {
      const res = await fetch(`/api/leave?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, comments }),
      });
      if (!res.ok) throw new Error(`Failed to ${status.toLowerCase()} request.`);

      toast({
        title: `Request ${status}`,
        description: `The leave request has been successfully ${status.toLowerCase()}.`,
      });
      fetchLeaveRequests();
      setIsRejectionViewOpen(false);
      setRejectionComments("");

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
  
  const handleRejectClick = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setIsRejectionViewOpen(true);
  };
  
  const handleRejectionSubmit = () => {
    if (selectedRequest) {
      handleStatusUpdate(selectedRequest.id, 'Rejected', rejectionComments);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Leave Management"
          description="Apply for leave, and view and manage requests."
        >
          {role === 'Employee' && (
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Apply for Leave
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>New Leave Request</DialogTitle>
                  <DialogDescription>
                    Fill out the form below to request time off.
                  </DialogDescription>
                </DialogHeader>
                <LeaveRequestForm
                  setOpen={setIsFormOpen}
                  onFormSubmit={fetchLeaveRequests}
                />
              </DialogContent>
            </Dialog>
          )}
        </PageHeader>

        <Card>
          <CardHeader>
            <CardTitle>Leave History</CardTitle>
            <CardDescription>
              A record of all leave requests submitted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
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
                          <Badge
                            variant="outline"
                            className={cn(
                              'font-medium',
                              getStatusClasses(request.status)
                            )}
                          >
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
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {(role === 'Admin' || role === 'HR') &&
                                request.status === 'Pending' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-green-600 focus:text-green-600"
                                      onClick={() =>
                                        handleStatusUpdate(request.id, 'Approved')
                                      }
                                    >
                                      <Check className="mr-2 h-4 w-4" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600"
                                      onClick={() =>
                                        handleRejectClick(request)
                                      }
                                    >
                                      <X className="mr-2 h-4 w-4" />
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
      </div>

      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
            <DialogDescription>
              Full details for the selected leave request.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4 text-sm">
              <dl className="grid gap-3">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Employee</dt>
                  <dd className="font-medium">{selectedRequest.employeeName}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Leave Type</dt>
                  <dd className="font-medium">{selectedRequest.leaveType}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Dates</dt>
                  <dd className="font-medium">
                    {new Date(selectedRequest.startDate).toLocaleDateString()} -{' '}
                    {new Date(selectedRequest.endDate).toLocaleDateString()}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <Badge
                      variant="outline"
                      className={cn(
                        'font-medium',
                        getStatusClasses(selectedRequest.status)
                      )}
                    >
                      {selectedRequest.status}
                    </Badge>
                  </dd>
                </div>
              </dl>
              <Separator />
              <div className="space-y-2">
                <p className="font-medium text-muted-foreground">
                  Reason
                </p>
                <p className="rounded-md border bg-muted/50 p-2">
                  {selectedRequest.reason}
                </p>
              </div>
              {selectedRequest.comments && (
                <div className="space-y-2">
                  <p className="font-medium text-muted-foreground">
                    Admin Comments
                  </p>
                  <p className="rounded-md border bg-muted/50 p-2">
                    {selectedRequest.comments}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isRejectionViewOpen} onOpenChange={setIsRejectionViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
                Provide comments for rejecting {selectedRequest?.employeeName}'s request.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="rejection-comments">Comments (Optional)</Label>
            <Textarea 
              id="rejection-comments"
              placeholder="e.g., Request overlaps with project deadline."
              value={rejectionComments}
              onChange={(e) => setRejectionComments(e.target.value)}
            />
          </div>
          <div className='flex justify-end gap-2'>
            <Button variant="ghost" onClick={() => setIsRejectionViewOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectionSubmit}>Confirm Rejection</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
