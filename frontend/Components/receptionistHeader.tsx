"use client";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useContext } from "react";

import { AuthContext } from "@/context/auth-context";
import axios from "axios";
import { toast } from "sonner";

interface ReceptionistInfo {
  receptionist_id: string;
  name: string;
  profile_picture?: string;
}

const ReceptionistHeader = () => {
  const router = useRouter();
  const [receptionistInfo, setReceptionistInfo] = useState<ReceptionistInfo | null>(null);
  const {user, isLoadingAuth, isLoggedIn} = useContext(AuthContext);
  const [loadingReceptionist, setLoadingReceptionist] = useState(false);
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Get current date
  const getCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  // Generate doctor initials from name
  const getReceptionistInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const fetchReceptionistInfo = async () => {
    setLoadingReceptionist(true);
    try{
      const response = await axios.get(
        `${backendURL}/receptionists/${user.id}`
      );
      if(response.status == 500){
        throw new Error("Error fetching receptionist Data");
      }
      setReceptionistInfo({receptionist_id: response.data.receptionist_id, name: response.data.name, profile_picture: response.data.profile_picture});
    }
    catch(err: any){
      toast.error(err.message);
    }
    finally{
      setLoadingReceptionist(false);
    }
  }

  useEffect(() => {
    if(isLoadingAuth) return;
    if(!isLoggedIn) return;
    fetchReceptionistInfo();
  }, [user]);

  // Handle profile navigation
  const handleProfileClick = () => {
    if (user.id) {
      router.push(`#`);
    }
  };

  // Handle notification click
  const handleNotificationClick = () => {
    if (user.id) {
      router.push(`#`);
    }
  };

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white">
      {/* Left side: Welcome message and date - hidden on mobile */}
      <div className="hidden sm:flex flex-col min-w-0 flex-1">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1 truncate">
          {loadingReceptionist ? (
            <span className="animate-pulse bg-gray-200 h-8 w-64 rounded"></span>
          ) : (
            `Welcome back !`
          )}
        </h1>
        <p className="text-sm text-gray-500">
          {getCurrentDate()}
        </p>
      </div>

      {/* Right side: Notification + Profile */}
      <div className="flex items-center gap-2 sm:gap-4 ml-auto sm:ml-4">
        {/* Notification Bell */}
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative h-8 w-8 sm:h-10 sm:w-10"
            onClick={handleNotificationClick}
          >
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
            {/* Notification dot */}
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-red-500 rounded-full"></span>
          </Button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          {loadingReceptionist ? (
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-200 rounded-full animate-pulse"></div>
          ) : (
            <Avatar 
              className="h-8 w-8 sm:h-10 sm:w-10 cursor-pointer hover:ring-2 hover:ring-emerald-300 transition-all duration-200" 
              onClick={handleProfileClick}
            >
              <AvatarImage src={receptionistInfo?.profile_picture} alt={receptionistInfo
                ?.name} />
              <AvatarFallback className="text-xs sm:text-sm font-semibold bg-emerald-100 text-emerald-800">
                {receptionistInfo ? getReceptionistInitials(receptionistInfo.name) : 'R'}
              </AvatarFallback>
            </Avatar>
          )}
          
          {/* Profile details - hidden on mobile */}
          <div className="hidden sm:flex flex-col text-right leading-tight">
            {loadingReceptionist ? (
              <div className="space-y-1">
                <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
                <div className="animate-pulse bg-gray-200 h-3 w-16 rounded"></div>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-900">
                  {receptionistInfo?.name || 'Receptionist'}
                </p>
              
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default ReceptionistHeader;