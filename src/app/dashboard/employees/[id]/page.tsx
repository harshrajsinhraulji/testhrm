'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { ProfileForm } from '@/components/profile/profile-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { Camera, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function EmployeeProfilePage() {
  const { role } = useAuth();
  const isAdminOrHR = role === 'Admin' || role === 'HR';
  const params = useParams();
  const router = useRouter();
  const { id: employeeId } = params;
  const { toast } = useToast();

  const [employee, setEmployee] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEmployee = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}/details`);
      if (!res.ok) {
        throw new Error('Failed to fetch employee details.');
      }
      const data: User = await res.json();
      setEmployee(data);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      router.push('/dashboard/employees');
    } finally {
      setLoading(false);
    }
  }, [employeeId, toast, router]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  const handlePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !employee?.employeeDetails?.id) return;

    setIsUploading(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const res = await fetch(`/api/employees/${employee.employeeDetails.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: dataUrl }),
        });

        if (!res.ok) throw new Error("Failed to upload image.");
        
        await fetchEmployee();
        
        toast({
          title: "Profile Picture Updated",
          description: `Avatar for ${employee.name} has been saved.`,
        });

      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: error.message,
        });
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to read file.",
      });
      setIsUploading(false);
    };
  };

  if (loading) {
    return (
        <div className="space-y-8">
            <PageHeader title="Loading Profile..." description="Please wait while we fetch the employee data.">
                 <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
            </PageHeader>
             <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-1"><Skeleton className="h-64 w-full" /></div>
                <div className="md:col-span-2"><Skeleton className="h-96 w-full" /></div>
            </div>
        </div>
    )
  }

  if (!employee) {
    return <div>Employee not found.</div>;
  }
  
  if (!isAdminOrHR) {
      return (
        <div className="text-center py-10">
            <h1 className='text-2xl font-bold'>Access Denied</h1>
            <p className='text-muted-foreground'>You do not have permission to view this page.</p>
             <Button variant="outline" onClick={() => router.push('/dashboard')} className="mt-4">
                Return to Dashboard
            </Button>
        </div>
      )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Employee Profile"
        description={`View and manage details for ${employee.name}.`}
      >
        <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Roster
        </Button>
      </PageHeader>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={employee.avatarUrl} alt={employee.name} className="object-cover" />
                  <AvatarFallback>{employee.name[0]}</AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePictureChange}
                  className="hidden"
                  accept="image/png, image/jpeg, image/gif"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    <span className="sr-only">Change picture</span>
                </Button>
              </div>
              <h2 className="text-xl font-bold">{employee.name}</h2>
              <p className="text-sm text-muted-foreground">{employee.employeeDetails?.position}</p>
              <Separator className="my-4" />
              <div className="w-full text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Department:</span>
                  <span>{employee.employeeDetails?.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Employee ID:</span>
                  <span>{employee.employeeDetails?.employeeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Date Joined:</span>
                  <span>{new Date(employee.employeeDetails?.dateOfJoining || '').toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update employee contact and personal details here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm employee={employee} onFormSubmit={fetchEmployee} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
