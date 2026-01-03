"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/layout/user-nav";
import { usePathname } from "next/navigation";

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
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <h1 className="flex-1 text-xl font-semibold">{title}</h1>
        <div className="ml-auto">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
