'use client';

import { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, Users, UserCheck, UserX, Activity } from 'lucide-react';
import { AuthContext } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { set } from 'date-fns';
import { toast } from 'sonner';


interface Patient {
  patient_id: string;
  name: string;
  email: string;
  phone_number: string;
  profile_picture?: string;
}

interface Dentist {
  dentist_id: string;
  name: string;
  email: string;
  service_types: string;
}

interface Appointment {
  appointment_id: number;
  patient_id: string;
  dentist_id: string;
  date: string;
  time_from: string;
  time_to: string;
  fee: number;
  note?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'checkedin';
  payment_status: 'paid' | 'not-paid';
  patient?: Patient;
  dentist?: Dentist;
}

export default function ReceptionistDashboard() {
  const { user, isLoadingAuth, isLoggedIn } = useContext(AuthContext);
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [todaysAppointments, setTodaysAppointments] = useState(0);
  const [pendingAppointments, setPendingAppointments] = useState(0);
  const [todaysCheckedIn, setTodaysCheckedIn] = useState(0);
  const [todaysNotCheckedIn, setTodaysNotCheckedIn] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);

  const fetchAllCounts = async () => {
    setLoading(true);
    try {
      const todayCount = await axios.get(
        `${backendURL}/appointments/count/today`
      );
      if (todayCount.status == 500) {
        throw new Error("Error Counting Todays Appointments");
      }
      setTodaysAppointments(todayCount.data);

      const pendingCount = await axios.get(
        `${backendURL}/appointments/pending-count`
      );
      if (pendingCount.status == 500) {
        throw new Error("Error Counting Pending Appointments");
      }
      setPendingAppointments(pendingCount.data);

      const todaysCheckedInCount = await axios.get(
        `${backendURL}/appointments/count/today-checked-in`
      );
      if (todaysCheckedInCount.status == 500) {
        throw new Error("Error Counting Todays Checked In Appointments");
      }
      setTodaysCheckedIn(todaysCheckedInCount.data);

      const todaysNotCheckedInCount = await axios.get(
        `${backendURL}/appointments/count/today-not-checked-in`
      );
      if (todaysNotCheckedInCount.status == 500) {
        throw new Error("Error Counting Todays Not Checked In Appointments");
      }
      setTodaysNotCheckedIn(todaysNotCheckedInCount.data);
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setLoading(false);
    }
  };

  const fetchUpcomingAppointments = async () => {
    try {
      const response = await axios.get(`${backendURL}/appointments/today`);
      if (response.status === 200) {
        const now = new Date();
  
        const filtered = response.data
          .filter((appointment: Appointment) => {
            // Filter out if no patient or dentist
            if (!appointment.patient || !appointment.dentist) return false;
  
            const formattedDate = appointment.date.split("T")[0];
            const appointmentTime = new Date(`${formattedDate}T${appointment.time_from}`);
  
            return appointmentTime >= now &&
              appointment.status !== 'cancelled' &&
              appointment.status !== 'pending';
          })
          .sort((a: Appointment, b: Appointment) => {
            const formattedDate1 = a.date.split("T")[0];
            const timeA = new Date(`${formattedDate1}T${a.time_from}`).getTime();
  
            const formattedDate2 = b.date.split("T")[0];
            const timeB = new Date(`${formattedDate2}T${b.time_from}`).getTime();
  
            return timeA - timeB;
          })
          .slice(0, 10);
  
        setUpcomingAppointments(filtered);
      } else {
        throw new Error("Error getting today's appointments");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };
  
  const handleCheckIn = async (appointment_id: number) => {
    setCheckingIn(true);
    try{
      const response = await axios.put(
        `${backendURL}/appointments/${appointment_id}`,
        {
          status: "checkedin"
        }
      );
      if(response.status != 202){
        throw new Error("Error Changing Status");
      }
      toast.success("Patient Checked In");
    
    }
    catch(err: any){
      toast.error(err.message);
    }
    finally{
      setCheckingIn(false)
    }
  }
  
  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isLoggedIn) {
      toast.error("You are not logged in");
      router.push("/");
    } else if (user.role !== "receptionist") {
     toast.error("Access Denied");
      router.push("/");
    } else {
      fetchAllCounts();
      fetchUpcomingAppointments();
  
      const interval = setInterval(() => {
        fetchUpcomingAppointments();
      }, 60 * 60 * 1000); // every 1 hour
  
      return () => clearInterval(interval); // cleanup
    }
  }, [isLoadingAuth]);  

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="mb-8 md:hidden">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome to your Receptionist Dashboard</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Today's Appointments
              </CardTitle>
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">
                {todaysAppointments}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Scheduled for today
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Appointments
              </CardTitle>
              <Clock className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">
                {pendingAppointments}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Awaiting confirmation
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Today's Checked In Patients
              </CardTitle>
              <UserCheck className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">
                {todaysCheckedIn}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Currently checked in
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Today's Not-Checked In Patients
              </CardTitle>
              <UserX className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">
                {todaysNotCheckedIn}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Yet to check in
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming appointments for today.</p>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.appointment_id}
                    className="flex items-center justify-between bg-gray-50 border border-gray-200 p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-800">
                          {appointment.patient?.name || 'Unknown Patient'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {appointment.time_from}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="capitalize">
                        {appointment.status}
                      </Badge>
                      {appointment.status === 'pending' || appointment.status === 'confirmed' ? (
                        <button
                          onClick={() => handleCheckIn(appointment.appointment_id)}
                          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Check In
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Already {appointment.status}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}