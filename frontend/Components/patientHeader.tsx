"use client";

import { Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AuthContext } from "@/context/auth-context";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

interface Patient{
  patient_id: string,
  name: string,
  profile_picture: string
}

const PatientHeader = () => {
  const {isLoggedIn, isLoadingAuth, user} = useContext(AuthContext);
  const [patient, setPatient] = useState<Patient>();
  const [loadingPatient, setLoadingPatient] = useState(false);
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const fetchPatient = async () => {
    setLoadingPatient(true);
    try{
      const response = await axios.get(
        `${backendURL}/patients/${user.id}`
      );
      if(response.status == 500){
        throw new Error("Error fetching patient");
      }
      setPatient({patient_id: response.data.patient_id, name: response.data.name, profile_picture: response.data.profile_picture});
      response.data = null;
    }
    catch(err: any){
      toast.error(err.message);
    }
    finally{
      setLoadingPatient(false);
    }
  }

  useEffect(()=>{
    if(isLoadingAuth) return;
    if(!isLoggedIn) return;
    if(user){
      fetchPatient();
    }
  },[isLoadingAuth]);
  
  return (
    <header className="flex items-center justify-end px-6 py-4 bg-white shadow-sm">
      

      {/* Right: Notification + Profile */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-700" />
            
          </Button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={patient?.profile_picture} alt="Emily Johnson" />
            <AvatarFallback className="text-xs font-semibold">PR</AvatarFallback>
          </Avatar>
          <div className="text-right leading-tight">
            <p className="text-sm font-medium text-gray-900">{patient?.name}</p>
           
          </div>
        </div>
      </div>
    </header>
  );
};

export default PatientHeader;
