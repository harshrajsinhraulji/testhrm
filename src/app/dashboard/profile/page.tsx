
"use client";

import { useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.employeeDetails?.id) return;

    setIsUploading(true);

    // Convert image to data URI
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const res = await fetch(`/api/employees/${user.employeeDetails.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: dataUrl }),
        });

        if (!res.ok) throw new Error("Failed to upload image.");

        await refreshUser();
        toast({
          title: "Profile Picture Updated",
          description: "Your new avatar has been saved.",
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

  if (!user) return null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Your Profile"
        description="View and manage your personal and employment details."
      />

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatarUrl} alt={user.name} className="object-cover" />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
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
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.employeeDetails?.position}</p>
              <Separator className="my-4" />
              <div className="w-full text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Department:</span>
                  <span>{user.employeeDetails?.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Employee ID:</span>
                  <span>{user.employeeDetails?.employeeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Date Joined:</span>
                  <span>{new Date(user.employeeDetails?.dateOfJoining || '').toLocaleDateString()}</span>
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
                Update your contact and personal details here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
