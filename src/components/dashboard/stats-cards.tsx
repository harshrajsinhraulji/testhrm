"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Plane } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { User, AttendanceRecord, LeaveRequest } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";

interface DashboardStats {
    totalEmployees: number;
    presentToday: number;
    onLeaveToday: number;
    absentToday: number;
}

export function StatsCards() {
    const { role } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (role !== "Admin" && role !== "HR") {
            setLoading(false);
            return;
        }

        async function fetchDashboardStats() {
            try {
                setLoading(true);
                const today = new Date().toISOString().split('T')[0];

                const [employeesRes, attendanceRes, leaveRes] = await Promise.all([
                    fetch('/api/employees'),
                    fetch('/api/attendance'),
                    fetch('/api/leave')
                ]);

                if (!employeesRes.ok) throw new Error("Failed to fetch employees");
                if (!attendanceRes.ok) throw new Error("Failed to fetch attendance");
                if (!leaveRes.ok) throw new Error("Failed to fetch leave requests");

                const employees: User[] = await employeesRes.json();
                const attendance: AttendanceRecord[] = await attendanceRes.json();
                const leaveRequests: LeaveRequest[] = await leaveRes.json();

                const totalEmployees = employees.length;
                
                const onLeaveToday = leaveRequests.filter(req => 
                    req.status === 'Approved' && 
                    new Date(req.startDate) <= new Date(today) && 
                    new Date(req.endDate) >= new Date(today)
                ).length;
                
                const presentToday = attendance.filter(att => 
                    att.date === today && att.status === "Present"
                ).length;
                
                const absentToday = totalEmployees - presentToday - onLeaveToday;

                setStats({
                    totalEmployees,
                    presentToday,
                    onLeaveToday,
                    absentToday: absentToday > 0 ? absentToday : 0
                });

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardStats();
    }, [role]);


    if (role !== "Admin" && role !== "HR") {
        return null;
    }

    if (loading) {
        return (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                           <Skeleton className="h-5 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-12" />
                            <Skeleton className="h-4 w-32 mt-1" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }
    
    const statsCards = [
        { title: "Total Employees", value: stats?.totalEmployees, icon: Users, color: "text-blue-500" },
        { title: "Present Today", value: stats?.presentToday, icon: UserCheck, color: "text-green-500" },
        { title: "On Leave", value: stats?.onLeaveToday, icon: Plane, color: "text-yellow-500" },
        { title: "Absent", value: stats?.absentToday, icon: UserX, color: "text-red-500" },
    ];
    
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsCards.map((stat) => (
                <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value ?? 0}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
