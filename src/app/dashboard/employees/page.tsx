
"use client";

import { PageHeader } from "@/components/page-header";
import { EmployeeRoster } from "@/components/dashboard/employee-roster";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmployeesPage() {

    return (
        <div className="space-y-6">
            <PageHeader
                title="Employee Management"
                description="View, search, and manage all employees in the system."
            />
            <Card>
                <CardHeader>
                    <CardTitle>All Employees</CardTitle>
                    <CardDescription>A complete list of all employees in the database.</CardDescription>
                </CardHeader>
                <CardContent>
                    <EmployeeRoster />
                </CardContent>
            </Card>
        </div>
    )
}
