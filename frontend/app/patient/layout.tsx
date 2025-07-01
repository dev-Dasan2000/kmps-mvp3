"use client"

import PatientHeader from "@/components/patientHeader"
import PatientSidebar from "@/components/patientsidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import type React from "react"

export default function PatientLayout({
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
     <PatientSidebar/>
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
          <PatientHeader/> {/* <- Add the Header component here */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
