"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useContext } from "react";
import Logo from '@/app/logo.png';
import { AuthContext } from "@/context/auth-context";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  FileText,
  LogOut,
  Menu,
  X,
  Image as ImageIcon,
  MonitorSmartphone,
  FolderKanban,
} from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { toast } from "sonner";

const RadiologistSidebar = () => {
  const { setUser, setAccessToken, apiClient } = useContext(AuthContext);
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [radiologistId, setRadiologistId] = useState("");
  const { isLoggedIn, isLoadingAuth, user } = useContext(AuthContext);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isLoggedIn) return;
    setRadiologistId(user?.id || "");
  }, [isLoadingAuth, isLoggedIn, user]);

  // Build menu items
  const items = useMemo(() => {
    return [
      {
        title: "Dashboard",
        url: `/radiologist`,
        icon: LayoutGrid,
      },
      {
        title: "Studies",
        url: `/radiologist/studies`,
        icon: MonitorSmartphone,
      },
      {
        title: "Workspace",
        url: `/radiologist/workspace`,
        icon: FolderKanban,
      },
    ];
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await apiClient.delete(`/auth/delete_token`, { withCredentials: true });
      setUser(null); setAccessToken("");
      router.push("/");
    } catch (e) {
      toast.error("Logout failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden fixed top-4 left-4 z-50 bg-white shadow-md border"
        onClick={() => setIsMobileMenuOpen((p) => !p)}
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-opacity-80 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <Sidebar className="hidden md:flex w-56 lg:w-64 bg-white shadow-sm min-h-screen border-r border-gray-200">
        <SidebarHeader className="p-4 md:p-6 border-b border-gray-100">
          <span className="h-15 w-15 mx-auto"><Image src={Logo} alt=""/></span>
          <p className="text-sm text-gray-600 text-center mt-1">Radiologist Dashboard</p>
          <p className="text-xs text-gray-500 text-center mt-1">ID: {radiologistId}</p>
        </SidebarHeader>

        <SidebarContent className="p-4">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-5">
                {items.map((item) => {
                  // Check if the current path starts with the menu item URL
                  const isActive = pathname === item.url || 
                                   (pathname.startsWith(item.url) && item.url !== '/radiologist') || 
                                   (pathname === '/radiologist' && item.url === '/radiologist');
                  
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
                          <item.icon className={`w-5 h-5 ${isActive ? "text-emerald-600" : "text-gray-500"}`} />
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
          {user && (
            <Button
              className="cursor-pointer w-full bg-emerald-600 text-white hover:bg-emerald-500 flex items-center justify-center gap-2 py-2.5"
              onClick={handleLogout}
              disabled={isLoading}
            >
              <LogOut className="w-4 h-4" /> {isLoading ? "Logging out..." : "Logout"}
            </Button>
          )}
        </SidebarFooter>
      </Sidebar>

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed left-0 top-0 z-40 w-72 bg-white shadow-lg min-h-screen border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-gray-100 text-center">
          <span className="h-10 w-10 mx-auto"><Image src={Logo} alt="" className="h-10 w-10 mx-auto"/></span>
          <p className="text-xs text-gray-600 mt-1">Radiologist Dashboard</p>
          <p className="text-xs text-gray-500">ID: {radiologistId}</p>
        </div>

        <div className="flex-1 p-3 overflow-y-auto space-y-1">
          {items.map((item) => {
            // Check if the current path starts with the menu item URL for mobile sidebar too
            const isActive = pathname === item.url || 
                           (pathname.startsWith(item.url) && item.url !== '/radiologist') || 
                           (pathname === '/radiologist' && item.url === '/radiologist');
            return (
              <a
                key={item.title}
                href={item.url}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-emerald-500"}`} />
                <span className="font-medium text-sm truncate">{item.title}</span>
              </a>
            );
          })}
        </div>

        <div className="p-3 border-t border-gray-100">
          {user && (
            <Button
              className="cursor-pointer w-full bg-emerald-600 text-white hover:bg-emerald-500 flex items-center justify-center gap-2 py-2 text-sm"
              onClick={handleLogout}
              disabled={isLoading}
            >
              <LogOut className="w-3 h-3" /> {isLoading ? "Logging out..." : "Logout"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default RadiologistSidebar;