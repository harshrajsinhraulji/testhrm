
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
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";
import { addDays, differenceInDays, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { mockLeaveRequests } from "@/lib/data";
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
import type { DateRange } from "react-day-picker";

const formSchema = z.object({
  leaveType: z.enum(["Paid", "Sick", "Unpaid", "Maternity"], {
    required_error: "Please select a leave type.",
  }),
  dateRange: z.object({
    from: z.date({ required_error: "A start date is required."}),
    to: z.date({ required_error: "An end date is required."}),
  }, { required_error: "Please select a date range."}),
  reason: z.string().min(10, { message: "Reason must be at least 10 characters." }).max(200),
}).refine(data => data.dateRange.to >= data.dateRange.from, {
  message: "End date cannot be before start date.",
  path: ["dateRange"],
});

type LeaveRequestFormValues = z.infer<typeof formSchema>;

type LeaveRequestFormProps = {
    setOpen: (open: boolean) => void;
};

export function LeaveRequestForm({ setOpen }: LeaveRequestFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [formData, setFormData] = React.useState<LeaveRequestFormValues | null>(null);
  
  const form = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
    }
  });
  
  function onSubmit(values: LeaveRequestFormValues) {
    setFormData(values);
    setIsConfirmOpen(true);
  }

  const calculateLeaveDays = () => {
    if (formData?.dateRange?.from && formData?.dateRange?.to) {
      const days = differenceInDays(formData.dateRange.to, formData.dateRange.from) + 1;
      return days > 0 ? days : 0;
    }
    return 0;
  };

  const handleConfirmSubmit = () => {
    if (!formData) return;
    setLoading(true);

    // Simulate API call for adding to mock data
    setTimeout(() => {
        if (!user?.employeeDetails?.employeeId) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not identify employee. Please log in again.",
            });
            setLoading(false);
            return;
        }

        mockLeaveRequests.unshift({
            id: `leave-${Date.now()}`,
            employeeId: user.employeeDetails.employeeId,
            employeeName: user.name,
            leaveType: formData.leaveType,
            startDate: formData.dateRange.from.toISOString(),
            endDate: formData.dateRange.to.toISOString(),
            reason: formData.reason,
            status: "Pending",
        });

        toast({
            title: "Leave Request Submitted",
            description: "Your request has been sent for approval.",
        });
        setLoading(false);
        setIsConfirmOpen(false);
        setOpen(false);
        form.reset();
    }, 1000);
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

          <FormField
            control={form.control}
            name="dateRange"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Leave Dates</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value?.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value?.from ? (
                          field.value.to ? (
                            <>
                              {format(field.value.from, "LLL dd, y")} -{" "}
                              {format(field.value.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(field.value.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={field.value?.from}
                      selected={field.value}
                      onSelect={field.onChange}
                      numberOfMonths={2}
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

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
              <span className="font-bold">{formData?.dateRange?.from ? format(formData.dateRange.from, "PPP") : ""}</span> to{" "}
              <span className="font-bold">{formData?.dateRange?.to ? format(formData.dateRange.to, "PPP") : ""}</span>.
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
