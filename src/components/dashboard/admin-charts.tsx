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
import { cn } from "@/lib/utils";

const chartConfig = {
  count: {
    label: "Employees",
  },
  "Engineering": { label: "Engineering", color: "hsl(220, 80%, 60%)" },
  "Product": { label: "Product", color: "hsl(190, 80%, 55%)" },
  "Design": { label: "Design", color: "hsl(170, 70%, 50%)" },
  "Sales": { label: "Sales", color: "hsl(350, 80%, 65%)" },
  "Marketing": { label: "Marketing", color: "hsl(30, 85%, 60%)" },
  "Human Resources": { label: "Human Resources", color: "hsl(260, 75%, 65%)" },
  "Finance": { label: "Finance", color: "hsl(120, 50%, 55%)" },
  "Customer Support": { label: "Customer Support", color: "hsl(50, 90%, 60%)" },
  "Unassigned": { label: "Unassigned", color: "hsl(var(--muted))" },
} satisfies ChartConfig;

const getDepartmentColor = (department: string): string => {
  return chartConfig[department as keyof typeof chartConfig]?.color || "hsl(var(--muted))";
};

interface AdminChartsProps {
  onDepartmentSelect: (department: string | null) => void;
  selectedDepartment: string | null;
}

export function AdminCharts({ onDepartmentSelect, selectedDepartment }: AdminChartsProps) {
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
            dateOfJoining: item.date_of_joining,
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
          Click a department to filter the employee roster.
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
            onClick={(e) => {
                if (e && e.activePayload && e.activePayload[0]) {
                    const department = e.activePayload[0].payload.department;
                    onDepartmentSelect(department === selectedDepartment ? null : department);
                }
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
              tickFormatter={(value) =>
                chartConfig[value as keyof typeof chartConfig]?.label
              }
            />
            <ChartTooltip
              cursor={{fill: 'hsl(var(--muted))'}}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" radius={5}>
              {departmentData.map((entry) => (
                <Cell
                    key={`cell-${entry.department}`}
                    fill={getDepartmentColor(entry.department)}
                    className={cn(
                        "cursor-pointer",
                        selectedDepartment && selectedDepartment !== entry.department && "opacity-50"
                    )}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
