"use client";

import { useMemo } from 'react';
import type { User, AttendanceRecord, LeaveRequest } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';

interface DailyStatusListProps {
  employees: User[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
}

export function DailyStatusList({ employees, attendance, leaveRequests }: DailyStatusListProps) {
  const dailyStatus = useMemo(() => {
    if (!employees.length) return { present: [], onLeave: [], absent: [] };
    
    const today = new Date().toISOString().split('T')[0];

    const presentIds = new Set(attendance.filter(a => a.date === today && a.status === 'Present').map(a => a.employeeId));
    const onLeaveIds = new Set(leaveRequests.filter(l => l.status === 'Approved' && new Date(today) >= new Date(l.startDate) && new Date(today) <= new Date(l.endDate)).map(l => l.employeeId));

    const present = employees.filter(e => presentIds.has(e.id));
    const onLeave = employees.filter(e => onLeaveIds.has(e.id));
    const absent = employees.filter(e => !presentIds.has(e.id) && !onLeaveIds.has(e.id));

    return { present, onLeave, absent };
  }, [employees, attendance, leaveRequests]);

  const StatusColumn = ({ title, users, colorClass }: { title: string, users: User[], colorClass: string }) => (
    <div className="flex-1">
      <h3 className={`font-semibold mb-3 text-center`}>{title}</h3>
      {users.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
            <TooltipProvider>
                {users.map(user => (
                    <Tooltip key={user.id} delayDuration={100}>
                        <TooltipTrigger>
                            <Avatar className="h-9 w-9 border-2" style={{ borderColor: `hsl(var(${colorClass}))`}}>
                                <AvatarImage src={user.avatarUrl} alt={user.name} className="object-cover" />
                                <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{user.name}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </TooltipProvider>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center">No one</p>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Who's In Today?</CardTitle>
        <CardDescription>A quick overview of today's employee statuses.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row gap-6">
        <StatusColumn title="Present" users={dailyStatus.present} colorClass="--chart-2" />
        <StatusColumn title="On Leave" users={dailyStatus.onLeave} colorClass="--chart-3" />
        <StatusColumn title="Absent" users={dailyStatus.absent} colorClass="--chart-5" />
      </CardContent>
    </Card>
  );
}
