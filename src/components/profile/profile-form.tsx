
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "../ui/separator";
import type { User } from "@/lib/types";
import { departments, positionsByDepartment } from "@/lib/departments-config";

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

interface ProfileFormProps {
    employee?: User | null; // Make employee optional
    onFormSubmit?: () => void;
}

export function ProfileForm({ employee, onFormSubmit }: ProfileFormProps) {
  const { user: loggedInUser, role, refreshUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isAdmin = role === 'Admin' || role === 'HR';

  // Determine which user object to use: the one passed as a prop, or the logged-in user.
  const userToEdit = employee || loggedInUser;

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      contactNumber: "",
      address: "",
      emergencyContactName: "",
      emergencyContactRelationship: "",
      emergencyContactPhone: "",
      department: "",
      position: "",
    },
  });

  useEffect(() => {
    if (userToEdit) {
        form.reset({
            name: userToEdit.name || "",
            email: userToEdit.email || "",
            contactNumber: userToEdit.employeeDetails?.contactNumber || "",
            address: userToEdit.employeeDetails?.address || "",
            emergencyContactName: userToEdit.employeeDetails?.emergencyContact.name || "",
            emergencyContactRelationship: userToEdit.employeeDetails?.emergencyContact.relationship || "",
            emergencyContactPhone: userToEdit.employeeDetails?.emergencyContact.phone || "",
            department: userToEdit.employeeDetails?.department || "",
            position: userToEdit.employeeDetails?.position || "",
        });
    }
  }, [userToEdit, form]);

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setLoading(true);
    if (!userToEdit?.employeeDetails?.id) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not find user to update.",
        });
        setLoading(false);
        return;
    }
    
    // Omit fields that are not meant to be updated by this form
    const { email, department, position, ...updatePayload } = values;

    try {
        const res = await fetch(`/api/employees/${userToEdit.employeeDetails.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload),
        });

        if (!res.ok) {
            throw new Error("Failed to update profile.");
        }
        
        // If an onFormSubmit callback is provided (for editing others), use it.
        // Otherwise, use the default refreshUser for the logged-in user.
        if (onFormSubmit) {
            onFormSubmit();
        } else {
            await refreshUser();
        }

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
                    <h3 className="text-lg font-medium mb-4">Employment Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="department"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Department</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select a department" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {departments.map(dept => (
                                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="position"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Position</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select a position" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {userToEdit?.employeeDetails?.department && positionsByDepartment[userToEdit.employeeDetails.department]?.map(pos => (
                                        <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                </div>
            </>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={loading || !form.formState.isDirty}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
