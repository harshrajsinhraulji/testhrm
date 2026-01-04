
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowRight, User, CalendarCheck, Plane } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import type { AttendanceRecord } from "@/lib/types";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";

const getStatusClasses = (status: AttendanceRecord['status'] | undefined) => {
  if (!status) return "bg-slate-100 text-slate-800";
  switch (status) {
    case "Present": return "bg-green-100 text-green-800 border-green-200";
    case "Absent": return "bg-red-100 text-red-800 border-red-200";
    case "Half-day": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Leave": return "bg-blue-100 text-blue-800 border-blue-200";
    default: return "bg-slate-100 text-slate-800";
  }
};

const cardData = [
    {
        title: "My Profile",
        description: "View and update your personal details.",
        icon: User,
        href: "/dashboard/profile"
    },
    {
        title: "My Attendance",
        description: "Check your daily and weekly attendance records.",
        icon: CalendarCheck,
        href: "/dashboard/attendance"
    },
    {
        title: "My Leave",
        description: "Apply for time-off and track your requests.",
        icon: Plane,
        href: "/dashboard/leave"
    }
]

export function EmployeeDashboardCards() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const fetchTodaysAttendance = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?employeeId=${user.id}`);
      if (!res.ok) throw new Error("Failed to get today's status");
      const allRecords: AttendanceRecord[] = await res.json();
      const today = new Date().toISOString().split('T')[0];
      const record = allRecords.find(r => r.date === today);
      setTodayRecord(record);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchTodaysAttendance();
  }, [fetchTodaysAttendance]);

  const handleAttendanceAction = async (action: 'checkin' | 'checkout') => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: user.id, action }),
      });
      if (!res.ok) throw new Error(`Failed to ${action}.`);
      
      toast({
        title: `Successfully ${action === 'checkin' ? 'Checked In' : 'Checked Out'}`,
        description: action === 'checkin' ? "Your attendance is marked." : "Have a great day!",
      });

      fetchTodaysAttendance();

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  const isCheckedIn = !!(todayRecord && todayRecord.checkIn && !todayRecord.checkOut);

  return (
    <>
    <Card>
        <CardHeader>
            <CardTitle>Today's Status</CardTitle>
            <CardDescription>Quick actions for your daily attendance.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Your Status:</span>
                <Badge className={cn("text-sm", getStatusClasses(todayRecord?.status))}>
                  {todayRecord?.status || 'Not Marked'}
                </Badge>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={() => handleAttendanceAction('checkin')} disabled={isCheckedIn || !!todayRecord?.checkIn || loading}>
                    Check In
                </Button>
                <Button onClick={() => handleAttendanceAction('checkout')} variant="outline" disabled={!isCheckedIn || !!todayRecord?.checkOut || loading}>
                    Check Out
                </Button>
            </div>
        </CardContent>
    </Card>

    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {cardData.map((card) => (
        <Card key={card.title} className="flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="grid gap-1">
                        <CardTitle className="text-xl">{card.title}</CardTitle>
                        <CardDescription>{card.description}</CardDescription>
                    </div>
                    <div className="p-2 bg-secondary rounded-md">
                        <card.icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow" />
            <CardFooter>
                <Button asChild variant="outline" className="w-full">
                    <Link href={card.href}>
                        Go to {card.title}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
      ))}
    </div>
    </>
  );
}
