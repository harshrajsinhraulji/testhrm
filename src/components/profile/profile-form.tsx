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
import type { User, UserRole } from "@/lib/types";
import { departments, positionsByDepartment } from "@/lib/departments-config";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const profileSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email(),
  contactNumber: z.string().min(10, "Invalid phone number").or(z.literal("")),
  address: z.string().min(5, "Address is too short").or(z.literal("")),
  emergencyContactName: z.string().min(2, "Name is too short").or(z.literal("")),
  emergencyContactRelationship: z
    .string()
    .min(2, "Relationship is too short")
    .or(z.literal("")),
  emergencyContactPhone: z
    .string()
    .min(10, "Invalid phone number")
    .or(z.literal("")),
  department: z.string().optional(),
  position: z.string().optional(),
  role: z.custom<UserRole>().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  employee?: User | null;
  onFormSubmit?: () => void;
}

export function ProfileForm({ employee, onFormSubmit }: ProfileFormProps) {
  const { user: loggedInUser, role: loggedInUserRole, refreshUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [formData, setFormData] = useState<ProfileFormValues | null>(null);

  const userToEdit = employee || loggedInUser;
  const isSelf = loggedInUser?.id === userToEdit?.id;

  const canEditPersonalInfo = loggedInUserRole === "Admin" || isSelf;
  const canEditEmploymentInfo = loggedInUserRole === "Admin" || loggedInUserRole === "HR";
  const isFullNameDisabled =
    (loggedInUserRole === "HR" && !isSelf) || (loggedInUserRole !== "Admin" && !isSelf);
  const isAdmin = loggedInUserRole === "Admin";

  const form = useForm<ProfileFormValues>({
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
      role: "Employee",
    },
  });

  const selectedDepartment = form.watch("department");

  useEffect(() => {
    if (userToEdit) {
      form.reset({
        name: userToEdit.name || "",
        email: userToEdit.email || "",
        contactNumber: userToEdit.employeeDetails?.contactNumber || "",
        address: userToEdit.employeeDetails?.address || "",
        emergencyContactName:
          userToEdit.employeeDetails?.emergencyContact.name || "",
        emergencyContactRelationship:
          userToEdit.employeeDetails?.emergencyContact.relationship || "",
        emergencyContactPhone:
          userToEdit.employeeDetails?.emergencyContact.phone || "",
        department: userToEdit.employeeDetails?.department || "",
        position: userToEdit.employeeDetails?.position || "",
        role: userToEdit.role || "Employee",
      });
    }
  }, [userToEdit, form]);

  // safety: clear invalid position if department changes
  useEffect(() => {
    const position = form.getValues("position");
    if (
      selectedDepartment &&
      position &&
      !positionsByDepartment[selectedDepartment]?.includes(position)
    ) {
      form.setValue("position", "");
    }
  }, [selectedDepartment, form]);

  function onSubmit(values: ProfileFormValues) {
    const originalDept = userToEdit?.employeeDetails?.department;
    const originalPos = userToEdit?.employeeDetails?.position;

    if (
      canEditEmploymentInfo &&
      (values.department !== originalDept || values.position !== originalPos)
    ) {
      setFormData(values);
      setIsConfirmOpen(true);
      return;
    }

    handleConfirmSubmit(values);
  }

  async function handleConfirmSubmit(values: ProfileFormValues) {
    setIsConfirmOpen(false);
    setLoading(true);

    if (!userToEdit?.employeeDetails?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User not found.",
      });
      setLoading(false);
      return;
    }

    let payload: Partial<ProfileFormValues> = {};

    if (canEditPersonalInfo) {
      payload = {
        ...payload,
        name: values.name,
        contactNumber: values.contactNumber,
        address: values.address,
        emergencyContactName: values.emergencyContactName,
        emergencyContactRelationship: values.emergencyContactRelationship,
        emergencyContactPhone: values.emergencyContactPhone,
      };
    }

    if (canEditEmploymentInfo) {
      payload = {
        ...payload,
        department: values.department,
        position: values.position,
      };
    }
    
    if (isAdmin) {
      payload = { ...payload, role: values.role };
    }
    
    delete (payload as any).email;

    try {
      const res = await fetch(
        `/api/employees/${userToEdit.employeeDetails.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Update failed");

      if (onFormSubmit) {
        onFormSubmit();
      } else {
        await refreshUser();
      }
      toast({ title: "Profile updated" });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e.message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div>
            <h3 className="text-lg font-medium mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isFullNameDisabled} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEditPersonalInfo} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEditPersonalInfo} />
                    </FormControl>
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
              <FormField
                control={form.control}
                name="emergencyContactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEditPersonalInfo} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergencyContactRelationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEditPersonalInfo} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergencyContactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEditPersonalInfo} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {(canEditEmploymentInfo) && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-4">
                  Employment Details
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(v) => {
                            field.onChange(v);
                          }}
                          disabled={!canEditEmploymentInfo}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((d) => (
                              <SelectItem key={d} value={d}>
                                {d}
                              </SelectItem>
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
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!canEditEmploymentInfo || !selectedDepartment}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a position" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedDepartment &&
                              positionsByDepartment[selectedDepartment]?.map(
                                (p) => (
                                  <SelectItem key={p} value={p}>
                                    {p}
                                  </SelectItem>
                                )
                              )}
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

          {isAdmin && (
            <>
                <Separator />
                <div>
                     <h3 className="text-lg font-medium mb-4">
                        Admin Controls
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>User Role</FormLabel>
                                <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={!isAdmin}
                                >
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Employee">Employee</SelectItem>
                                    <SelectItem value="HR">HR</SelectItem>
                                    <SelectItem value="Admin">Admin</SelectItem>
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
            <Button
              type="submit"
              disabled={loading || !form.formState.isDirty}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Employment Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to change this employee's role. This will
              automatically update their salary structure based on the new
              position. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => formData && handleConfirmSubmit(formData)}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm & Update Salary
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
