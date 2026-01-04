"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/lib/types";
import { format, differenceInDays, differenceInYears } from "date-fns";
import { Cake, Gift } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface UpcomingAnniversariesProps {
  employees: User[];
}

export function UpcomingAnniversaries({ employees }: UpcomingAnniversariesProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employees.length > 0) {
      setLoading(false);
    }
  }, [employees]);

  const upcomingAnniversaries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return employees
      .map(employee => {
        if (!employee.employeeDetails?.dateOfJoining) {
          return null;
        }
        const joinDate = new Date(employee.employeeDetails.dateOfJoining);
        const anniversaryYear = today.getFullYear();
        let nextAnniversary = new Date(anniversaryYear, joinDate.getMonth(), joinDate.getDate());

        if (nextAnniversary < today) {
          nextAnniversary.setFullYear(anniversaryYear + 1);
        }

        const diffDays = differenceInDays(nextAnniversary, today);

        if (diffDays >= 0 && diffDays <= 30) {
          return {
            ...employee,
            anniversaryDate: nextAnniversary,
            yearsAtCompany: differenceInYears(nextAnniversary, joinDate),
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => a!.anniversaryDate.getTime() - b!.anniversaryDate.getTime())
      .slice(0, 5); // Limit to show top 5 upcoming
  }, [employees]);


  if (loading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Anniversaries</CardTitle>
        <CardDescription>Work anniversaries in the next 30 days.</CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingAnniversaries.length > 0 ? (
          <div className="space-y-4">
            {upcomingAnniversaries.map((employee) => {
              if (!employee) return null;
              return (
                <div key={employee.id} className="flex items-center gap-4">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={employee.avatarUrl} alt={employee.name} className="object-cover" />
                    <AvatarFallback>{employee.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{employee.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Celebrating {employee.yearsAtCompany} Year{employee.yearsAtCompany > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                     {format(employee.anniversaryDate, "MMM dd")}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-6">
            <Gift className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No Upcoming Anniversaries</p>
            <p className="text-xs text-muted-foreground">No work anniversaries in the next 30 days.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
