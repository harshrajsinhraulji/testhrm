
"use client";

import { PageHeader } from "@/components/page-header";
import { EmployeeRoster } from "@/components/dashboard/employee-roster";

export default function EmployeesPage() {

    return (
        <div className="space-y-6">
            <PageHeader
                title="Employee Management"
                description="View, search, and manage all employees in the system."
            />
            <EmployeeRoster />
        </div>
    )
}
