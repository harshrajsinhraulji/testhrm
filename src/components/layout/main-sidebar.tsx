"use client";

import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  CalendarCheck,
  Plane,
  Wallet,
  User,
  LogOut,
  Users,
} from "lucide-react";
import { DayflowLogo } from "@/components/icons";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const employeeMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/attendance", label: "My Attendance", icon: CalendarCheck },
  { href: "/dashboard/leave", label: "My Leave", icon: Plane },
  { href: "/dashboard/payroll", label: "My Payroll", icon: Wallet },
  { href: "/dashboard/profile", label: "My Profile", icon: User },
];

const adminMenuItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/employees", label: "Employees", icon: Users },
    { href: "/dashboard/attendance", label: "Attendance", icon: CalendarCheck },
    { href: "/dashboard/leave", label: "Leave", icon: Plane },
    { href: "/dashboard/payroll", label: "Payroll", icon: Wallet },
]

export function MainSidebar() {
  const pathname = usePathname();
  const { user, logout, role } = useAuth();

  const menuItems = (role === 'Admin' || role === 'HR') ? adminMenuItems : employeeMenuItems;

  return (
    <Sidebar side="left" className="border-r bg-card">
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <DayflowLogo className="w-8 h-8 text-primary" />
          <span className="text-lg font-semibold text-foreground font-headline">
            Dayflow
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                href={item.href}
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <a href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={logout} tooltip="Logout">
                    <LogOut />
                    <span>Logout</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex items-center gap-3 p-2 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatarUrl} alt={user?.name} className="object-cover" />
                <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="overflow-hidden whitespace-nowrap group-data-[collapsible=icon]:hidden">
                <p className="font-semibold text-sm truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
