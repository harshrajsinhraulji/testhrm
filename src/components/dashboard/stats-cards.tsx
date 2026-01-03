"use client";

import { mockEmployees, mockAttendance, mockLeaveRequests } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Plane } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function StatsCards() {
    const { role } = useAuth();
    if (role !== "Admin" && role !== "HR") {
        return null;
    }

    const today = new Date().toISOString().split('T')[0];
    const totalEmployees = mockEmployees.length;
    const onLeaveToday = mockLeaveRequests.filter(req => req.status === 'Approved' && new Date(req.startDate) <= new Date(today) && new Date(req.endDate) >= new Date(today)).length;
    const presentToday = mockAttendance.filter(att => att.date === today && att.status === "Present").length;
    const absentToday = totalEmployees - presentToday - onLeaveToday;

    const stats = [
        { title: "Total Employees", value: totalEmployees, icon: Users, color: "text-blue-500" },
        { title: "Present Today", value: presentToday, icon: UserCheck, color: "text-green-500" },
        { title: "On Leave", value: onLeaveToday, icon: Plane, color: "text-yellow-500" },
        { title: "Absent", value: absentToday, icon: UserX, color: "text-red-500" },
    ];
    
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <stat.icon className={`h-4 w-4 text-muted-foreground`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">Updated just now</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
