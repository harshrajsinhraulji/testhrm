
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowRight, User, CalendarCheck, Plane } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

const cardData = [
    {
        title: "My Profile",
        description: "View and update your personal details.",
        icon: User,
        href: "/dashboard/profile"
    },
    {
        title: "My Attendance",
        description: "Check your daily and weekly attendance records.",
        icon: CalendarCheck,
        href: "/dashboard/attendance"
    },
    {
        title: "My Leave",
        description: "Apply for time-off and track your requests.",
        icon: Plane,
        href: "/dashboard/leave"
    }
]

export function EmployeeDashboardCards() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {cardData.map((card) => (
        <Card key={card.title}>
            <CardHeader className="flex flex-row items-center gap-4">
                <div className="grid gap-1">
                    <CardTitle className="text-xl">{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                </div>
                <card.icon className="h-10 w-10 text-muted-foreground ml-auto" />
            </CardHeader>
            <CardContent>
                <Button asChild variant="outline" className="w-full">
                    <Link href={card.href}>
                        Go to {card.title}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
      ))}
    </div>
  );
}
