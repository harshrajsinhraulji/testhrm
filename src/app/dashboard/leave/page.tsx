"use client";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import type { LeaveRequest, LeaveStatus } from "@/lib/types";
import { mockLeaveRequests } from "@/lib/data";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { LeaveRequestForm } from "@/components/leave/leave-request-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const getStatusVariant = (status: LeaveStatus) => {
  switch (status) {
    case "Approved":
      return "default";
    case "Rejected":
      return "destructive";
    case "Pending":
    default:
      return "secondary";
  }
};

export default function LeavePage() {
  const { user, role } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const leaveData = role === 'Admin' || role === 'HR'
    ? mockLeaveRequests
    : mockLeaveRequests.filter(req => req.employeeId === user?.employeeDetails?.employeeId);

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
                <LeaveRequestForm setOpen={setIsFormOpen} />
            </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Your Leave History</CardTitle>
        </CardHeader>
        <CardContent>
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
              {leaveData.map((request: LeaveRequest) => (
                <TableRow key={request.id}>
                  {role !== 'Employee' && <TableCell className="font-medium">{request.employeeName}</TableCell>}
                  <TableCell>{request.leaveType}</TableCell>
                  <TableCell>
                    {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(request.status)}>
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
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        {(role === 'Admin' || role === 'HR') && request.status === 'Pending' && (
                          <>
                            <DropdownMenuItem className="text-green-600 focus:text-green-600">Approve</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600">Reject</DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
