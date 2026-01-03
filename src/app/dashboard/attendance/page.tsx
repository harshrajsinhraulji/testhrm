
"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AttendanceRecord, User } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AttendanceStreak } from "@/components/attendance/attendance-streak";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const getStatusClasses = (status: AttendanceRecord['status']) => {
  switch (status) {
    case "Present":
      return "bg-[#DCFCE7] text-[#16A34A] border-[#16A34A]/20";
    case "Absent":
      return "bg-[#FEE2E2] text-[#DC2626] border-[#DC2626]/20";
    case "Half-day":
      return "bg-[#FEF3C7] text-[#D97706] border-[#D97706]/20";
    case "Leave":
      return "bg-blue-100 text-blue-800 border-blue-800/20";
    default:
      return "bg-slate-100 text-slate-800";
  }
};

export default function AttendancePage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchAttendance = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const url = role === 'Admin' || role === 'HR'
        ? '/api/attendance'
        : `/api/attendance?employeeId=${user.id}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch attendance data.");
      const data = await res.json();
      setAttendanceRecords(data);

      if (role === 'Admin' || role === 'HR') {
        const empRes = await fetch('/api/employees');
        if(!empRes.ok) throw new Error("Failed to fetch employees.");
        const empData = await empRes.json();
        const users: User[] = empData.map((item: any) => ({
            id: item.id,
            name: item.name,
            email: item.email,
            role: item.role,
            avatarUrl: item.avatar_url,
            employeeDetails: { employeeId: item.employee_id, department: item.department, position: item.position, dateOfJoining: '', contactNumber: '', address: '', emergencyContact: { name: '', relationship: '', phone: '' }}
        }));
        setEmployees(users);
      }

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  }, [user, role, toast]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const todayUserRecord = attendanceRecords.find(a => a.employeeId === user?.id && a.date === today);

  const isCheckedIn = !!(todayUserRecord && todayUserRecord.checkIn && !todayUserRecord.checkOut);

  const handleAttendanceAction = async (action: 'checkin' | 'checkout') => {
    if (!user?.id) return;
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

      // Refetch data to update UI
      fetchAttendance();

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const getEmployeeName = (employeeId: string) => {
    return employees.find(e => e.id === employeeId)?.name || 'Unknown';
  }
  
  const dailyRecords = attendanceRecords.filter(r => r.date === today);

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Track and manage employee attendance."
      >
        {role === 'Employee' && (
             <div className="flex items-center gap-2">
                <Button onClick={() => handleAttendanceAction('checkin')} disabled={isCheckedIn || !!todayUserRecord?.checkIn}>
                    Check In
                </Button>
                <Button onClick={() => handleAttendanceAction('checkout')} variant="outline" disabled={!isCheckedIn || !!todayUserRecord?.checkOut}>
                    Check Out
                </Button>
            </div>
        )}
      </PageHeader>
      
      {!isClient ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <Tabs defaultValue="daily">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="daily">Daily View</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Streak</TabsTrigger>
          </TabsList>
          <TabsContent value="daily">
            <Card>
              <CardHeader>
                <CardTitle>Today's Attendance</CardTitle>
                <CardDescription>
                  A summary of attendance for {new Date().toDateString()}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {role !== 'Employee' && <TableHead>Employee</TableHead>}
                        <TableHead>Status</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(role === 'Employee' ? attendanceRecords.filter(r=>r.date === today) : dailyRecords).length > 0 ? 
                      (role === 'Employee' ? attendanceRecords.filter(r=>r.date === today) : dailyRecords).map((record) => (
                        <TableRow key={record.id}>
                          {role !== 'Employee' && <TableCell className="font-medium">{getEmployeeName(record.employeeId)}</TableCell>}
                          <TableCell>
                            <Badge className={cn("border", getStatusClasses(record.status))}>
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.checkIn || "N/A"}</TableCell>
                          <TableCell>{record.checkOut || "N/A"}</TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                            <TableCell colSpan={role !== 'Employee' ? 4 : 3} className="h-24 text-center">
                                No attendance records for today.
                            </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="weekly">
          <Card>
              <CardHeader>
                <CardTitle>Weekly Attendance Streak</CardTitle>
                <CardDescription>
                  Your attendance summary for the last few weeks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                  <AttendanceStreak 
                      employeeId={user?.id}
                      attendanceRecords={attendanceRecords}
                  />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
