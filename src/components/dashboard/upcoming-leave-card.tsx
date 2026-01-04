"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import type { LeaveRequest } from "@/lib/types";
import { differenceInDays, format, isFuture } from "date-fns";
import { Plane } from "lucide-react";
import { Badge } from "../ui/badge";

export function UpcomingLeaveCard() {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    async function fetchLeave() {
      try {
        const res = await fetch(`/api/leave?employeeId=${user.id}`);
        if (!res.ok) throw new Error("Failed to fetch leave requests.");
        const data: LeaveRequest[] = await res.json();
        setLeaveRequests(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchLeave();
  }, [user]);

  const upcomingLeaves = useMemo(() => {
    return leaveRequests
      .filter(
        (req) =>
          req.status === "Approved" && isFuture(new Date(req.startDate))
      )
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 3);
  }, [leaveRequests]);

  if (loading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Leave</CardTitle>
        <CardDescription>Your approved time off.</CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingLeaves.length > 0 ? (
          <div className="space-y-4">
            {upcomingLeaves.map((leave) => {
              const days = differenceInDays(new Date(leave.endDate), new Date(leave.startDate)) + 1;
              return (
                <div key={leave.id} className="flex items-center gap-4 p-2 rounded-lg bg-muted/50">
                  <div className="p-2 bg-accent rounded-md">
                    <Plane className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {format(new Date(leave.startDate), "MMM dd")} - {format(new Date(leave.endDate), "MMM dd, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">{leave.leaveType} Leave</p>
                  </div>
                  <Badge variant="secondary">{days} day{days > 1 ? 's' : ''}</Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-6">
            <Plane className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No Upcoming Leave</p>
            <p className="text-xs text-muted-foreground">You have no approved time off scheduled.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
