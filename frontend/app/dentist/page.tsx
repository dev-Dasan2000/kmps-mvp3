"use client";
import React, { useState, useEffect, useContext } from 'react';
import { Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, Plus, ChevronLeft, ChevronRight, Eye, Check, X } from 'lucide-react';
import { CancelAppointmentDialog } from '@/components/cancel-appointment-dialog';
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
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [status, setStatus] = useState("");
  const [appointment_id, setAppointment_id] = useState(0);
  const [isShowingSelectedDate, setIsShowingSelectedDate] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchAppointmentsForDate = async (date: Date) => {
    try {
      // First, fetch all appointments for the dentist
      const response = await axios.get(
        `${backendURL}/appointments/fordentist/${user.id}`
      );
      
      if (response.status === 200) {
        // Format the target date to YYYY-MM-DD for comparison
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        const targetDateStr = targetDate.toISOString().split('T')[0];
        
        console.log('Fetching appointments for date:', targetDateStr);
        
        // Filter appointments by the selected date on the frontend
        const filteredAppointments = response.data.filter((appointment: Appointment) => {
          if (!appointment.date || !appointment.patient) return false;
          
          // Parse appointment date and normalize to start of day for comparison
          const appointmentDate = new Date(appointment.date);
          appointmentDate.setHours(0, 0, 0, 0);
          const appointmentDateStr = appointmentDate.toISOString().split('T')[0];
          
          const isMatch = appointmentDateStr === targetDateStr;
          if (isMatch) {
            console.log('Matching appointment:', {
              id: appointment.appointment_id,
              date: appointment.date,
              status: appointment.status,
              patient: appointment.patient?.name
            });
          }
          
          return isMatch;
        });
        
        console.log(`Found ${filteredAppointments.length} appointments for ${targetDateStr}`);
        return filteredAppointments;
      }
      return [];
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to fetch appointments');
      return [];
    }
  };

  const fetchTodaysAppointments = async () => {
    setLoadingTodaysAppointments(true);
    try {
      const today = new Date();
      const appointments = await fetchAppointmentsForDate(today);
      setTodaysAppointments(appointments);
      setIsShowingSelectedDate(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingTodaysAppointments(false);
    }
  };

  const fetchUpcomingAppointments = async () => {
    setLoadingUpcomingAppointments(true);
    try {
      // First, fetch all future appointments for the dentist
      const response = await axios.get(
        `${backendURL}/appointments/fordentist/${user.id}`
      );
      
      if (response.status === 200) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        // Filter for future appointments (excluding today) with valid patients
        const upcoming = response.data.filter((appointment: Appointment) => {
          if (!appointment.date || !appointment.patient) return false;
          
          // Parse appointment date and normalize to start of day
          const appointmentDate = new Date(appointment.date);
          appointmentDate.setHours(0, 0, 0, 0);
          
          // Only include future dates (not today)
          const isFuture = appointmentDate > now;
          
          if (isFuture) {
            console.log('Future appointment:', {
              id: appointment.appointment_id,
              date: appointment.date,
              status: appointment.status,
              patient: appointment.patient?.name
            });
          }
          
          return isFuture;
        });
        
        // Sort by date and time in ascending order (earliest first)
        upcoming.sort((a: Appointment, b: Appointment) => {
          // Create full datetime strings for accurate comparison
          const dateTimeA = new Date(`${a.date}T${a.time_from}`).getTime();
          const dateTimeB = new Date(`${b.date}T${b.time_from}`).getTime();
          
          // For same date, sort by time
          if (a.date === b.date) {
            return dateTimeA - dateTimeB;
          }
          
          // Sort by date
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateA - dateB;
        });
        
        console.log(`Found ${upcoming.length} future appointments`);
        setUpcomingAppointments(upcoming);
      } else {
        throw new Error('Failed to fetch upcoming appointments');
      }
    } catch (err: any) {
      console.error('Error fetching upcoming appointments:', err);
      toast.error(err.message || 'Failed to fetch upcoming appointments');
    } finally {
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

  const isDateSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

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
  const handleStatusChange = async (appointmentId: number, newStatus: string, note: string = '') => {
    try {
      setStatus(newStatus);
      setAppointment_id(appointmentId);
      
      // Update local state optimistically
      setTodaysAppointments(prevAppointments =>
        prevAppointments.map(appointment =>
          appointment.appointment_id === appointmentId
            ? { ...appointment, status: newStatus }
            : appointment
        )
      );

      // Also update in selected date appointments if showing
      if (isShowingSelectedDate) {
        setSelectedDateAppointments(prevAppointments =>
          prevAppointments.map(appointment =>
            appointment.appointment_id === appointmentId
              ? { ...appointment, status: newStatus }
              : appointment
          )
        );
      }

      // If cancelling, send the note to the server
      if (newStatus === 'cancelled') {
        await axios.put(
          `${backendURL}/appointments/${appointmentId}`,
          {
            status: newStatus,
            note: note
          },
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Failed to update appointment status');
      // Revert local state on error
      setTodaysAppointments(prevAppointments =>
        prevAppointments.map(appointment =>
          appointment.appointment_id === appointmentId
            ? { ...appointment, status: appointment.status } // Revert to previous status
            : appointment
        )
      );
    }
  };

  const handleDateClick = async (day: number) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(selected);
    
    // Check if it's today
    const today = new Date();
    if (
      selected.getDate() === today.getDate() &&
      selected.getMonth() === today.getMonth() &&
      selected.getFullYear() === today.getFullYear()
    ) {
      setIsShowingSelectedDate(false);
      fetchTodaysAppointments();
      return;
    }

    setIsShowingSelectedDate(true);
    setLoadingTodaysAppointments(true);
    try {
      const appointments = await fetchAppointmentsForDate(selected);
      setSelectedDateAppointments(appointments);
    } catch (error) {
      console.error('Error fetching appointments for selected date:', error);
      toast.error('Failed to fetch appointments for selected date');
    } finally {
      setLoadingTodaysAppointments(false);
    }
  };

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async (note: string) => {
    if (selectedAppointment) {
      try {
        await axios.put(
          `${backendURL}/appointments/${selectedAppointment.appointment_id}`,
          {
            status: 'cancelled',
            cancel_note: note
          },
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Update local state
        setTodaysAppointments(prevAppointments =>
          prevAppointments.map(appointment =>
            appointment.appointment_id === selectedAppointment.appointment_id
              ? { ...appointment, status: 'cancelled', note: note }
              : appointment
          )
        );
        
        toast.success('Appointment cancelled successfully');
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        toast.error('Failed to cancel appointment');
      } finally {
        setCancelDialogOpen(false);
        setSelectedAppointment(null);
      }
    }
  };

  const todaysAppointmentsCount = todaysAppointments.filter(apt => apt.status !== 'cancelled').length;
  const todaysCheckIns = todaysAppointments.filter(apt => apt.status === 'checkedin').length;
  const selectedDateCheckIns = selectedDateAppointments.filter(apt => apt.status === 'checkedin').length;
  const totalCheckIns = isShowingSelectedDate ? selectedDateCheckIns : todaysCheckIns;
  const completedAppointments = todaysAppointments.filter(apt => apt.status === 'complete').length;

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
              <p className="text-purple-100 text-sm">
                {isShowingSelectedDate 
                  ? `Appointments on ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : "Today's Appointments"}
              </p>
              <p className="text-2xl md:text-3xl font-bold">
                {isShowingSelectedDate 
                  ? selectedDateAppointments.filter(apt => apt.status.toLowerCase() !== 'cancelled').length 
                  : todaysAppointmentsCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 md:p-6 text-white sm:col-span-2 lg:col-span-1">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 mr-3" />
            <div>
              <p className="text-green-100 text-sm">
                {isShowingSelectedDate 
                  ? `Check-ins on ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  : "Today's Check-ins"}
              </p>
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
            {isShowingSelectedDate && selectedDateAppointments.length === 0 && !loadingTodaysAppointments && (
              <div className="text-center py-8 text-gray-500">
                No appointments scheduled for this date
              </div>
            )}
            {(isShowingSelectedDate ? selectedDateAppointments : todaysAppointments).map((appointment) => (
              <div key={appointment.appointment_id} className="flex items-center p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-blue-100 flex-shrink-0 mr-3 md:mr-4">
                  {appointment.patient?.profile_picture ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${appointment.patient.profile_picture}`}
                      alt={appointment.patient?.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) {
                          fallback.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-100 text-blue-700 font-medium text-sm">
                    {appointment.patient?.name 
                      ? appointment.patient.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                      : '?'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-900 truncate">{appointment.patient?.name || "deleted patient"}</h3>
                      {!['completed', 'cancelled'].includes(appointment.status) && (
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(appointment.appointment_id, 'completed');
                            }}
                            className="p-1.5 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                            title="Mark as Completed"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelClick(appointment);
                            }}
                            className="p-1.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                            title="Cancel appointment"
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
                                ? 'bg-emerald-100 text-emerald-800' 
                                : isDateSelected(day as number)
                                ? 'bg-blue-100 text-blue-800 font-medium'
                                : 'text-gray-700'
                            }
                          `}
                        onClick={() => handleDateClick(day as number)}
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
                <h2 className="text-lg font-semibold text-gray-900">Future Appointments</h2>
                
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-4 md:pb-6">
              <div className="space-y-3">
                {upcomingAppointments.map((appointment, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-blue-100 flex-shrink-0 mr-3">
                      {appointment.patient?.profile_picture ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${appointment.patient.profile_picture}`}
                          alt={appointment.patient?.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) {
                              fallback.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-100 text-blue-700 font-medium text-xs">
                        {appointment.patient?.name 
                          ? appointment.patient.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                          : '?'}
                      </div>
                    </div>
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
      
      {/* Cancel Appointment Dialog */}
      <CancelAppointmentDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onCancel={handleConfirmCancel}
        selectedCount={selectedAppointment ? 1 : 0}
      />
    </div>
  );
};

export default DentalDashboard;