"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

const data = [
  { name: "Mon", present: 28, absent: 4 },
  { name: "Tue", present: 30, absent: 2 },
  { name: "Wed", present: 31, absent: 1 },
  { name: "Thu", present: 29, absent: 3 },
  { name: "Fri", present: 25, absent: 7 },
  { name: "Sat", present: 10, absent: 22 },
];

export function AttendanceOverviewChart() {
    const { role } = useAuth();
    if (role !== "Admin" && role !== "HR") {
        return (
            <div className="flex items-center justify-center h-80">
                <p className="text-muted-foreground">Attendance data is only visible to Admins.</p>
            </div>
        )
    }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
            cursor={{fill: 'hsl(var(--muted))'}}
            content={({ active, payload, label }) =>
            active && payload && payload.length ? (
              <Card className="p-2 shadow-lg">
                <p className="font-bold">{`${label}`}</p>
                <p className="text-sm text-green-500">{`Present: ${payload[0].value}`}</p>
                <p className="text-sm text-red-500">{`Absent: ${payload[1].value}`}</p>
              </Card>
            ) : null
          }
        />
        <Bar dataKey="present" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="absent" fill="hsl(var(--destructive) / 0.5)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
