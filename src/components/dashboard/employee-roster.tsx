
"use client";

import { useEffect, useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import type { User } from "@/lib/types";
import { Button } from "../ui/button";
import { Eye, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Input } from "../ui/input";

export function EmployeeRoster() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchEmployees() {
      try {
        setLoading(true);
        const response = await fetch('/api/employees');
        if (!response.ok) {
          throw new Error('Failed to fetch employees');
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
                dateOfJoining: '',
                contactNumber: '',
                address: '',
                emergencyContact: { name: '', relationship: '', phone: '' }
            }
        }));
        setEmployees(users);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    if (!searchTerm) {
      return employees;
    }
    return employees.filter(employee => 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeDetails?.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, employees]);

  const handleViewProfile = (employeeId: string) => {
    router.push(`/dashboard/employees/${employeeId}`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="grid gap-1">
                <CardTitle>All Employees</CardTitle>
                <CardDescription>A complete list of all employees in the database.</CardDescription>
            </div>
            <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by name or ID..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 h-12">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : error ? (
            <div className="text-center text-red-500 py-10">{error}</div>
        ) : (
          <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {filteredEmployees.length > 0 ? filteredEmployees.map((employee) => (
                      <TableRow key={employee.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleViewProfile(employee.id)}>
                          <TableCell>
                              <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                      <AvatarImage src={employee.avatarUrl} alt={employee.name} />
                                      <AvatarFallback>{employee.name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="grid gap-0.5">
                                      <p className="font-medium">{employee.name}</p>
                                      <p className="text-xs text-muted-foreground">{employee.employeeDetails?.employeeId}</p>
                                  </div>
                              </div>
                          </TableCell>
                          <TableCell>{employee.employeeDetails?.department || 'N/A'}</TableCell>
                          <TableCell>
                              <Badge variant={employee.role === 'Admin' ? 'default' : 'secondary'}>{employee.role}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleViewProfile(employee.id); }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                            </Button>
                          </TableCell>
                      </TableRow>
                  )) : (
                      <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                              No employees found {searchTerm ? `matching "${searchTerm}"` : ". Try signing up a new user."}
                          </TableCell>
                      </TableRow>
                  )}
              </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
