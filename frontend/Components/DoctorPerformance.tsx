import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Mail, 
  Phone, 
  Clock, 
  Calendar, 
  DollarSign, 
  Globe, 
  Briefcase,
  Timer,
  Stethoscope,
  Monitor,
  MapPin,
  TrendingUp,
  Users,
  BarChart3,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,

} from "lucide-react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Extended User interface
interface User {
  name: string;
  email: string;
  phone_number?: string;
  id: string;
  profile_picture?: string;
  language?: string;
  service_types?: string;
  work_days_from?: string;
  work_days_to?: string;
  work_time_from?: string;
  work_time_to?: string;
  appointment_duration?: string;
  appointment_fee?: number;
  role: 'Dentist' | 'Receptionist' | 'Radiologist';
  created_at?: string;
  updated_at?: string;
  status?: string;
  department?: string;
  experience?: string;
  specialization?: string;
  bio?: string;
}

// API response interfaces
interface AppointmentCounts {
  total: number;
  completed: number;
  confirmed: number;
  pending: number;
  canceled: number;
}

interface EarningsData {
  totalEarningsAllTime: number;
  totalEarningsThisYear: number;
  earningsThisMonth: number;
  earningsLastMonth: number;
}

interface Props {
  user: User | null;
  onClose: () => void;
}

export default function DoctorPerformanceDashboard({ user, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'profile'>('overview');
  const [appointmentCounts, setAppointmentCounts] = useState<AppointmentCounts | null>(null);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<any[]>([]);
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<'overall' | 'day' | 'week' | 'month'>('overall');
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Fetch all appointments for filtering
  const fetchAllAppointments = async () => {
    if (!user) return;
    
    try {
      // Try to fetch all appointments first
      const response = await fetch(`${backendURL}/appointments`);
      if (!response.ok) throw new Error('Failed to fetch appointments');
      const allAppointments = await response.json();
      
      // Filter appointments by dentist ID
      const dentistAppointments = allAppointments.filter(
        (appt: any) => appt.dentist_id === user.id || appt.dentistId === user.id
      );
      
      setAllAppointments(dentistAppointments);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      // Set empty arrays if there's an error
      setAllAppointments([]);
      setFilteredAppointments([]);
    }
  };

  // Filter appointments based on time period
  const filterAppointmentsByPeriod = (period: 'overall' | 'day' | 'week' | 'month') => {
    if (!allAppointments || allAppointments.length === 0) {
      setAppointmentCounts({
        total: 0,
        completed: 0,
        confirmed: 0,
        pending: 0,
        canceled: 0
      });
      return;
    }
    
    let filtered = [...allAppointments];
    
    if (period !== 'overall') {
      const now = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = allAppointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate >= startDate && appointmentDate <= now;
      });
    }
    
    setFilteredAppointments(filtered);
    updateAppointmentCounts(filtered);
  };
  
  // Update appointment counts based on filtered appointments
  const updateAppointmentCounts = (appointments: any[]) => {
    const counts = {
      total: appointments.length,
      completed: appointments.filter(a => a.status === 'completed').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      pending: appointments.filter(a => a.status === 'pending').length,
      canceled: appointments.filter(a => a.status === 'canceled').length
    };
    
    setAppointmentCounts(counts);
  };

  // Handle time period change
  const handleTimePeriodChange = (period: 'overall' | 'day' | 'week' | 'month') => {
    setTimePeriod(period);
    filterAppointmentsByPeriod(period);
  };

  // Initialize component
  useEffect(() => {
    if (user && user.role === 'Dentist') {
      const loadData = async () => {
        await fetchDentistData();
        await fetchAllAppointments();
      };
      loadData();
    }
  }, [user]);
  
  // Apply filter whenever appointments or time period changes
  useEffect(() => {
    if (allAppointments.length > 0) {
      filterAppointmentsByPeriod(timePeriod);
    }
  }, [allAppointments, timePeriod]);

  const fetchDentistData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch earnings data (we'll handle appointment counts client-side)
      const earningsResponse = await fetch(`${backendURL}/dentists/earnings/${user.id}`);
      if (!earningsResponse.ok) {
        throw new Error('Failed to fetch earnings data');
      }
      const earningsData = await earningsResponse.json();
      setEarningsData(earningsData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching dentist data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const isDentist = user.role === 'Dentist';
  const isRadiologist = user.role === 'Radiologist';
  
  const userInitials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  // Chart configurations
  const appointmentStatusChart = {
    labels: ['Completed', 'Confirmed', 'Pending', 'Canceled'],
    datasets: [
      {
        data: [
          appointmentCounts?.completed || 0,
          appointmentCounts?.confirmed || 0,
          appointmentCounts?.pending || 0,
          appointmentCounts?.canceled || 0
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',  // Green for completed
          'rgba(59, 130, 246, 0.8)',  // Blue for confirmed
          'rgba(245, 158, 11, 0.8)',  // Yellow for pending
          'rgba(239, 68, 68, 0.8)',   // Red for canceled
        ],
        borderWidth: 2,
        borderColor: '#fff',
      }
    ]
  };

  const monthlyEarningsChart = {
    labels: ['Last Month', 'This Month',],
    datasets: [
      {
        label: 'Earnings ($)',
        data: [
          earningsData?.earningsLastMonth || 0,
          earningsData?.earningsThisMonth || 0,
         
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.6)',
          'rgba(59, 130, 246, 0.6)',
        
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(59, 130, 246)',
        
        ],
        borderWidth: 2,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context: any) {
            if (context.dataset.label === 'Earnings ($)') {
              return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
            }
            return `${context.label}: ${context.parsed}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 11
          },
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: 11
          }
        }
      }
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        }
      }
    },
  };

  const MetricCard = ({ icon, title, value, subtitle, color }: {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
  }) => (
    <Card className="border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${color} mb-1`}>{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          <div className={`${color} opacity-60 flex-shrink-0 ml-3`}>
            {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6 sm:w-8 sm:h-8" })}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderOverview = () => (
    <div className="space-y-6 lg:space-y-8">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-2 text-gray-600">Loading data...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
            <MetricCard
              icon={<Users className="w-8 h-8" />}
              title="Total Appointments"
              value={appointmentCounts?.total || 0}
              subtitle="All time"
              color="text-blue-600"
            />
            <MetricCard
              icon={<CheckCircle className="w-8 h-8" />}
              title="Completed"
              value={appointmentCounts?.completed || 0}
              subtitle="Appointments"
              color="text-green-600"
            />
            <MetricCard
              icon={<Clock className="w-8 h-8" />}
              title="Confirmed"
              value={appointmentCounts?.confirmed || 0}
              subtitle="Appointments"
              color="text-yellow-600"
            />
            <MetricCard
              icon={<XCircle className="w-8 h-8" />}
              title="Canceled"
              value={appointmentCounts?.canceled || 0}
              subtitle="Appointments"
              color="text-red-600"
            />
          </div>

          {/* Earnings Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
            <MetricCard
              icon={<DollarSign className="w-8 h-8" />}
              title="This Month"
              value={`$${earningsData?.earningsThisMonth?.toLocaleString() || 0}`}
              subtitle="Earnings"
              color="text-blue-600"
            />
            <MetricCard
              icon={<DollarSign className="w-8 h-8" />}
              title="Last Month"
              value={`$${earningsData?.earningsLastMonth?.toLocaleString() || 0}`}
              subtitle="Earnings"
              color="text-green-600"
            />
            <MetricCard
              icon={<DollarSign className="w-8 h-8" />}
              title="This Year"
              value={`$${earningsData?.totalEarningsThisYear?.toLocaleString() || 0}`}
              subtitle="Total earnings"
              color="text-purple-600"
            />
            <MetricCard
              icon={<DollarSign className="w-8 h-8" />}
              title="All Time"
              value={`$${earningsData?.totalEarningsAllTime?.toLocaleString() || 0}`}
              subtitle="Total earnings"
              color="text-indigo-600"
            />
          </div>
        </>
      )}
    </div>
  );

  const renderCharts = () => (
    <div className="space-y-6 lg:space-y-8">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading charts...</span>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Appointment Status and Earnings */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            <Card className="border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="text-lg lg:text-xl font-semibold">Appointment Status Distribution</CardTitle>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleTimePeriodChange('day')}
                      className={`px-2 py-1 text-xs rounded-md ${timePeriod === 'day' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      Day
                    </button>
                    <button
                      onClick={() => handleTimePeriodChange('week')}
                      className={`px-2 py-1 text-xs rounded-md ${timePeriod === 'week' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => handleTimePeriodChange('month')}
                      className={`px-2 py-1 text-xs rounded-md ${timePeriod === 'month' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      Month
                    </button>
                    <button
                      onClick={() => handleTimePeriodChange('overall')}
                      className={`px-2 py-1 text-xs rounded-md ${timePeriod === 'overall' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      Overall
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 sm:h-72 lg:h-80">
                  <Doughnut data={appointmentStatusChart} options={doughnutOptions} />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg lg:text-xl font-semibold">Earnings Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 sm:h-72 lg:h-80">
                  <Bar data={monthlyEarningsChart} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Appointment Breakdown */}
          <Card className="border border-gray-200 hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg lg:text-xl font-semibold">Appointment Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{appointmentCounts?.completed || 0}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{appointmentCounts?.confirmed || 0}</div>
                  <div className="text-sm text-gray-600">Confirmed</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-600">{appointmentCounts?.confirmed || 0}</div>
                  <div className="text-sm text-gray-600">Confirmed</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">{appointmentCounts?.canceled || 0}</div>
                  <div className="text-sm text-gray-600">Canceled</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6 lg:space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border border-gray-200 mx-auto sm:mx-0">
          <AvatarImage 
            src={user.profile_picture} 
            alt={user.name}
            className="object-cover"
          />
          <AvatarFallback className="text-xl font-semibold bg-gray-100 text-gray-600">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-2">{user.name}</h3>
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
                <Badge className="bg-blue-100 text-blue-800 border-0 font-medium px-3 py-1">
                  <div className="flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4" />
                    {user.role}
                  </div>
                </Badge>
                {user.status && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.status.toLowerCase() === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">ID: {user.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <Card className="border border-gray-200 hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-6 lg:p-8">
          <h4 className="font-semibold text-gray-900 mb-6 text-lg lg:text-xl">Contact Information</h4>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-1">Email</p>
                <p className="text-sm lg:text-base text-gray-600 break-words">{user.email}</p>
              </div>
            </div>
            {user.phone_number && (
              <div className="flex items-start gap-4">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-1">Phone</p>
                  <p className="text-sm lg:text-base text-gray-600">{user.phone_number}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card className="border border-gray-200 hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-6 lg:p-8">
          <h4 className="font-semibold text-gray-900 mb-6 text-lg lg:text-xl">Professional Details</h4>
          <div className="space-y-6">
            {user.specialization && (
              <div className="flex items-start gap-4">
                <Briefcase className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-1">Specialization</p>
                  <p className="text-sm lg:text-base text-gray-600">{user.specialization}</p>
                </div>
              </div>
            )}
            {user.appointment_fee && (
              <div className="flex items-start gap-4">
                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-1">Consultation Fee</p>
                  <p className="text-sm lg:text-base text-gray-600">${user.appointment_fee}</p>
                </div>
              </div>
            )}
            {user.work_days_from && user.work_days_to && (
              <div className="flex items-start gap-4">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-1">Working Days</p>
                  <p className="text-sm lg:text-base text-gray-600">{user.work_days_from} - {user.work_days_to}</p>
                </div>
              </div>
            )}
            {user.work_time_from && user.work_time_to && (
              <div className="flex items-start gap-4">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-1">Working Hours</p>
                  <p className="text-sm lg:text-base text-gray-600">{user.work_time_from} - {user.work_time_to}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-7xl xl:max-w-[1400px] max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="border-b border-gray-100 p-6 lg:p-8">
          <DialogTitle className="text-xl lg:text-2xl font-semibold text-gray-900">
            {isDentist ? 'Doctor Performance Dashboard' : 'Staff Profile'}
          </DialogTitle>
        </DialogHeader>

        {isDentist && (
          <div className="flex flex-wrap gap-2 px-6 lg:px-8 pt-4">
            <Button
             // variant={activeTab === 'overview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 text-sm ${
    activeTab === 'overview' ? 'bg-emerald-500 text-white hover:bg-emerald-600' :'bg-white text-black border border-emerald-500 hover:bg-emerald-100'
  }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </Button>
            <Button
              //variant={activeTab === 'charts' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('charts')}
              className={`flex items-center gap-2 text-sm ${
    activeTab === 'charts' ? 'bg-emerald-500 text-white hover:bg-emerald-600' :'bg-white text-black border border-emerald-500 hover:bg-emerald-100'
  }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Charts</span>
            </Button>
            
            <Button
             // variant={activeTab === 'profile' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('profile')}
             className={`flex items-center gap-2 text-sm ${
    activeTab === 'profile' ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-white text-black border border-emerald-500 hover:bg-emerald-100' 
  }`}
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </Button>
          </div>
        )}

        <div className="p-6 lg:p-8">
          {isDentist ? (
            activeTab === 'overview' ? renderOverview() :
            activeTab === 'charts' ? renderCharts() :
            renderProfile()
          ) : (
            renderProfile()
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}