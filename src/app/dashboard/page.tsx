"use client";

import { StatsCards } from "@/components/dashboard/stats-cards";
import { EmployeeRoster } from "@/components/dashboard/employee-roster";
import { RecentLeaveRequests } from "@/components/dashboard/recent-leave-requests";
import { EmployeeDashboardCards } from "@/components/dashboard/employee-dashboard-cards";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
  const { user, role } = useAuth();

  const isAdminOrHR = role === 'Admin' || role === 'HR';

  return (
    <div className="space-y-6">
      <PageHeader 
        title={isAdminOrHR ? "Admin Dashboard" : `Welcome, ${user?.name}!`}
        description={isAdminOrHR ? "Here's a summary of HR activities today." : "Manage your profile, attendance, and leave requests."} 
      />
      
      {isAdminOrHR ? (
        <>
          <StatsCards />
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Employee Roster</CardTitle>
                <CardDescription>An overview of all employees in the system.</CardDescription>
              </CardHeader>
              <CardContent>
                <EmployeeRoster />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Leave Requests</CardTitle>
                <CardDescription>A summary of the most recent leave requests.</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentLeaveRequests />
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <EmployeeDashboardCards />
      )}
    </div>
  );
}
