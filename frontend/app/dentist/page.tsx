"use client";
import React, { useState, useEffect, useContext } from 'react';
import { Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, Plus, ChevronLeft, ChevronRight, Eye, Check, X } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '@/context/auth-context';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';


type Dentist = {
  dentist_id: string,
  name: string,
  profile_picture: string,
  email: string,
  phone_number: string,
  service_types: string,
  work_time_from: string,
  work_time_to: string,
  appointment_duration: string,
  appointment_fee: number
};

type Appointment = {
  appointment_id: number;
  patient: {
    name: string;
    profile_picture: string;
  };
  time_from: string;
  time_to: string;
  date: string;
  note: string;
  status: string;
  fee: number;
};

const DentalDashboard = () => {

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const {user, isLoggedIn, isLoadingAuth} = useContext(AuthContext);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [loadingTodaysAppointments, setLoadingTodaysAppointments] = useState(false);
  const [loadingUpcomingAppointments, setLoadingUpcomingAppointments] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [todaysAppointments, setTodaysAppointments] = useState <Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [status, setStatus] = useState("");
  const [appointment_id, setAppointment_id] = useState(0);

  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchTodaysAppointments = async () => {
    setLoadingTodaysAppointments(true);
    try{
      const response = await axios.get(
        `${backendURL}/appointments/today/fordentist/${user.id}`
      );
      if(response.status == 500){
        throw new Error("Internal Server Error");
      }
      const validAppointments = response.data.filter(
        (appointment: Appointment) => appointment.patient !== null
      );
      setTodaysAppointments(validAppointments);
    }
    catch(err: any){
      toast.error(err.message);
    }
    finally{
      setLoadingTodaysAppointments(false);
    }
  };

  const fetchUpcomingAppointments = async () => {
    setLoadingUpcomingAppointments(true);
    try{
      const response = await axios.get(
        `${backendURL}/appointments/fordentist/upcoming/${user.id}`
      );
      if(response.status == 500){
        throw new Error("Internal Server Error");
      }
      const validAppointments = response.data.filter(
        (appointment: Appointment) => appointment.patient !== null
      );
      setUpcomingAppointments(validAppointments);
    }
    catch(err: any){
      toast.error(err.message);
    }
    finally{
      setLoadingUpcomingAppointments(false);
    }
  };

  const updateStatusChange = async() => {
    setChangingStatus(true);
    try{
      const response = await axios.put(
        `${backendURL}/appointments/${appointment_id}`,
        {
          status: status
        },{
          withCredentials: true,
          headers:{
            "Content-type":"application/json"
          }
        }
      );
      if(response.status != 202){
        throw new Error("Error updating status");
      }
    }
    catch(err: any){
      toast.error(err.message);
    }
    finally{
      setChangingStatus(false);
      setAppointment_id(0);
      setStatus('');
    }
  }

  const getDaysInMonth = (date: any) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getStatusColor = (status: any) => {
    switch (status.toLowerCase()) {
      case 'complete':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

   const getStatusIcon = (status: any) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'complete':
        return '✓';
      case 'cancelled':
        return '❌';
      default:
        return '⏳';
    }
  };

  // Handle status change
  const handleStatusChange = (appointmentId: number, newStatus: string) => {
    setStatus(newStatus);
    setAppointment_id(appointmentId);
    setTodaysAppointments(prevAppointments =>
      prevAppointments.map(appointment =>
        appointment.appointment_id === appointmentId
          ? { ...appointment, status: newStatus }
          : appointment
      )
    );
  };

  const todaysAppointmentsCount = todaysAppointments.length;
  const totalCheckIns = todaysAppointments.filter(apt => apt.status === 'checked-in').length;
  const completedAppointments = todaysAppointments.filter(apt => apt.status === 'Complete').length;

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigateMonth = (direction: any) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const days = getDaysInMonth(currentDate);

  useEffect(()=>{
    if(!user) return;
    fetchTodaysAppointments();
    fetchUpcomingAppointments();
  },[user]);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isLoggedIn) {
      toast.error("Authentication Required");
      router.push("/");
      return;
    }
  
    if (user?.role !== "dentist") {
      toast.error("Access Denied");
      router.push("/");
      return;
    }
  }, [isLoadingAuth]);

  useEffect(() => {
    if (!status || !appointment_id) return;
    updateStatusChange();
  }, [status, appointment_id]);
  
  

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">


      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
        

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 md:p-6 text-white">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 mr-3" />
            <div>
              <p className="text-purple-100 text-sm">Today's Appointments</p>
              <p className="text-2xl md:text-3xl font-bold">{todaysAppointmentsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 md:p-6 text-white sm:col-span-2 lg:col-span-1">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 mr-3" />
            <div>
              <p className="text-green-100 text-sm">Total Check-ins</p>
              <p className="text-2xl md:text-3xl font-bold">{totalCheckIns}</p>
              
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
         <div className="lg:col-span-2">
      <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
        <div className="p-4 md:p-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-0">Today's Schedule</h2>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-4 md:pb-6">
          <div className="space-y-3">
            {todaysAppointments.map((appointment) => (
              <div key={appointment.appointment_id} className="flex items-center p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <img
                  src={appointment.patient?.profile_picture || ''} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ''; }}
                  alt={appointment.patient?.name}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full mr-3 md:mr-4"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-900 truncate">{appointment.patient?.name || "deleted patient"}</h3>
                      {!['Completed', 'Cancelled'].includes(appointment.status) && (
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(appointment.appointment_id, 'Completed');
                            }}
                            className="p-1.5 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                            title="Mark as Completed"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(appointment.appointment_id, 'Cancelled');
                            }}
                            className="p-1.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                            title="Mark as Cancelled"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-700">
                        {appointment.time_from}
                      </span>
                      {appointment.status && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          <span className="ml-1">{appointment.status}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 truncate mt-1">{appointment.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  

        {/* Calendar and Upcoming */}
        <div className="space-y-6">
          {/* Calendar */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Calendar</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="text-center mb-4">
                <h3 className="font-medium text-gray-900">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                  <div key={index} className="aspect-square">
                    {day && (
                      <button
                        className={`w-full h-full flex items-center justify-center text-sm rounded hover:bg-gray-100 '
                            ${
                              day === new Date().getDate() &&
                                currentDate.getMonth() === new Date().getMonth() &&
                                currentDate.getFullYear() === new Date().getFullYear()
                                ? 'bg-emerald-100 text-emerald-800' : 'text-emrald-700'
                          
                        }
                          `}
                      >
                        {day}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              
            </div>
          </div>

          {/* Upcoming Schedule */}
          <div className="bg-white rounded-lg shadow-sm border h-80 flex flex-col">
            <div className="p-4 md:p-6 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Schedule</h2>
                
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-4 md:pb-6">
              <div className="space-y-3">
                {upcomingAppointments.map((appointment, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <img
                      src={appointment.patient?.profile_picture}
                      alt={appointment.patient?.name || "deleted patient" }
                      className="w-8 h-8 rounded-full mr-3"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm truncate">
                        {appointment.patient?.name || "deleted patient"}
                      </h3>
                      <p className="text-xs text-gray-600 truncate">{appointment.note}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm truncate">
                        {appointment.date.split('T')[0]}
                      </h3>
                      <p className="text-xs text-gray-600 truncate">From: {appointment.time_from}</p>
                      <p className="text-xs text-gray-600 truncate">To: {appointment.time_to}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DentalDashboard;