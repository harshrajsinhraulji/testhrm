
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
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { SalaryStructure } from "@/lib/types";
import { getPredefinedSalary } from "@/lib/salary-config";
import { useAuth } from "@/hooks/use-auth";

const formSchema = z.object({
  basicSalary: z.coerce.number().min(0, "Cannot be negative"),
  hra: z.coerce.number().min(0, "Cannot be negative"),
  otherAllowances: z.coerce.number().min(0, "Cannot be negative"),
  pf: z.coerce.number().min(0, "Cannot be negative"),
});

type EditSalaryFormValues = z.infer<typeof formSchema>;

interface EditSalaryFormProps {
  structure: SalaryStructure;
  onFormSubmit: () => void;
}

export function EditSalaryForm({ structure, onFormSubmit }: EditSalaryFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  // Find the full employee object to get department and position
  // This is a bit of a workaround; ideally the structure would already have this.
  // We'll assume the payroll page has access to the employee list.
  // For a more robust app, we'd fetch employee details if needed.
  const [employeeDetails, setEmployeeDetails] = useState<{department: string, position: string} | null>(null)

  useEffect(() => {
    async function fetchEmployeeDetails() {
        if(structure.employeeDbId) {
            const res = await fetch(`/api/employees/${structure.employeeDbId}`);
            if(res.ok) {
                const data = await res.json();
                setEmployeeDetails(data.employeeDetails);
            }
        }
    }
    fetchEmployeeDetails();
  }, [structure.employeeDbId]);


  const form = useForm<EditSalaryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      basicSalary: 0,
      hra: 0,
      otherAllowances: 0,
      pf: 0,
    },
  });

  useEffect(() => {
    // If a structure exists (basic salary is not 0), use it.
    // Otherwise, try to set a predefined salary.
    if (structure.basicSalary > 0) {
        form.reset({
            basicSalary: structure.basicSalary || 0,
            hra: structure.hra || 0,
            otherAllowances: structure.otherAllowances || 0,
            pf: structure.pf || 0,
        });
    } else if (employeeDetails) {
        const predefined = getPredefinedSalary(employeeDetails.department, employeeDetails.position);
        form.reset({
            basicSalary: predefined.basic,
            hra: predefined.hra,
            otherAllowances: predefined.otherAllowances,
            pf: predefined.pf,
        });
    }
  }, [structure, employeeDetails, form]);


  async function onSubmit(values: EditSalaryFormValues) {
    setLoading(true);
    try {
      const response = await fetch('/api/payroll', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          employeeId: structure.employeeDbId, // Send the UUID to the backend
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update salary structure.');
      }
      
      toast({
        title: "Salary Structure Updated",
        description: `Successfully updated salary for ${structure.employeeName}.`,
      });

      onFormSubmit(); // Re-fetch data and close dialog on the parent page

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Could not update salary structure.",
        });
    } finally {
        setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="basicSalary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Basic Salary</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="hra"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HRA</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="pf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provident Fund (PF)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="otherAllowances"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Other Allowances</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <div className="pt-4 flex justify-end">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
        </div>
      </form>
    </Form>
  );
}
