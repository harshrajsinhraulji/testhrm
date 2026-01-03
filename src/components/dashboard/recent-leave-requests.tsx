"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import type { LeaveRequest } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const statusColors: { [key: string]: string } = {
    Pending: "bg-yellow-500",
    Approved: "bg-green-500",
    Rejected: "bg-red-500",
};


export function RecentLeaveRequests() {
    const { role } = useAuth();
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (role !== "Admin" && role !== "HR") {
            setLoading(false);
            return;
        }

        async function fetchRecentLeaveRequests() {
            try {
                setLoading(true);
                const res = await fetch('/api/leave');
                if (!res.ok) {
                    throw new Error("Failed to fetch leave requests.");
                }
                const data: LeaveRequest[] = await res.json();
                // Filter for pending requests and show the 5 most recent
                const pendingRequests = data.filter(req => req.status === "Pending").slice(0, 5);
                setRequests(pendingRequests);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        
        fetchRecentLeaveRequests();
    }, [role]);


    if (role !== "Admin" && role !== "HR") {
        return null;
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="ml-4 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="ml-auto h-5 w-12" />
                    </div>
                ))}
            </div>
        );
    }
    
    if (error) {
      return <p className="text-red-500 text-center">{error}</p>;
    }

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-muted-foreground mb-4">You have no pending leave requests.</p>
                <Button variant="outline" asChild>
                    <Link href="/dashboard/leave">
                        View All Requests
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {requests.map((request) => (
                <div key={request.id} className="flex items-center">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://picsum.photos/seed/${request.employeeName.split(' ')[0]}/100/100`} alt="Avatar" />
                        <AvatarFallback>{request.employeeName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{request.employeeName}</p>
                        <p className="text-sm text-muted-foreground">{request.leaveType} Leave</p>
                    </div>
                    <div className="ml-auto font-medium text-sm flex items-center gap-2">
                        <span>{request.status}</span>
                        <span className={`h-2 w-2 rounded-full ${statusColors[request.status]}`} />
                    </div>
                </div>
            ))}
        </div>
    );
}
