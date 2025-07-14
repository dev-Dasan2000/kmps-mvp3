"use client"

import { RoomAssignmentInterface } from '@/components/room-assignment'
import React, { useContext, useEffect } from 'react'
import { AuthContext } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner';

const page = () => {
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
    <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
        <RoomAssignmentInterface/>
    </div>
    </div>
  )
}

export default page