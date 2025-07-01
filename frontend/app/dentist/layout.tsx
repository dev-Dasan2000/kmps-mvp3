"use client"

import DoctorHeader from "@/components/Doctorheader"
import DoctorSidebar from "@/components/Doctorsidebar"
import PatientHeader from "@/components/patientHeader"

import { SidebarProvider } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import type React from "react"

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isRootPage = pathname === "/"
  
  if (isRootPage) {
    return (
      <div className="h-screen w-full bg-gray-100">
        {children}
      </div>
    )
  }

 return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <DoctorSidebar />
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
        <DoctorHeader/> {/* <- Add the Header component here */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
