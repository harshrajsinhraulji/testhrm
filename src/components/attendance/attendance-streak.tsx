
"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { addDays, format, startOfWeek, subDays } from 'date-fns';
import { useMemo } from "react";

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

const LEGEND_ITEMS: { status: AttendanceStatus | "No Record", color: string }[] = [
    { status: "Present", color: "bg-green-500" },
    { status: "Leave", color: "bg-blue-400" },
    { status: "Half-day", color: "bg-yellow-400" },
    { status: "Absent", color: "bg-red-500" },
    { status: "No Record", color: "bg-gray-200 dark:bg-gray-800" },
];

export function AttendanceStreak({ data }: AttendanceStreakProps) {
    const today = new Date();
    const startDate = startOfWeek(subDays(today, 364), { weekStartsOn: 0 }); // Sunday start

    const { days, statusCounts, longestStreak } = useMemo(() => {
        const attendanceMap = new Map<string, AttendanceStatus>();
        const localStatusCounts: { [key in AttendanceStatus | "No Record"]?: number } = {
            Present: 0, Leave: 0, "Half-day": 0, Absent: 0, "No Record": 0
        };

        let currentStreak = 0;
        let maxStreak = 0;

        for (const record of data) {
            attendanceMap.set(record.date, record.status);
        }

        const generatedDays = Array.from({ length: 371 }, (_, i) => {
            const date = addDays(startDate, i);
            const dateString = format(date, 'yyyy-MM-dd');
            const status = attendanceMap.get(dateString);

            if (date <= today) {
                if (status === "Present") {
                    currentStreak++;
                } else {
                    maxStreak = Math.max(maxStreak, currentStreak);
                    currentStreak = 0;
                }
                const countKey = status || "No Record";
                localStatusCounts[countKey] = (localStatusCounts[countKey] || 0) + 1;
            }
            
            return {
                date: dateString,
                status: status,
            };
        });
        
        maxStreak = Math.max(maxStreak, currentStreak); // Final check for streak ending today

        return { days: generatedDays, statusCounts: localStatusCounts, longestStreak: maxStreak };

    }, [data, startDate, today]);
    

    // Group days into weeks
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }
    
    const monthLabels = weeks.reduce((acc, week, i) => {
        const firstDayOfWeek = new Date(week[0].date);
        const monthName = format(firstDayOfWeek, 'MMM');
        if (i === 0 || format(addDays(new Date(weeks[i-1][0].date), 7), 'MMM') !== monthName) {
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
            <div className="flex flex-col gap-6">
                <div className="relative grid grid-flow-col gap-1 mx-auto">
                    {/* Month Labels */}
                    {monthLabels.map(({ month, index }) => (
                         <div key={`${month}-${index}`} className="absolute text-xs text-muted-foreground -top-5" style={{ left: `${index * 16}px` }}>
                            {month}
                        </div>
                    ))}
                    
                    {/* Day cells grid */}
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="grid grid-rows-7 gap-1 pt-2">
                            {week.map((day, dayIndex) => (
                                <Tooltip key={day.date} delayDuration={200}>
                                    <TooltipTrigger asChild>
                                        <div className={cn(
                                            "h-3 w-3 rounded-sm border border-black/5", 
                                            new Date(day.date) > today ? 'bg-transparent border-none' : getStatusColor(day.status)
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
                 
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center text-sm">
                    <div className="md:col-span-1">
                        <div className="font-semibold text-muted-foreground mb-2">Summary</div>
                        <div className="space-y-1">
                            <p><strong>Present:</strong> {statusCounts.Present || 0} days</p>
                            <p><strong>On Leave:</strong> {statusCounts.Leave || 0} days</p>
                            <p><strong>Longest Streak:</strong> {longestStreak} days</p>
                        </div>
                    </div>
                    <div className="md:col-span-3">
                        <div className="flex justify-start md:justify-end flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>Less</span>
                            {LEGEND_ITEMS.map(item => (
                                <div key={item.status} className="flex items-center gap-1.5">
                                    <div className={cn("h-3 w-3 rounded-sm border border-black/5", item.color)} />
                                    <span>{item.status} ({statusCounts[item.status] || 0})</span>
                                </div>
                            ))}
                            <span>More</span>
                        </div>
                    </div>
                 </div>
            </div>
        </TooltipProvider>
    );
}

