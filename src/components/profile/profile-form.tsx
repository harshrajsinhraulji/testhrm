"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "../ui/separator";

const profileSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email(),
  contactNumber: z.string().min(10, "Invalid phone number").or(z.literal("")),
  address: z.string().min(5, "Address is too short").or(z.literal("")),
  emergencyContactName: z.string().min(2, "Name is too short").or(z.literal("")),
  emergencyContactRelationship: z.string().min(2, "Relationship is too short").or(z.literal("")),
  emergencyContactPhone: z.string().min(10, "Invalid phone number").or(z.literal("")),
  // Admin only fields
  department: z.string().optional(),
  position: z.string().optional(),
});

export function ProfileForm() {
  const { user, role, refreshUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isAdmin = role === 'Admin' || role === 'HR';

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      contactNumber: user?.employeeDetails?.contactNumber || "",
      address: user?.employeeDetails?.address || "",
      emergencyContactName: user?.employeeDetails?.emergencyContact.name || "",
      emergencyContactRelationship: user?.employeeDetails?.emergencyContact.relationship || "",
      emergencyContactPhone: user?.employeeDetails?.emergencyContact.phone || "",
      department: user?.employeeDetails?.department || "",
      position: user?.employeeDetails?.position || "",
    },
  });

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setLoading(true);
    if (!user?.employeeDetails?.id) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not find user to update.",
        });
        setLoading(false);
        return;
    }
    
    try {
        const res = await fetch(`/api/employees/${user.employeeDetails.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });

        if (!res.ok) {
            throw new Error("Failed to update profile.");
        }

        // The API returns the updated user object
        const updatedUser = await res.json();
        
        // Refresh the user context with the new data
        await refreshUser();

        toast({
            title: "Profile Updated",
            description: "Your information has been saved successfully.",
        });

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: error.message || "An unexpected error occurred.",
        });
    } finally {
        setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h3 className="text-lg font-medium mb-4">Contact Information</h3>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input {...field} disabled={!isAdmin} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input {...field} disabled /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField control={form.control} name="contactNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <Separator />

        <div>
          <h3 className="text-lg font-medium mb-4">Emergency Contact</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <FormField control={form.control} name="emergencyContactName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="emergencyContactRelationship" render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="emergencyContactPhone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {isAdmin && (
            <>
                <Separator />
                <div>
                    <h3 className="text-lg font-medium mb-4">Employment Details (Admin)</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="department" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Department</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="position" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Position</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </div>
            </>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
