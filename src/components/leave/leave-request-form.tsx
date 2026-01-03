
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { differenceInDays, parse } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { useAuth } from "@/hooks/use-auth";
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

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const formSchema = z.object({
  leaveType: z.enum(["Paid", "Sick", "Unpaid", "Maternity"], {
    required_error: "Please select a leave type.",
  }),
  startDate: z.string().regex(dateRegex, "Date must be in YYYY-MM-DD format.").min(1, "Start date is required."),
  endDate: z.string().regex(dateRegex, "Date must be in YYYY-MM-DD format.").min(1, "End date is required."),
  reason: z.string().min(10, { message: "Reason must be at least 10 characters." }).max(200),
}).refine(data => {
    try {
        const start = parse(data.startDate, 'yyyy-MM-dd', new Date());
        const end = parse(data.endDate, 'yyyy-MM-dd', new Date());
        return end >= start;
    } catch {
        return false;
    }
}, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});


type LeaveRequestFormValues = z.infer<typeof formSchema>;

type LeaveRequestFormProps = {
    setOpen: (open: boolean) => void;
    onFormSubmit: () => void;
};

export function LeaveRequestForm({ setOpen, onFormSubmit }: LeaveRequestFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [formData, setFormData] = React.useState<LeaveRequestFormValues | null>(null);
  
  const form = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: "",
      endDate: "",
      reason: "",
    }
  });
  
  function onSubmit(values: LeaveRequestFormValues) {
    setFormData(values);
    setIsConfirmOpen(true);
  }

  const calculateLeaveDays = () => {
    if (formData) {
        try {
            const start = parse(formData.startDate, 'yyyy-MM-dd', new Date());
            const end = parse(formData.endDate, 'yyyy-MM-dd', new Date());
            const days = differenceInDays(end, start) + 1;
            return days > 0 ? days : 0;
        } catch {
            return 0;
        }
    }
    return 0;
  };

  const handleConfirmSubmit = async () => {
    if (!formData || !user?.id) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not identify employee. Please log in again.",
        });
        return;
    }
    setLoading(true);

    try {
      const response = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          employeeId: user.id, // Use the user's database UUID
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit leave request.');
      }
      
      toast({
        title: "Leave Request Submitted",
        description: "Your request has been sent for approval.",
      });

      onFormSubmit(); // Re-fetch leave requests on the parent page
      setIsConfirmOpen(false);
      setOpen(false);
      form.reset();

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Could not submit your request. Please try again.",
        });
    } finally {
        setLoading(false);
    }
  };


  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="leaveType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Leave Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a leave type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Sick">Sick</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Maternity">Maternity</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input placeholder="YYYY-MM-DD" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input placeholder="YYYY-MM-DD" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason</FormLabel>
                <FormControl>
                  <Textarea placeholder="Please provide a reason for your leave..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={loading || !form.formState.isValid}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Request
          </Button>
        </form>
      </Form>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Leave Request</AlertDialogTitle>
            <AlertDialogDescription>
              You are requesting a leave of absence for{" "}
              <span className="font-bold">{calculateLeaveDays()}</span> day(s) from{" "}
              <span className="font-bold">{formData?.startDate}</span> to{" "}
              <span className="font-bold">{formData?.endDate}</span>.
              Please confirm that you want to submit this request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
