
"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { subDays, format } from "date-fns";
import type { AttendanceRecord } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "../ui/skeleton";


export function WeeklyHoursChart({ data, loading }: { data: AttendanceRecord[], loading: boolean }) {
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), i);
      const dateString = date.toISOString().split('T')[0];
      const record = data.find(r => r.date === dateString);
      
      let hours = 0;
      if (record?.totalHours) {
        const parts = record.totalHours.match(/(\d+)h (\d+)m/);
        if (parts) {
          hours = parseInt(parts[1]) + parseInt(parts[2]) / 60;
        }
      }
      
      return {
        name: format(date, 'EEE'),
        hours: parseFloat(hours.toFixed(2)),
      };
    }).reverse();
  }, [data]);

   if (loading) {
     return (
         <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64 mt-1" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[200px] w-full" />
            </CardContent>
        </Card>
     )
  }

  return (
    <Card>
        <CardHeader>
        <CardTitle>Weekly Hours</CardTitle>
        <CardDescription>Your working hours for the last 7 days.</CardDescription>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 0, left: -20 }}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                        cursor={{fill: 'hsl(var(--muted))'}}
                        content={({ active, payload }) =>
                            active && payload && payload.length ? (
                            <Card className="p-2 shadow-lg">
                                <p className="font-bold">{`${payload[0].payload.hours.toFixed(2)} hours`}</p>
                            </Card>
                            ) : null
                        }
                    />
                    <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
    </Card>
  );
};
