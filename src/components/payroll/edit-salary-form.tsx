
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
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { SalaryStructure } from "@/lib/types";

const formSchema = z.object({
  basicSalary: z.coerce.number().min(0, "Cannot be negative"),
  hra: z.coerce.number().min(0, "Cannot be negative"),
  otherAllowances: z.coerce.number().min(0, "Cannot be negative"),
  pf: z.coerce.number().min(0, "Cannot be negative"),
});

type EditSalaryFormValues = z.infer<typeof formSchema>;

interface EditSalaryFormProps {
  structure: SalaryStructure;
  setOpen: (open: boolean) => void;
  onFormSubmit: () => void;
}

export function EditSalaryForm({ structure, setOpen, onFormSubmit }: EditSalaryFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<EditSalaryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      basicSalary: structure.basicSalary || 0,
      hra: structure.hra || 0,
      otherAllowances: structure.otherAllowances || 0,
      pf: structure.pf || 0,
    },
  });

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

      onFormSubmit(); // Re-fetch data on the parent page
      setOpen(false);

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
