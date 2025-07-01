"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import type React from "react";
import RadiologistSidebar from "@/components/Radiologistsidebar";
import RadiologistHeader from "@/components/Radiologistheader";

export default function RadiologistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isRootPage = pathname === "/";

  if (isRootPage) {
    return <div className="h-screen w-full bg-gray-100">{children}</div>;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-100">
        <RadiologistSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <RadiologistHeader />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}