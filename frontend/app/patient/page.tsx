"use client";
import React, { useState, useEffect, useContext } from 'react';
import { Calendar, DollarSign, MessageSquare, Clock, Edit2, X, Check, User, CreditCard, NotebookPen, Currency } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '@/context/auth-context';
import { toast } from 'sonner';
import { useRouter } from "next/navigation";
import Image from 'next/image';


interface Patient {
  patient_id: string;
  name: string;
  profile_picture: string;
  email: string;
  phone_number: string;
}

interface Dentist {
  dentist_id: string;
  name: string;
  profile_picture: string;
  email: string;
  phone_number: string;
  language: string;
  service_types: string;
  work_days_from: string;
  work_days_to: string;
  work_time_from: string;
  work_time_to: string;
  appointment_duration: string;
  appointment_fee: number;
}

interface Appointment {
  appointment_id: number;
  dentist: Dentist;
  patient: Patient;
  time_from: string;
  time_to: string;
  date: string;
  note: string;
  status: string;
  fee: number;
}

interface Message {
  message_id: number;
  sender_name: string;
  content: string;
  timestamp: string;
  is_read: boolean;
}

interface PaymentSummary {
  total_due: string;
  total_paid: string;
  total: string;
}

const HealthcareDashboard: React.FC = () => {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const { user, isLoggedIn, isLoadingAuth } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState<'today' | 'upcoming'>('today');
  const [loadingTodaysAppointments, setLoadingTodaysAppointments] = useState(false);
  const [loadingUpcomingAppointments, setLoadingUpcomingAppointments] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [loadingPaymentSummary, setLoadingPaymentSummary] = useState(false);

  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    total_due: '0.00',
    total_paid: '0.00',
    total: '0.00'
  });
  const [lastVisitDate, setLastVisitDate] = useState<string>('');

  const [status, setStatus] = useState("");
  const [appointment_id, setAppointment_id] = useState("");

  const router = useRouter();

  // Fetch today's appointments
  const fetchTodaysAppointments = async () => {
    setLoadingTodaysAppointments(true);
    try {
      const response = await axios.get(
        `${backendURL}/appointments/today/forpatient/${user.id}`,
        { withCredentials: true }
      );
      if (response.status === 500) {
        throw new Error("Internal Server Error");
      }
      
      // Fetch dentist profile pictures for each appointment
      const appointmentsWithDentistPics = await Promise.all(
        response.data.map(async (appointment: any) => {
          if (appointment.dentist_id) {
            try {
              const dentistResponse = await axios.get(
                `${backendURL}/dentists/${appointment.dentist_id}`,
                { withCredentials: true }
              );
              if (dentistResponse.data) {
                return {
                  ...appointment,
                  dentist: {
                    ...appointment.dentist,
                    profile_picture: dentistResponse.data.profile_picture || ''
                  }
                };
              }
            } catch (err) {
              console.error('Error fetching dentist profile:', err);
            }
          }
          return appointment;
        })
      );
      
      setTodaysAppointments(appointmentsWithDentistPics);
    } catch (err: any) {
      console.error("Error fetching today's appointments:", err.message);
    } finally {
      setLoadingTodaysAppointments(false);
    }
  };

  // Fetch upcoming appointments
  const fetchUpcomingAppointments = async () => {
    setLoadingUpcomingAppointments(true);
    try {
      const response = await axios.get(
        `${backendURL}/appointments/forpatient/upcoming/${user.id}`,
        { withCredentials: true }
      );
      if (response.status === 500) {
        throw new Error("Internal Server Error");
      }
      
      // Fetch dentist profile pictures for each appointment
      const appointmentsWithDentistPics = await Promise.all(
        response.data.map(async (appointment: any) => {
          if (appointment.dentist_id) {
            try {
              const dentistResponse = await axios.get(
                `${backendURL}/dentists/${appointment.dentist_id}`,
                { withCredentials: true }
              );
              if (dentistResponse.data) {
                return {
                  ...appointment,
                  dentist: {
                    ...appointment.dentist,
                    profile_picture: dentistResponse.data.profile_picture || ''
                  }
                };
              }
            } catch (err) {
              console.error('Error fetching dentist profile:', err);
            }
          }
          return appointment;
        })
      );
      
      setUpcomingAppointments(appointmentsWithDentistPics);
    } catch (err: any) {
      console.error("Error fetching upcoming appointments:", err.message);
    } finally {
      setLoadingUpcomingAppointments(false);
    }
  };

  // Fetch payment summary
  const fetchPaymentSummary = async () => {
    setLoadingPaymentSummary(true);
    try {
      const response = await axios.get(
        `${backendURL}/appointments/payment-summary/${user.id}`,
        { withCredentials: true }
      );
      if (response.status === 500) {
        throw new Error("Internal Server Error");
      }
      if (response.data && response.data.success && response.data.data) {
        setPaymentSummary(response.data.data);
      }
    } catch (err: any) {
      console.error("Error fetching payment summary:", err.message);
    } finally {
      setLoadingPaymentSummary(false);
    }
  };

  // Update appointment status
  const updateStatusChange = async () => {
    setChangingStatus(true);
    try {
      const response = await axios.put(
        `${backendURL}/appointments/${appointment_id}`,
        { status: status },
        {
          withCredentials: true,
          headers: {
            "Content-type": "application/json"
          }
        }
      );
      if (response.status !== 202) {
        throw new Error("Error updating status");
      }
      // Refresh appointments after status change
      fetchTodaysAppointments();
      fetchUpcomingAppointments();
      fetchPaymentSummary(); // Refresh payment summary as well
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setChangingStatus(false);
      setAppointment_id('');
      setStatus('');
    }
  };

  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const getStatusColor = (status: string): string => {
    // Handle null, undefined, or empty status
    if (!status) {
      return 'bg-gray-100 text-gray-700';
    }
    
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleStatusChange = (appointmentId: number, newStatus: string) => {
    setStatus(newStatus);
    setAppointment_id(appointmentId.toString());
  };

  // Calculate stats
  const newMessagesCount = messages.filter(msg => !msg.is_read).length;
  const upcomingCount = upcomingAppointments.filter(appt => appt.status?.toLowerCase() !== 'cancelled').length;

  // Stats cards data
  const statsCards = [
    {
      title: 'Upcoming Appointments',
      value: upcomingCount.toString(),
      icon: Calendar,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    }
  ];

  // Payment summary cards
  const paymentCards = [
    {
      title: 'Total Due',
      value: `Rs. ${parseFloat(paymentSummary.total_due).toFixed(2)}`,
      icon: CreditCard,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600'
    },
    {
      title: 'Total Paid',
      value: `Rs. ${parseFloat(paymentSummary.total_paid).toFixed(2)}`,
      icon: DollarSign,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'Total Amount',
      value: `Rs. ${parseFloat(paymentSummary.total).toFixed(2)}`,
      icon: DollarSign,
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-600'
    }
  ];

  // Auth check effect
  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isLoggedIn) {
      toast.error("Authentication Required", {
        description: "Please log in to access patient dashboard"
      })
     router.push("/");
      return;
    }

    if (user?.role !== "patient") {
      toast.error("Access Denied", {
        description: "You are not authorized to access this page"
      })
      router.push("/");
      return;
    }
  }, [isLoadingAuth, isLoggedIn, user]);

  // Data fetching effect
  useEffect(() => {
    if (!user) return;
    fetchTodaysAppointments();
    fetchUpcomingAppointments();
    fetchPaymentSummary();
  }, [user]);

  // Status update effect
  useEffect(() => {
    if (!status || !appointment_id) return;
    updateStatusChange();
  }, [status, appointment_id]);

  // Display current appointments based on active tab
  const displayedAppointments = activeTab === 'today' ? todaysAppointments : upcomingAppointments;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Hello, {user?.name || 'Emily'}!
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Here's what's happening with your dental health today.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <p className="text-sm text-gray-500">Today's Date</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {/* Upcoming Appointments Card */}
          {statsCards.map((card, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          ))}
          
          {/* Payment Summary Cards */}
          {paymentCards.map((card, index) => (
            <div key={`payment-${index}`} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {loadingPaymentSummary ? (
                      <span className="inline-block w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      card.value
                    )}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Appointments Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('today')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'today'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Today
                {loadingTodaysAppointments && (
                  <span className="ml-2 inline-block w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'upcoming'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Upcoming
                {loadingUpcomingAppointments && (
                  <span className="ml-2 inline-block w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                )}
              </button>
            </div>
          </div>

          {/* Appointments List */}
          <div className="divide-y divide-gray-100">
            {displayedAppointments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No appointments {activeTab === 'today' ? 'today' : 'upcoming'}</p>
              </div>
            ) : (
              displayedAppointments.map((appointment) => (
                <div key={appointment.appointment_id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex flex-1 min-w-0 gap-4">
                      {/* Dentist Avatar */}
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {appointment.dentist?.profile_picture ? (
                          <Image
                            src={`${backendURL}${appointment.dentist.profile_picture}`}
                            alt={appointment.dentist?.name || 'Dentist'}
                            className="w-full h-full object-cover"
                            height={12}
                            width={12}
                            onError={(e) => {
                              // Fallback to initials if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const initialSpan = document.createElement('span');
                                initialSpan.className = 'text-sm font-medium text-gray-700';
                                initialSpan.textContent = appointment.dentist?.name ? 
                                  getInitials(appointment.dentist.name) : 
                                  '';
                                parent.appendChild(initialSpan);
                              }
                            }}
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-700">
                            {appointment.dentist?.name ? getInitials(appointment.dentist.name) : <User className="w-6 h-6" />}
                          </span>
                        )}
                      </div>

                      {/* Appointment Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              Dr. {appointment.dentist?.name || 'Dentist Name Not Available'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {appointment.dentist?.service_types || 'General Dentistry'}
                            </p>
                          </div>
                          {/* Status for mobile */}
                          <div className="sm:hidden">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                              {appointment.status || 'Unknown'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-x-4 mt-1">
                          <p className="text-sm text-gray-500 whitespace-nowrap flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-teal-700" />
                            {appointment.date ? new Date(appointment.date).toLocaleDateString() : 'Date TBD'}
                          </p>
                          <p className="text-sm text-gray-500 whitespace-nowrap flex items-center gap-1">
                            <Clock className="h-4 w-4 text-blue-700" />
                            {appointment.time_from || 'TBD'} {appointment.time_to ? `- ${appointment.time_to}` : ''}
                          </p>
                          {appointment.fee && (
                            <p className="text-sm text-gray-500 whitespace-nowrap flex items-center gap-1">
                              
                              Rs. {appointment.fee}
                            </p>
                          )}
                        </div>
                        {appointment.note && (
                          <p className="text-sm text-gray-500 whitespace-nowrap flex items-center gap-1">
                            <NotebookPen className="h-4 w-4 text-green-700" />
                            {appointment.note}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status and Actions - Desktop */}
                    <div className="hidden sm:flex items-start gap-2 mt-1">
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)} whitespace-nowrap`}>
                          {appointment.status || 'Unknown'}
                        </span>
                        {/* Action buttons for patient */}
                        {appointment.status && appointment.status.toLowerCase() === 'pending' && (
                          <button
                            className="p-1.5 text-red-600 hover:text-red-800 transition-colors rounded-full hover:bg-red-50"
                            onClick={() => handleStatusChange(appointment.appointment_id, 'cancelled')}
                            disabled={changingStatus}
                            title="Cancel appointment"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Action button for mobile */}
                    {appointment.status && appointment.status.toLowerCase() === 'pending' && (
                      <div className="sm:hidden flex justify-end">
                        <button
                          className="p-1.5 text-red-600 hover:text-red-800 transition-colors rounded-full hover:bg-red-50"
                          onClick={() => handleStatusChange(appointment.appointment_id, 'cancelled')}
                          disabled={changingStatus}
                          title="Cancel appointment"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthcareDashboard;