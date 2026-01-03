
"use client";

import { StatsCards } from "@/components/dashboard/stats-cards";
import { EmployeeRoster } from "@/components/dashboard/employee-roster";
import { RecentLeaveRequests } from "@/components/dashboard/recent-leave-requests";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { AdminCharts } from "@/components/dashboard/admin-charts";
import { EmployeeCharts } from "@/components/dashboard/employee-charts";


const getWelcomeContent = (role: string | null, name?: string) => {
    switch (role) {
        case 'Admin':
            return { title: 'Admin Dashboard', description: "Here's a summary of HR activities today." };
        case 'HR':
            return { title: `Welcome, ${name}!`, description: "Here's an overview of employee management." };
        case 'Employee':
        default:
            return { title: `Welcome, ${name}!`, description: "Manage your profile, attendance, and leave requests." };
    }
}

export default function DashboardPage() {
  const { user, role } = useAuth();
  
  const { title, description } = getWelcomeContent(role, user?.name);
  const isAdminOrHR = role === 'Admin' || role === 'HR';

  return (
    <div className="space-y-6">
      <PageHeader 
        title={title}
        description={description} 
      />
      
      {isAdminOrHR ? (
        <>
          <StatsCards />
          <AdminCharts />
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
        <EmployeeCharts />
      )}
    </div>
  );
}
