
"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { addDays, format, startOfWeek, getDay } from 'date-fns';

interface AttendanceStreakProps {
    employeeId?: string;
    attendanceRecords: AttendanceRecord[];
}

const getStatusColor = (status: AttendanceStatus | undefined) => {
    if (!status) return 'bg-muted/50';
    switch (status) {
        case "Present":
            return 'bg-green-500';
        case "Half-day":
            return 'bg-yellow-500';
        case "Leave":
            return 'bg-blue-500';
        case "Absent":
            return 'bg-red-500';
        default:
            return 'bg-muted/50';
    }
}

export function AttendanceStreak({ employeeId, attendanceRecords }: AttendanceStreakProps) {
    const today = new Date();
    const weekCount = 12; 
    const days = [];

    // Start from the beginning of the week, 11 weeks ago
    let startDate = startOfWeek(addDays(today, - (weekCount - 1) * 7), { weekStartsOn: 1 });

    for (let i = 0; i < weekCount * 7; i++) {
        const date = addDays(startDate, i);
        if (date > today) break;

        const dateString = format(date, 'yyyy-MM-dd');
        const record = attendanceRecords.find(r => r.employeeId === employeeId && r.date === dateString);
        days.push({
            date: dateString,
            status: record?.status,
        });
    }

    const weeks: { date: string, status?: AttendanceStatus }[][] = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }
    
    if (!employeeId) {
        return (
            <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Select an employee to view their streak.</p>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="flex justify-center p-2">
                <div className="grid grid-cols-12 gap-1" style={{direction: 'rtl'}}>
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="grid grid-rows-7 gap-1">
                            {week.map((day, dayIndex) => (
                                <Tooltip key={day.date}>
                                    <TooltipTrigger asChild>
                                        <div className={cn("h-4 w-4 rounded-sm", getStatusColor(day.status))} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{day.status || 'No Record'} on {format(new Date(day.date), 'MMM dd, yyyy')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
             <div className="flex justify-end items-center gap-4 text-xs mt-4 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-sm bg-muted/50" />
                    <span>No Record</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-sm bg-red-500" />
                    <span>Absent</span>
                </div>
                 <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-sm bg-blue-500" />
                    <span>Leave</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-sm bg-yellow-500" />
                    <span>Half-day</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-sm bg-green-500" />
                    <span>Present</span>
                </div>
            </div>
        </TooltipProvider>
    );
}
