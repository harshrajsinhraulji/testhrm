import { StatsCards } from "@/components/dashboard/stats-cards";
import { AttendanceOverviewChart } from "@/components/dashboard/attendance-overview-chart";
import { RecentLeaveRequests } from "@/components/dashboard/recent-leave-requests";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Welcome to your Dashboard" description="Here's a summary of HR activities today." />
      
      <StatsCards />

      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Weekly Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceOverviewChart />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentLeaveRequests />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
