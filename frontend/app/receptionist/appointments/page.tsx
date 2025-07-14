"use client"

import AppointmentBooking from "@/components/appointment-booking"
import { AuthContext } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";
import { toast } from "sonner";

export default function Home() {

  const router = useRouter();
  const {isLoadingAuth, isLoggedIn, user} = useContext(AuthContext);
  
  useEffect(()=>{
    if(isLoadingAuth) return;
    if(!isLoggedIn){
      toast.error("Session Expired", {description:"Please Login"});
      router.push("/");
    }
    else if(user.role != "receptionist"){
      toast.error("Access Denied", {description:"You do not have access to this user role"});
      router.push("/");
    }
  },[isLoadingAuth]);

  return (
    <main>
      <AppointmentBooking />
    </main>
  )
}
