"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Plane } from "lucide-react";
import type { User, AttendanceRecord, LeaveRequest } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";

type EmployeeFilter = 'all' | 'present' | 'absent' | 'onLeave';

interface StatsCardsProps {
    employees: User[];
    attendance: AttendanceRecord[];
    leaveRequests: LeaveRequest[];
    activeFilter: EmployeeFilter;
    onFilterChange: (filter: EmployeeFilter) => void;
}

interface DashboardStats {
    totalEmployees: number;
    presentToday: number;
    onLeaveToday: number;
    absentToday: number;
}

export function StatsCards({ employees, attendance, leaveRequests, activeFilter, onFilterChange }: StatsCardsProps) {
    const [loading, setLoading] = useState(true);

    const stats: DashboardStats | null = useMemo(() => {
        if (!employees.length) return null;
        
        const today = new Date().toISOString().split('T')[0];
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

        return {
            totalEmployees,
            presentToday,
            onLeaveToday,
            absentToday: absentToday > 0 ? absentToday : 0
        };
    }, [employees, attendance, leaveRequests]);
    
    useEffect(() => {
        if (employees.length > 0) {
            setLoading(false);
        }
    }, [employees]);


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
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    const statsCards = [
        { title: "Total Employees", value: stats?.totalEmployees, icon: Users, color: "text-blue-500", filter: 'all' as EmployeeFilter },
        { title: "Present Today", value: stats?.presentToday, icon: UserCheck, color: "text-green-500", filter: 'present' as EmployeeFilter },
        { title: "On Leave", value: stats?.onLeaveToday, icon: Plane, color: "text-yellow-500", filter: 'onLeave' as EmployeeFilter },
        { title: "Absent", value: stats?.absentToday, icon: UserX, color: "text-red-500", filter: 'absent' as EmployeeFilter },
    ];
    
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsCards.map((stat) => (
                <Card 
                    key={stat.title}
                    onClick={() => onFilterChange(stat.filter)}
                    className={cn(
                        "cursor-pointer transition-all hover:bg-muted/80",
                        activeFilter === stat.filter && "bg-muted ring-2 ring-primary"
                    )}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <stat.icon className={cn("h-4 w-4 text-muted-foreground", stat.color)} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value ?? 0}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
