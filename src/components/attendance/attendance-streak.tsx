
"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { addDays, format, startOfWeek, getDay, getMonth, startOfMonth } from 'date-fns';

interface AttendanceStreakProps {
    employeeId?: string;
    attendanceRecords: AttendanceRecord[];
}

const getStatusColor = (status: AttendanceStatus | undefined) => {
    if (!status) return 'bg-slate-200'; // Muted for no record
    switch (status) {
        case "Present":
            return 'bg-green-500';
        case "Half-day":
            return 'bg-yellow-400';
        case "Leave":
            return 'bg-blue-400';
        case "Absent":
            return 'bg-red-400';
        default:
            return 'bg-slate-200';
    }
}

export function AttendanceStreak({ employeeId, attendanceRecords }: AttendanceStreakProps) {
    const today = new Date();
    const weekCount = 16; 
    
    // Start from the beginning of the week, 15 weeks ago, to ensure we have a full grid
    let startDate = startOfWeek(addDays(today, - (weekCount - 1) * 7), { weekStartsOn: 0 }); // Sunday start

    const days = Array.from({ length: weekCount * 7 }, (_, i) => {
        const date = addDays(startDate, i);
        const dateString = format(date, 'yyyy-MM-dd');
        const record = attendanceRecords.find(r => r.employeeId === employeeId && r.date === dateString);
        return {
            date: dateString,
            status: record?.status,
        };
    });

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    const monthLabels = weeks.reduce((acc, week, i) => {
        const firstDayOfMonth = getDay(startOfMonth(new Date(week[0].date))) === i;
        const monthName = format(new Date(week[0].date), 'MMM');
        if (!acc.find(m => m.month === monthName)) {
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
                <div className="grid grid-rows-7 gap-1.5 text-xs text-muted-foreground pr-2" style={{ paddingTop: '28px'}}>
                    {dayLabels.map((day, i) => (i % 2 !== 0) && <div key={day} className="h-3">{day}</div>)}
                </div>
                <div className="relative grid grid-flow-col gap-1.5 overflow-hidden">
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="grid grid-rows-7 gap-1.5">
                            {/* Month Label */}
                            {weekIndex > 0 && format(new Date(week[0].date), 'd') === '1' && (
                                <div className="absolute text-xs font-semibold" style={{ left: `${weekIndex * 18}px`, top: '0' }}>
                                    {format(new Date(week[0].date), 'MMM')}
                                </div>
                            )}
                            {weekIndex === 0 && (
                                <div className="absolute text-xs font-semibold" style={{ left: `0px`, top: '0' }}>
                                    {format(new Date(week[0].date), 'MMM')}
                                </div>
                            )}

                            {week.map((day, dayIndex) => (
                                <Tooltip key={day.date}>
                                    <TooltipTrigger asChild>
                                        <div className={cn("h-3 w-3 rounded-sm", getStatusColor(day.status))} style={{ marginTop: dayIndex === 0 ? '28px' : 0 }} />
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
                <div className="h-3 w-3 rounded-sm bg-slate-200" />
                <div className="h-3 w-3 rounded-sm bg-blue-400" />
                <div className="h-3 w-3 rounded-sm bg-yellow-400" />
                <div className="h-3 w-3 rounded-sm bg-green-500" />
                <span>More</span>
            </div>
        </TooltipProvider>
    );
}
