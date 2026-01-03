"use client";

import { MainSidebar } from "@/components/layout/main-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/40">
        <MainSidebar />
        <div className="flex-1 flex flex-col">
          <AppHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
