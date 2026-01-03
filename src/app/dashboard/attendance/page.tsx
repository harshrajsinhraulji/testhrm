
"use client";

import { useState } from "react";
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
import { mockAttendance, mockEmployees } from "@/lib/data";
import type { AttendanceRecord } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const getStatusVariant = (status: AttendanceRecord['status']) => {
  switch (status) {
    case "Present":
      return "default";
    case "Absent":
      return "destructive";
    case "Half-day":
      return "secondary";
    case "Leave":
      return "outline";
    default:
      return "default";
  }
};

export default function AttendancePage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];
  const [attendanceRecords, setAttendanceRecords] = useState(mockAttendance);

  const todayUserRecord = attendanceRecords.find(a => a.employeeId === user?.employeeDetails?.employeeId && a.date === today);

  const [isCheckedIn, setIsCheckedIn] = useState(!!(todayUserRecord && todayUserRecord.checkIn && !todayUserRecord.checkOut));

  const employeeAttendance = role === 'Admin' || role === 'HR'
    ? attendanceRecords.filter(a => a.date === today)
    : attendanceRecords.filter(a => a.employeeId === user?.employeeDetails?.employeeId);
    
  const getEmployeeName = (employeeId: string) => {
    return mockEmployees.find(e => e.employeeDetails?.employeeId === employeeId)?.name || 'Unknown';
  }

  const handleCheckIn = () => {
    if (!user?.employeeDetails?.employeeId) return;
    
    const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        employeeId: user.employeeDetails.employeeId,
        date: today,
        status: 'Present',
        checkIn: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    setAttendanceRecords([newRecord, ...attendanceRecords]);
    setIsCheckedIn(true);
    toast({
        title: "Checked In",
        description: "Your attendance has been marked for today.",
    });
  };

  const handleCheckOut = () => {
    if (!user?.employeeDetails?.employeeId || !todayUserRecord) return;
    
    const updatedRecords = attendanceRecords.map(rec => {
        if (rec.id === todayUserRecord.id) {
            return { 
                ...rec, 
                checkOut: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) 
            };
        }
        return rec;
    });

    setAttendanceRecords(updatedRecords);
    setIsCheckedIn(false);
    toast({
        title: "Checked Out",
        description: "Have a great day!",
    });
  };

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Track and manage employee attendance."
      >
        {role === 'Employee' && (
             <div className="flex items-center gap-2">
                <Button onClick={handleCheckIn} disabled={isCheckedIn || !!todayUserRecord}>
                    Check In
                </Button>
                <Button onClick={handleCheckOut} variant="outline" disabled={!isCheckedIn}>
                    Check Out
                </Button>
            </div>
        )}
      </PageHeader>
      
      <Tabs defaultValue="daily">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="daily">Daily View</TabsTrigger>
          <TabsTrigger value="weekly">Weekly View</TabsTrigger>
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
                  {employeeAttendance.length > 0 ? employeeAttendance.map((record) => (
                    <TableRow key={record.id}>
                      {role !== 'Employee' && <TableCell className="font-medium">{getEmployeeName(record.employeeId)}</TableCell>}
                      <TableCell>
                        <Badge variant={getStatusVariant(record.status)}>
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
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="weekly">
        <Card>
            <CardHeader>
              <CardTitle>Weekly Summary</CardTitle>
              <CardDescription>
                Your weekly attendance summary is not yet available.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-60 text-center">
                <Clock className="w-12 h-12 text-muted-foreground mb-4"/>
                <p className="text-muted-foreground">Weekly view is currently in development.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    