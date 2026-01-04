
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  
  const isAdminOrHR = role === 'Admin' || role === 'HR';
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>(user?.id);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (user?.id) {
        setSelectedEmployeeId(user.id);
    }
  }, [user]);

  const fetchAttendanceAndEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const attendanceRes = await fetch('/api/attendance');
      if (!attendanceRes.ok) throw new Error("Failed to fetch attendance data.");
      const attendanceData = await attendanceRes.json();
      setAllAttendanceRecords(attendanceData);

      if (isAdminOrHR) {
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
  }, [isAdminOrHR, toast]);

  useEffect(() => {
    fetchAttendanceAndEmployees();
  }, [fetchAttendanceAndEmployees]);

  const selectedEmployeeRecords = useMemo(() => {
    if (!selectedEmployeeId) return [];
    return allAttendanceRecords.filter(a => a.employeeId === selectedEmployeeId);
  }, [allAttendanceRecords, selectedEmployeeId]);
  
  const todayUserRecord = useMemo(() => {
    return allAttendanceRecords.find(a => a.employeeId === user?.id && a.date === today);
  }, [allAttendanceRecords, user, today]);

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
      
      fetchAttendanceAndEmployees();

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const getEmployeeName = (employeeId: string) => {
    return employees.find(e => e.id === employeeId)?.name || user?.name || 'Unknown';
  }
  
  const dailyRecords = allAttendanceRecords.filter(r => r.date === today);

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Track and manage employee attendance."
      >
        <div className="flex items-center gap-2">
            <Button onClick={() => handleAttendanceAction('checkin')} disabled={isCheckedIn || !!todayUserRecord?.checkIn}>
                Check In
            </Button>
            <Button onClick={() => handleAttendanceAction('checkout')} variant="outline" disabled={!isCheckedIn || !!todayUserRecord?.checkOut}>
                Check Out
            </Button>
        </div>
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
            <TabsTrigger value="weekly">Yearly Streak</TabsTrigger>
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
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isAdminOrHR ? "Employee" : "Status"}</TableHead>
                        {isAdminOrHR && <TableHead>Status</TableHead>}
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isAdminOrHR ? (
                         dailyRecords.length > 0 ? dailyRecords.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium">{getEmployeeName(record.employeeId)}</TableCell>
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
                                <TableCell colSpan={4} className="h-24 text-center">No records for today.</TableCell>
                           </TableRow>
                         )
                      ) : (
                         selectedEmployeeRecords.filter(r => r.date === today).length > 0 ? selectedEmployeeRecords.filter(r => r.date === today).map((record) => (
                             <TableRow key={record.id}>
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
                                <TableCell colSpan={3} className="h-24 text-center">Your attendance is not marked for today.</TableCell>
                            </TableRow>
                         )
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
                <CardTitle>Yearly Attendance Streak</CardTitle>
                <CardDescription>
                  Attendance summary for the last 365 days.
                </CardDescription>
                 {isAdminOrHR && (
                    <div className="pt-4 max-w-sm space-y-2">
                        <Label htmlFor="employee-select">View Streak For</Label>
                        <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                            <SelectTrigger id="employee-select">
                                <SelectValue placeholder="Select an employee" />
                            </SelectTrigger>
                            <SelectContent>
                                {employees.map(e => (
                                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
              </CardHeader>
              <CardContent className="overflow-x-auto">
                  <AttendanceStreak
                      key={selectedEmployeeId}
                      data={selectedEmployeeRecords}
                  />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
