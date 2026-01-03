"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/layout/user-nav";
import { usePathname } from "next/navigation";
import { DayflowLogo } from "../icons";
import { cn } from "@/lib/utils";

const getPageTitle = (pathname: string) => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 1) return "Dashboard";
    const title = segments[segments.length - 1];
    return title.charAt(0).toUpperCase() + title.slice(1);
};

export function AppHeader() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:h-auto sm:border-b sm:bg-card sm:px-6">
       <SidebarTrigger className="sm:hidden" />

       <div className="relative ml-auto flex-1 md:grow-0">
         {/* Search Bar can go here */}
       </div>
      <div className="ml-auto">
          <UserNav />
        </div>
    </header>
  );
}
