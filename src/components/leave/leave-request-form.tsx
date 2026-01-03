
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
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { mockLeaveRequests } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";
import type { DateRange } from "react-day-picker";

const formSchema = z.object({
  leaveType: z.enum(["Paid", "Sick", "Unpaid", "Maternity"], {
    required_error: "Please select a leave type.",
  }),
  dateRange: z.object({
    from: z.date({ required_error: "A start date is required." }),
    to: z.date({ required_error: "An end date is required." }),
  }),
  reason: z.string().min(10, { message: "Reason must be at least 10 characters." }).max(200),
});

type LeaveRequestFormProps = {
    setOpen: (open: boolean) => void;
};

export function LeaveRequestForm({ setOpen }: LeaveRequestFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
    }
  });

  // Get the date range value from the form
  const date = form.watch("dateRange");

  function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
        mockLeaveRequests.unshift({
            id: `leave-${Date.now()}`,
            employeeId: user!.employeeDetails!.employeeId,
            employeeName: user!.name,
            leaveType: values.leaveType,
            startDate: values.dateRange.from.toISOString(),
            endDate: values.dateRange.to.toISOString(),
            reason: values.reason,
            status: "Pending",
        });

        toast({
            title: "Leave Request Submitted",
            description: "Your request has been sent for approval.",
        });
        setLoading(false);
        setOpen(false);
    }, 1000);
  }

  return (
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
              <FormLabel>Dates</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !date?.from && "text-muted-foreground"
                      )}
                    >
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "LLL dd, y")} -{" "}
                            {format(date.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(date.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={date}
                    onSelect={field.onChange}
                    numberOfMonths={2}
                    initialFocus
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
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Request
        </Button>
      </form>
    </Form>
  );
}
