"use client";
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Calendar, Users, UserCheck, CreditCard, TrendingUp, Activity, MoreHorizontal, Router } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as Chart from 'chart.js';
import { AuthContext } from '@/context/auth-context';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';



// Register Chart.js components - including DoughnutController
Chart.Chart.register(
  Chart.CategoryScale,
  Chart.LinearScale,
  Chart.PointElement,
  Chart.LineElement,
  Chart.BarElement,
  Chart.ArcElement,
  Chart.DoughnutController,
  Chart.LineController,
  Chart.BarController,
  Chart.Title,
  Chart.Tooltip,
  Chart.Legend,
  Chart.Filler,
);

// TypeScript interfaces based on database schema
interface DashboardMetrics {
  totalDentists: number;
  totalPatients: number;
  totalReceptionists: number;
  totalAppointments: number;
  monthlyRevenue: number;
  pendingAppointments: number;
}

interface PaymentTrend {
  month: string;
  revenue: number;
  appointments: number;
}

interface AppointmentStatus {
  name: string;
  value: number;
  color: string;
}

interface ServiceType {
  service: string;
  count: number;
  revenue: number;
}

interface PaymentStatus {
  status: string;
  count: number;
  percentage: number;
}

const DentalDashboard: React.FC = () => {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const router = useRouter();

  const {accessToken, isLoggedIn, isLoadingAuth, user } = useContext(AuthContext);
  const [loadingMainCounts, setLoadingMainCounts] = useState(false);
  const [loadingAppointmentCounts, setLoadingAppointmentCounts] = useState(false);
  const [loadingPaymentTrends, setLoadingPaymentTrends] = useState(false);

  const [dashboardData, setDashboardData] = useState<DashboardMetrics>({
    totalDentists: 0,
    totalPatients: 0,
    totalReceptionists: 0,
    totalAppointments: 0,
    monthlyRevenue: 0,
    pendingAppointments: 0
  });
  // Time period state for filtering
  type TimePeriod = 'overall' | 'day' | 'week' | 'month';
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('overall');
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [appointmentStatus, setAppointmentStatus] = useState<AppointmentStatus[]>([
    { name: 'Completed', value: 0, color: '#10B981' },
    { name: 'Pending', value: 0, color: '#F59E0B' },
    { name: 'Confirmed', value: 0, color: '#3B82F6' }
  ]);

  const [paymentTrends, setPaymentTrends] = useState<PaymentTrend[]>([]);

  const fetchMainCounts = async () => {
    setLoadingMainCounts(true);
    try {
      const dentistcount = await axios.get(
        `${backendURL}/dentists/count`
      );
      const patientcount = await axios.get(
        `${backendURL}/patients/count`
      );
      const receptionistscount = await axios.get(
        `${backendURL}/receptionists/count`
      );
      const appointmentscount = await axios.get(
        `${backendURL}/appointments/count`
      );
      const monthlyincome = await axios.get(
        `${backendURL}/payment-history/income/this-month`
      );
      const pendingappointmentscount = await axios.get(
        `${backendURL}/appointments/pending-count`
      )
      if (dentistcount.status == 500 || patientcount.status == 500 || receptionistscount.status == 500 || appointmentscount.status == 500 || monthlyincome.status == 500 || pendingappointmentscount.status == 500) { throw new Error("Internal Server Error"); }
      setDashboardData({
        totalDentists: dentistcount.data,
        totalPatients: patientcount.data,
        totalReceptionists: receptionistscount.data,
        totalAppointments: appointmentscount.data,
        monthlyRevenue: monthlyincome.data.income,
        pendingAppointments: pendingappointmentscount.data
      });
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setLoadingMainCounts(false);
    }
  }

  const fetchAllAppointments = async () => {
    setLoadingAppointmentCounts(true);
    try {
      const response = await axios.get(`${backendURL}/appointments`);
      if (response.status === 200) {
        setAllAppointments(response.data);
        // Don't call filterAppointmentsByPeriod here to avoid race condition
      } else {
        throw new Error("Failed to fetch appointments");
      }
    } catch (err: any) {
      toast.error(err.message || "Error fetching appointments");
    } finally {
      setLoadingAppointmentCounts(false);
    }
  };

  const filterAppointmentsByPeriod = (period: TimePeriod) => {
    let filteredAppointments = [...allAppointments];
    
    if (period !== 'overall') {
      const now = new Date();
      let startDate = new Date();

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

      filteredAppointments = allAppointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate >= startDate && appointmentDate <= now;
      });
    }

    // Count appointments by status
    const counts = filteredAppointments.reduce((acc, appointment) => {
      acc[appointment.status] = (acc[appointment.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setAppointmentStatus([
      { name: 'Completed', value: counts['completed'] || 0, color: '#10B981' },
      { name: 'Pending', value: counts['pending'] || 0, color: '#F59E0B' },
      { name: 'Confirmed', value: counts['confirmed'] || 0, color: '#3B82F6' },
    ]);
  };

  const handleTimePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period);
    filterAppointmentsByPeriod(period);
  };

  const fetchPaymentTrends = async () => {
    setLoadingPaymentTrends(true);
    try{
      const paymenttrends = await axios.get(
        `${backendURL}/payment-history/trends`
      );
      if(paymenttrends.status == 500){
        throw new Error("internal Server Error");
      }
      setPaymentTrends(paymenttrends.data);
    }
    catch(err: any){
      toast.error(err.message);
    }
    finally{
      setLoadingPaymentTrends(false);
    }
  }

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchMainCounts(),
        fetchAllAppointments(),
        fetchPaymentTrends()
      ]);
    };
    loadData();
  }, []);

  useEffect(()=>{
    if(!isLoadingAuth){
      if(!isLoggedIn){
        toast.error("Session Error", {
          description: "Your session is expired, please login again"
        });
        router.push("/");
      }
      else if(user.role != "admin"){
        toast.error("Access Error", {
          description: "You do not have access, redirecting..."
        });
        router.push("/");
      }
    }
  },[isLoadingAuth]);

  // Refs for chart canvases
  const pieChartRef = useRef<HTMLCanvasElement>(null);
  const lineChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);

  // Chart instances
  const pieChartInstance = useRef<Chart.Chart | null>(null);
  const lineChartInstance = useRef<Chart.Chart | null>(null);
  const barChartInstance = useRef<Chart.Chart | null>(null);

  // Service type popularity
  const serviceTypes: ServiceType[] = [
    { service: 'Cleaning', count: 45, revenue: 22500 },
    { service: 'Filling', count: 38, revenue: 30400 },
    { service: 'Extraction', count: 25, revenue: 37500 },
    { service: 'Root Canal', count: 15, revenue: 45000 },
    { service: 'Crown', count: 12, revenue: 48000 }
  ];

  // Metric cards data
  const metricCards = [
    {
      title: 'Total Dentists',
      value: dashboardData.totalDentists,
      icon: Users,
      color: 'text-blue-500'
    },
    {
      title: 'Total Patients',
      value: dashboardData.totalPatients,
      icon: UserCheck,
      color: 'text-green-500'
    },
    {
      title: 'Receptionists',
      value: dashboardData.totalReceptionists,
      icon: Activity,
      color: 'text-purple-500'
    },
    {
      title: 'Total Appointments',
      value: dashboardData.totalAppointments,
      icon: Calendar,
      color: 'text-orange-500'
    },
    {
      title: 'Monthly Revenue',
      value: `$${dashboardData.monthlyRevenue.toLocaleString()}`,
      icon: CreditCard,
      color: 'text-green-600'
    },
  ];

  // Create/Update Pie Chart
  const updatePieChart = () => {
    if (pieChartRef.current) {
      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
      }

      const ctx = pieChartRef.current.getContext('2d');
      if (ctx) {
        pieChartInstance.current = new Chart.Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: appointmentStatus.map(item => item.name),
            datasets: [{
              data: appointmentStatus.map(item => item.value),
              backgroundColor: appointmentStatus.map(item => item.color),
              borderWidth: 2,
              borderColor: '#ffffff',
              hoverBorderWidth: 3
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                backgroundColor: 'white',
                titleColor: '#374151',
                bodyColor: '#374151',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                cornerRadius: 8,
                callbacks: {
                  label: function (context) {
                    return `${context.label}: ${context.parsed} appointments`;
                  }
                }
              }
            },
            animation: {
              animateRotate: true,
              duration: 1000
            }
          }
        });
      }
    }
  };

  // Create/Update Line Chart
  const updateLineChart = () => {
    if (lineChartRef.current) {
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
      }

      const ctx = lineChartRef.current.getContext('2d');
      if (ctx) {
        lineChartInstance.current = new Chart.Chart(ctx, {
          type: 'line',
          data: {
            labels: paymentTrends.map(item => item.month),
            datasets: [{
              label: 'Revenue',
              data: paymentTrends.map(item => item.revenue),
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderWidth: 3,
              pointBackgroundColor: '#3B82F6',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                backgroundColor: 'white',
                titleColor: '#374151',
                bodyColor: '#374151',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                cornerRadius: 8,
                callbacks: {
                  label: function (context) {
                    return `Revenue: $${context.parsed.y.toLocaleString()}`;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: {
                  color: '#f0f0f0',
                },
                border: {
                  display: false,
                },
                ticks: {
                  color: '#666666',
                  font: { size: 12 }
                }
              },
              y: {
                grid: {
                  color: '#f0f0f0',
                },
                border: {
                  display: false,
                },
                ticks: {
                  color: '#666666',
                  font: { size: 12 },
                  callback: function (value) {
                    return '$' + (Number(value) / 1000).toFixed(0) + 'k';
                  }
                }
              }
            },
            animation: {
              duration: 2000,
              easing: 'easeInOutQuart'
            }
          }
        });
      }
    }
  };

  // Create/Update Bar Chart
  const updateBarChart = () => {
    if (barChartRef.current) {
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }

      const ctx = barChartRef.current.getContext('2d');
      if (ctx) {
        barChartInstance.current = new Chart.Chart(ctx, {
          type: 'bar',
          data: {
            labels: serviceTypes.map(item => item.service),
            datasets: [{
              label: 'Appointments',
              data: serviceTypes.map(item => item.count),
              backgroundColor: '#8B5CF6',
              borderColor: '#7C3AED',
              borderWidth: 1,
              borderRadius: 4,
              borderSkipped: false,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                backgroundColor: 'white',
                titleColor: '#374151',
                bodyColor: '#374151',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                cornerRadius: 8,
                callbacks: {
                  afterLabel: function (context) {
                    const serviceIndex = context.dataIndex;
                    const revenue = serviceTypes[serviceIndex].revenue;
                    return `Revenue: $${revenue.toLocaleString()}`;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: {
                  color: '#f0f0f0',
                },
                border: {
                  display: false,
                },
                ticks: {
                  color: '#666666',
                  font: { size: 12 }
                }
              },
              y: {
                grid: {
                  color: '#f0f0f0',
                },
                border: {
                  display: false,
                },
                ticks: {
                  color: '#666666',
                  font: { size: 12 }
                }
              }
            },
            animation: {
              duration: 1500,
              easing: 'easeOutQuart'
            }
          }
        });
      }
    }
  };

  // Update pie chart when appointment status data changes
  useEffect(() => {
    if (!loadingAppointmentCounts) {
      updatePieChart();
    }
  }, [appointmentStatus, loadingAppointmentCounts]);

  // Update line chart when payment trends data changes
  useEffect(() => {
    if (!loadingPaymentTrends) {
      updateLineChart();
    }
  }, [paymentTrends, loadingPaymentTrends]);

  // Update charts when data changes
  useEffect(() => {
    updatePieChart();
    updateLineChart();
    updateBarChart();
  }, [appointmentStatus, paymentTrends, timePeriod]);

  // Initial chart setup
  useEffect(() => {
    // This will run once when the component mounts
    const timer = setTimeout(() => {
      if (allAppointments.length > 0) {
        filterAppointmentsByPeriod('overall');
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [allAppointments]);

  // Initialize bar chart (since serviceTypes is static)
  useEffect(() => {
    updateBarChart();
  }, []);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (pieChartInstance.current) pieChartInstance.current.destroy();
      if (lineChartInstance.current) lineChartInstance.current.destroy();
      if (barChartInstance.current) barChartInstance.current.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl mt-7 md:mt-0 font-bold text-gray-900">
              Dental Clinic Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
              Welcome back! Here's what's happening with your appointment system.
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
          {metricCards.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow h-full">
                <CardContent className="flex items-center justify-between p-3 sm:p-4 md:p-6">
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-xs xs:text-sm font-medium text-gray-600 truncate">
                      {metric.title}
                    </p>
                    <p className="text-base sm:text-lg font-bold text-gray-900">
                      {metric.value}
                    </p>
                  </div>
                  <IconComponent className={`h-6 w-6 sm:h-7 sm:w-7 ${metric.color}`} />
                </CardContent>
              </Card>
            );
          })}
        
        </div>

        {/* Main Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {/* Left Side - Appointment Status Analytics */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Appointment Status</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Distribution of appointment statuses
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">
                    {loadingAppointmentCounts ? 'Loading...' : 'Live Data'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-base sm:text-lg font-medium">Appointment Status</h3>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  <button
                    onClick={() => handleTimePeriodChange('overall')}
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md whitespace-nowrap ${timePeriod === 'overall' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    Overall
                  </button>
                  <button
                    onClick={() => handleTimePeriodChange('day')}
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md whitespace-nowrap ${timePeriod === 'day' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    Day
                  </button>
                  <button
                    onClick={() => handleTimePeriodChange('week')}
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md whitespace-nowrap ${timePeriod === 'week' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => handleTimePeriodChange('month')}
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md whitespace-nowrap ${timePeriod === 'month' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    Month
                  </button>
                </div>
              </div>
              <div className="mt-6 h-60 sm:h-72 md:h-80 mb-4 sm:mb-6 flex items-center justify-center">
                {loadingAppointmentCounts ? (
                  <div className="text-sm sm:text-base text-gray-500">Loading chart...</div>
                ) : (
                  <canvas ref={pieChartRef} className="max-w-full max-h-full w-full"></canvas>
                )}
              </div>

             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {appointmentStatus.map((status, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {status.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {status.value} {status.value === 1 ? 'appointment' : 'appointments'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right Side - Payment Analysis */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Payment Analysis</CardTitle>
                  <CardDescription className="mt-1">
                    Monthly revenue trends and payment status
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                    {loadingPaymentTrends ? 'Loading...' : '+12% vs last month'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-110">
                {loadingPaymentTrends ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Loading chart...
                  </div>
                ) : (
                  <canvas ref={lineChartRef} className="w-full h-full"></canvas>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DentalDashboard;