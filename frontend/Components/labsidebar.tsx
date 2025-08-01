"use client";

import { usePathname } from "next/navigation";
import { useState, useContext, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, LogOut, Settings, User2, Menu, X } from "lucide-react";
import { AuthContext } from "@/context/auth-context";
import { toast } from "sonner";
import Logo from "@/app/logo.png";
import Image from "next/image";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

import {
  LayoutGrid,
  KanbanSquare,
  Ticket,
  ClipboardList,
  BookText,
  Users,
  UserCheck,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";

const LabPartnerSidebar = () => {
  const {setUser, setAccessToken, apiClient} = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Generate dynamic menu items based on doctorId
  const items = useMemo(() => {
    return [
      {
        title: "Dashboard",
        url: `/lab`,
        icon: LayoutGrid,
      },
      {
        title: "Order",
        url: `/lab/order`,
        icon: ClipboardList,
      },
      {
        title: "Profile",
        url: `/lab/profile`,
        icon: User2,
      },
      /*{
        title: "Treatment Plans",
        url: `/doctor/${doctorId}/treatment-plans`,
        icon: UserCheck,
      },
      {
        title: "Patients Studies",
        url: `/dentist/studies`,
        icon: BarChart3,
      },*/
    ];
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.delete(
        `/auth/delete_token`,
        {
          withCredentials: true,
        }
      );
      if (response.status == 200) {
        setUser(null);
        setAccessToken("");
        router.push("/");
      } else {
        throw new Error("Error logging out");
      }
    } catch (err: any) {
      toast.error("Error logging out", {
        description: "Could not log out.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile hamburger menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden fixed top-4 left-4 z-50 bg-white shadow-md border"
        onClick={toggleMobileMenu}
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </Button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-opacity-80 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar - using shadcn Sidebar components */}
      <Sidebar className="hidden md:flex w-56 lg:w-64 bg-white shadow-sm min-h-screen border-r border-gray-200">
        <SidebarHeader className="p-4 md:p-6 border-b border-gray-100">
          <div className="flex items-center justify-center">
            <span className="h-15 w-15 mx-auto"><Image src={Logo} alt=""/></span>
            {/*<Image
              src={"/logo.jpg"}
              alt="Logo"
              width={120}
              height={40}
              className="object-contain"
            />*/}
          </div>
          <p className="text-sm text-gray-600 text-center mt-1">
            Lab Partner Dashboard
          </p>
        </SidebarHeader>

        <SidebarContent className="p-4">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-5">
                {items.map((item) => {
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <a
                          href={item.url}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                            isActive
                              ? "bg-emerald-100 text-emerald-700 border-l-4 border-emerald-500 shadow-sm"
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                        >
                          <item.icon
                            className={`w-5 h-5 ${
                              isActive ? "text-emerald-600" : "text-gray-500"
                            }`}
                          />
                          <span className="font-medium">{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-gray-100">
          <Button
            type="submit"
            className="cursor-pointer w-full bg-emerald-600 text-white hover:bg-emerald-500 transition-colors duration-200 flex items-center justify-center gap-2 py-2.5"
            onClick={handleLogout}
            disabled={isLoading}
          >
            <LogOut className="w-4 h-4" />
            {isLoading ? "Logging out..." : "Logout"}
          </Button>
        </SidebarFooter>
      </Sidebar>

      {/* Mobile Sidebar - custom div structure */}
      <div
        className={`md:hidden fixed left-0 top-0 z-40 w-72 bg-white shadow-lg min-h-screen border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-center">
            <span className="h-10 w-10 mx-auto"><Image src={Logo} alt="" className="h-10 w-10 mx-auto"/></span>
            {/*<Image
              src={"/logo.jpg"}
              alt="Logo"
              width={120}
              height={40}
              className="object-contain"
            />*/}
          </div>
          <p className="text-xs text-gray-600 text-center mt-1">
            Lab Partner Dashboard
          </p>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-1">
            {items.map((item) => {
              const isActive = pathname === item.url;
              return (
                <a
                  key={item.title}
                  href={item.url}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <item.icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? "text-emerald-600" : "text-emerald-500"
                    }`}
                  />
                  <span className="font-medium text-sm truncate">
                    {item.title}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Mobile Footer */}
        <div className="p-3 border-t border-gray-100">
          <Button
            type="submit"
            className="cursor-pointer w-full bg-emerald-600 text-white hover:bg-emerald-500 transition-colors duration-200 flex items-center justify-center gap-2 py-2 text-sm"
            onClick={handleLogout}
            disabled={isLoading}
          >
            <LogOut className="w-3 h-3" />
            {isLoading ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </>
  );
};

export default LabPartnerSidebar;