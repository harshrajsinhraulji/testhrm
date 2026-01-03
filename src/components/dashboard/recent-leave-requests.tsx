"use client";

import { mockLeaveRequests } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

const statusColors: { [key: string]: string } = {
    Pending: "bg-yellow-500",
    Approved: "bg-green-500",
    Rejected: "bg-red-500",
};


export function RecentLeaveRequests() {
    const { role } = useAuth();
    if (role !== "Admin" && role !== "HR") {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">You have no pending leave requests.</p>
            </div>
        )
    }

    const recentRequests = mockLeaveRequests.slice(0, 5);

    return (
        <div className="space-y-4">
            {recentRequests.map((request) => (
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
