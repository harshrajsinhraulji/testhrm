
"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useAuth } from "@/hooks/use-auth";
import type { AttendanceRecord } from "@/lib/types";
import { subDays, format } from "date-fns";
import { Skeleton } from "../ui/skeleton";

const chartConfig = {
  Present: {
    label: "Present",
    color: "hsl(var(--chart-2))",
  },
  Absent: {
    label: "Absent",
    color: "hsl(var(--chart-5))",
  },
  Leave: {
    label: "On Leave",
    color: "hsl(var(--chart-1))",
  },
  "Half-day": {
    label: "Half-day",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function EmployeeCharts() {
  const { user } = useAuth();
  const [attendance, setAttendance] = React.useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user?.id) return;
    async function fetchAttendance() {
      try {
        const res = await fetch(`/api/attendance?employeeId=${user.id}`);
        if (!res.ok) throw new Error("Failed to fetch attendance");
        const data = await res.json();

        // Filter for the last 30 days
        const thirtyDaysAgo = subDays(new Date(), 30);
        const recentRecords = data.filter(
          (record: AttendanceRecord) => new Date(record.date) >= thirtyDaysAgo
        );

        setAttendance(recentRecords);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchAttendance();
  }, [user]);

  const attendanceSummary = React.useMemo(() => {
    if (!attendance.length) return [];

    const summary = attendance.reduce((acc, record) => {
      const status = record.status;
      const existing = acc.find((item) => item.status === status);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ status: status, count: 1, fill: `var(--color-${status})` });
      }
      return acc;
    }, [] as { status: string; count: number; fill: string }[]);

    return summary;
  }, [attendance]);

  const totalDays = attendance.length;

  if (loading) {
     return (
         <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64 mt-1" />
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <Skeleton className="h-[200px] w-[200px] rounded-full mx-auto" />
            </CardContent>
        </Card>
     )
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Attendance Summary</CardTitle>
        <CardDescription>Last 30 days</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={attendanceSummary}
              dataKey="count"
              nameKey="status"
              innerRadius={60}
              strokeWidth={5}
              labelLine={false}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <>
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {totalDays.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 20}
                            className="fill-muted-foreground"
                          >
                            Days
                          </tspan>
                        </text>
                      </>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
