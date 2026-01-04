
"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { addDays, format, startOfWeek, subDays, getDay, getMonth } from 'date-fns';

interface AttendanceStreakProps {
    data: AttendanceRecord[];
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

export function AttendanceStreak({ data }: AttendanceStreakProps) {
    const today = new Date();
    // Go back 364 days (52 weeks) to get a full year view, then find the start of that week
    const yearAgo = subDays(today, 364); 
    const startDate = startOfWeek(yearAgo, { weekStartsOn: 0 }); // Sunday start to match GitHub

    const attendanceMap = new Map<string, AttendanceStatus>();
    for (const record of data) {
        attendanceMap.set(record.date, record.status);
    }
    
    // Generate all days for the grid (53 weeks * 7 days) to ensure a full grid
    const days = Array.from({ length: 371 }, (_, i) => {
        const date = addDays(startDate, i);
        const dateString = format(date, 'yyyy-MM-dd');
        return {
            date: dateString,
            status: attendanceMap.get(dateString),
        };
    });

    // Group days into weeks
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }
    
    // Calculate month labels dynamically
    const monthLabels = weeks.reduce((acc, week, i) => {
        const firstDayOfWeek = new Date(week[0].date);
        const firstDayOfMonth = firstDayOfWeek.getDate() <= 7;
        const monthName = format(firstDayOfWeek, 'MMM');
        const lastMonthInAcc = acc.length > 0 ? acc[acc.length-1].month : '';
        
        // Add a month label if it's the first week of a new month
        if (firstDayOfMonth && monthName !== lastMonthInAcc) {
           acc.push({ month: monthName, index: i });
        }
        return acc;
    }, [] as { month: string, index: number }[]);


    if (!data) {
        return (
            <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Select an employee to view their streak.</p>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="flex flex-col items-center">
                <div className="relative grid grid-flow-col gap-1">
                    {/* Month Labels */}
                    {monthLabels.map(({ month, index }) => (
                         <div key={`${month}-${index}`} className="absolute text-xs font-semibold -top-5" style={{ left: `${index * 16}px` }}>
                            {month}
                        </div>
                    ))}
                    
                    {/* Day cells grid */}
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="grid grid-rows-7 gap-1 pt-2">
                            {week.map((day, dayIndex) => (
                                <Tooltip key={day.date}>
                                    <TooltipTrigger asChild>
                                        <div className={cn(
                                            "h-3 w-3 rounded-sm", 
                                            new Date(day.date) > today ? 'bg-transparent' : getStatusColor(day.status)
                                         )} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="font-semibold">{day.status || 'No Record'}</p>
                                        <p className="text-muted-foreground">{format(new Date(day.date), 'EEEE, MMM dd, yyyy')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    ))}
                </div>
                 <div className="flex justify-end items-center gap-4 text-xs mt-4 text-muted-foreground self-end">
                    <span>Less</span>
                    <div className="h-3 w-3 rounded-sm bg-gray-200 dark:bg-gray-800" />
                    <div className="h-3 w-3 rounded-sm bg-blue-400" />
                    <div className="h-3 w-3 rounded-sm bg-yellow-400" />
                    <div className="h-3 w-3 rounded-sm bg-green-500" />
                    <span>More</span>
                </div>
            </div>
        </TooltipProvider>
    );
}

