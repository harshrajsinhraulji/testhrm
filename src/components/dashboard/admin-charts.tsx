
"use client";

import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";

const chartConfig = {
  count: {
    label: "Employees",
  },
  Engineering: {
    label: "Engineering",
    color: "hsl(var(--chart-1))",
  },
  Product: {
    label: "Product",
    color: "hsl(var(--chart-2))",
  },
  Design: {
    label: "Design",
    color: "hsl(var(--chart-3))",
  },
  Sales: {
    label: "Sales",
    color: "hsl(var(--chart-4))",
  },
  Marketing: {
    label: "Marketing",
    color: "hsl(var(--chart-5))",
  },
  "Human Resources": {
    label: "Human Resources",
    color: "hsl(var(--chart-2))",
  },
  Finance: {
    label: "Finance",
    color: "hsl(var(--chart-3))",
  },
  "Customer Support": {
    label: "Customer Support",
    color: "hsl(var(--chart-4))",
  },
   Unassigned: {
    label: "Unassigned",
    color: "hsl(var(--muted))",
  },
} satisfies ChartConfig;


export function AdminCharts() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const response = await fetch("/api/employees");
        if (!response.ok) {
          throw new Error("Failed to fetch employees");
        }
        const data = await response.json();
        const users: User[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          role: item.role,
          avatarUrl: item.avatar_url,
          employeeDetails: {
            id: item.id,
            employeeId: item.employee_id,
            department: item.department,
            position: item.position,
            dateOfJoining: "",
            contactNumber: "",
            address: "",
            emergencyContact: { name: "", relationship: "", phone: "" },
          },
        }));
        setEmployees(users);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, []);

  const departmentData = useMemo(() => {
    if (!employees.length) return [];
    const counts = employees.reduce((acc, employee) => {
      const dept = employee.employeeDetails?.department || "Unassigned";
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([department, count]) => ({
      department,
      count,
      fill: `var(--color-${department.replace(/[\s/]/g, "")})`
    }));
  }, [employees]);


  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Headcount by Department</CardTitle>
        <CardDescription>
          A summary of employee distribution across departments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="min-h-[200px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={departmentData}
            layout="vertical"
            margin={{
              left: -20,
            }}
          >
            <XAxis type="number" hide />
            <YAxis
              dataKey="department"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              className="text-sm"
              width={120}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" radius={5}>
              {departmentData.map((entry) => (
                <Cell key={entry.department} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
