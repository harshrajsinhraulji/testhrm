
"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { addDays, format, startOfWeek, subDays, getDay, getMonth } from 'date-fns';

interface AttendanceStreakProps {
    employeeId?: string;
    attendanceRecords: AttendanceRecord[];
}

const getStatusColor = (status: AttendanceStatus | undefined) => {
    if (!status) return 'bg-gray-200 dark:bg-gray-800'; // Muted for no record
    switch (status) {
        case "Present": return 'bg-green-500';
        case "Half-day": return 'bg-yellow-400';
        case "Leave": return 'bg-blue-400';
        case "Absent": return 'bg-red-500';
        default: return 'bg-gray-200 dark:bg-gray-800';
    }
}

export function AttendanceStreak({ employeeId, attendanceRecords }: AttendanceStreakProps) {
    const today = new Date();
    const yearAgo = subDays(today, 365);
    // Start from the beginning of the week that contains the date 365 days ago
    const startDate = startOfWeek(yearAgo, { weekStartsOn: 0 }); // Sunday start

    const attendanceMap = new Map<string, AttendanceStatus>();
    if (employeeId) {
        for (const record of attendanceRecords) {
            if (record.employeeId === employeeId) {
                attendanceMap.set(record.date, record.status);
            }
        }
    }

    const days = Array.from({ length: 371 }, (_, i) => { // ~53 weeks
        const date = addDays(startDate, i);
        const dateString = format(date, 'yyyy-MM-dd');
        return {
            date: dateString,
            status: attendanceMap.get(dateString),
        };
    });

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    const monthLabels = weeks.reduce((acc, week, i) => {
        const firstDayOfMonth = new Date(week[0].date).getDate() <= 7;
        const monthName = format(new Date(week[0].date), 'MMM');
        const lastMonth = acc.length > 0 ? acc[acc.length-1].month : '';
        
        if (firstDayOfMonth && monthName !== lastMonth) {
           acc.push({ month: monthName, index: i });
        }
        return acc;
    }, [] as { month: string, index: number }[]);


    if (!employeeId) {
        return (
            <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Select an employee to view their streak.</p>
            </div>
        );
    }

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <TooltipProvider>
            <div className="flex items-start">
                <div className="grid grid-rows-7 gap-1.5 text-xs text-muted-foreground pr-2 pt-8">
                    <div className="h-3">Mon</div>
                    <div className="h-3 mt-4">Wed</div>
                    <div className="h-3 mt-4">Fri</div>
                </div>
                
                <div className="relative grid grid-flow-col gap-1.5">
                    {/* Month Labels */}
                    {monthLabels.map(({ month, index }) => (
                         <div key={month} className="absolute text-xs font-semibold" style={{ left: `${index * 18}px`, top: '0' }}>
                            {month}
                        </div>
                    ))}
                    
                    {/* Day cells */}
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="grid grid-rows-7 gap-1.5 pt-8">
                            {week.map((day, dayIndex) => (
                                <Tooltip key={day.date}>
                                    <TooltipTrigger asChild>
                                        <div className={cn(
                                            "h-3 w-3 rounded-sm", 
                                            new Date(day.date) > today ? 'bg-transparent' : getStatusColor(day.status)
                                         )} />
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
                <span>Less</span>
                <div className="h-3 w-3 rounded-sm bg-gray-200 dark:bg-gray-800" />
                <div className="h-3 w-3 rounded-sm bg-blue-400" />
                <div className="h-3 w-3 rounded-sm bg-yellow-400" />
                <div className="h-3 w-3 rounded-sm bg-green-500" />
                <span>More</span>
            </div>
        </TooltipProvider>
    );
}

