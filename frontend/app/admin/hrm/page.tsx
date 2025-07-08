"use client";
import { Metadata } from 'next';
import { useState, useEffect, useContext, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Calendar, Users, Clock, CheckCircle } from 'lucide-react';
import { AuthContext } from '@/context/auth-context';
import axios from 'axios';
import { toast } from 'sonner';
import * as Chart from 'chart.js';

// Register Chart.js components
Chart.Chart.register(
  Chart.CategoryScale,
  Chart.LinearScale,
  Chart.PointElement,
  Chart.LineElement,
  Chart.BarElement,
  Chart.BarController,
  Chart.Title,
  Chart.Tooltip,
  Chart.Legend
);

// Interface for employee data
interface Employee {
  eid: number;
  name: string;
  job_title: string;
  email: string;
  phone: string;
}

// Interface for attendance data
interface WeeklyAttendance {
  eid: number;
  name: string;
  weekly_attendance: {
    [day: string]: {
      attendance: { clock_in: string; clock_out: string }[];
      leave: boolean;
      date: string;
    };
  };
  total_days_present: number;
  total_days_on_leave: number;
  effective_attendance: number;
  week_range: {
    start: string;
    end: string;
  };
}

export default function HRMDashboardPage() {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const { accessToken, isLoggedIn } = useContext(AuthContext);
  
  // Chart references
  const weeklyChartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart.Chart | null>(null);
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]); 
  const [onLeaveToday, setOnLeaveToday] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [weeklyAttendance, setWeeklyAttendance] = useState<WeeklyAttendance[]>([]);
  const [dailyAttendanceCounts, setDailyAttendanceCounts] = useState<{date: string, present: number, leave: number}[]>([]);

  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!isLoggedIn || !backendURL) {
        return;
      }
      
      setLoading(true);
      try {
        // Fetch employees
        const employeesResponse = await axios.get(`${backendURL}/hr/employees`);
        setEmployees(employeesResponse.data || []);
        
        // Fetch weekly attendance
        const weeklyAttendanceResponse = await axios.get(`${backendURL}/hr/attendance/weekly/all`);
        setWeeklyAttendance(weeklyAttendanceResponse.data || []);
        
        // Calculate on leave today
        const currentDate = new Date().toISOString().split('T')[0];
        const todayLeaveCount = weeklyAttendanceResponse.data?.filter((employee: WeeklyAttendance) => {
          const todayKey = Object.keys(employee.weekly_attendance).find(day => 
            employee.weekly_attendance[day].date === currentDate
          );
          return todayKey && employee.weekly_attendance[todayKey].leave;
        }).length || 0;
        setOnLeaveToday(todayLeaveCount);
        
        // Calculate attendance rate
        if (weeklyAttendanceResponse.data && weeklyAttendanceResponse.data.length > 0) {
          const totalEmployees = employeesResponse.data?.length || 0;
          const totalWorkdays = weeklyAttendanceResponse.data.length * 5; // Assuming 5 workdays per employee
          const totalPresent = weeklyAttendanceResponse.data.reduce(
            (sum: number, employee: WeeklyAttendance) => sum + employee.total_days_present + employee.total_days_on_leave, 0
          );
          
          const rate = totalWorkdays > 0 ? (totalPresent / totalWorkdays) * 100 : 0;
          setAttendanceRate(Math.round(rate));
          
          // Process daily attendance data for chart
          if (weeklyAttendanceResponse.data.length > 0) {
            const firstEmployee = weeklyAttendanceResponse.data[0];
            const days = Object.keys(firstEmployee.weekly_attendance).map(day => {
              const dayData = firstEmployee.weekly_attendance[day];
              return dayData.date;
            }).sort();
            
            // Calculate daily counts
            const dailyCounts = days.map(date => {
              let presentCount = 0;
              let leaveCount = 0;
              
              weeklyAttendanceResponse.data.forEach((employee: WeeklyAttendance) => {
                const dayKey = Object.keys(employee.weekly_attendance).find(key => 
                  employee.weekly_attendance[key].date === date
                );
                
                if (dayKey) {
                  const dayData = employee.weekly_attendance[dayKey];
                  if (dayData.leave) {
                    leaveCount++;
                  } else if (dayData.attendance.length > 0) {
                    presentCount++;
                  }
                }
              });
              
              return {
                date,
                present: presentCount,
                leave: leaveCount
              };
            });
            
            setDailyAttendanceCounts(dailyCounts);
          }
        }
      } catch (error) {
        console.error('Error fetching HR data:', error);
        toast.error('Failed to load HR dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [backendURL, isLoggedIn]);

  // Helper function to get status badge color
  const getAttendanceStatusColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-100 text-green-800';
    if (rate >= 75) return 'bg-blue-100 text-blue-800';
    if (rate >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Format day name from ISO date
  const formatDayName = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  useEffect(() => {
    if (loading || dailyAttendanceCounts.length === 0 || !weeklyChartRef.current) return;
    
    // Destroy previous chart if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }
    
    const ctx = weeklyChartRef.current.getContext('2d');
    if (!ctx) return;
    
    // Format dates for labels
    const labels = dailyAttendanceCounts.map(day => formatDayName(day.date));
    const presentData = dailyAttendanceCounts.map(day => day.present);
    const leaveData = dailyAttendanceCounts.map(day => day.leave);
    
    // Create new chart
    chartInstanceRef.current = new Chart.Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Present',
            data: presentData,
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'On Leave',
            data: leaveData,
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1,
            borderRadius: 4,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            },
            title: {
              display: true,
              text: 'Number of Employees'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Day'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Daily Attendance - Past 7 Days'
          },
          tooltip: {
            callbacks: {
              footer: (tooltipItems) => {
                const index = tooltipItems[0].dataIndex;
                const total = presentData[index] + leaveData[index];
                const totalEmployees = employees.length;
                const absent = totalEmployees - total;
                return `Absent: ${absent} employee${absent !== 1 ? 's' : ''}`;
              },
            }
          }
        }
      }
    });
  }, [dailyAttendanceCounts, loading, employees.length]);

  return (
    <div className="w-full">
      <div className="space-y-6 pb-6">
      
      {/* Stats cards */}
      <div className="mb-8">
        <p className="mt-1 text-sm text-gray-500">Overview of your human resource management system</p>
      </div>
      
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3 mr-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Total Employees</CardTitle>
                <CardDescription>Company workforce</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? '...' : employees.length}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {loading ? 'Loading...' : `${employees.filter(e => e.job_title?.toLowerCase().includes('manager')).length} managers`}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3 mr-4">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">On Leave Today</CardTitle>
                <CardDescription>Approved absences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? '...' : onLeaveToday}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {loading ? 'Loading...' : `${((onLeaveToday / (employees.length || 1)) * 100).toFixed(1)}% of workforce`}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3 mr-4">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Attendance Rate</CardTitle>
                <CardDescription>Weekly performance</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? '...' : `${attendanceRate}%`}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {loading ? 'Loading...' : `Attendance rate of ${attendanceRate}%`}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Weekly Attendance Chart */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-xl">Weekly Attendance Overview</CardTitle>
          <CardDescription>
            {weeklyAttendance.length > 0 && !loading
              ? `${weeklyAttendance[0].week_range.start} to ${weeklyAttendance[0].week_range.end}`
              : 'Loading attendance data...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading attendance data...</div>
          ) : (
            <div className="h-80">
              <canvas ref={weeklyChartRef} className="w-full h-full"></canvas>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Weekly Attendance Table */}
      <Card className="hover:shadow-md transition-shadow mt-6">
        <CardHeader>
          <CardTitle className="text-xl">Weekly Attendance Details</CardTitle>
          <CardDescription>
            {weeklyAttendance.length > 0 && !loading
              ? `${weeklyAttendance[0].week_range.start} to ${weeklyAttendance[0].week_range.end}`
              : 'Loading attendance data...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading attendance data...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>Weekly attendance record for all employees</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Employee</TableHead>
                    {weeklyAttendance.length > 0 && 
                      Object.keys(weeklyAttendance[0].weekly_attendance).map((day) => {
                        const date = weeklyAttendance[0].weekly_attendance[day].date;
                        const dayName = formatDayName(date);
                        const formattedDate = new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                        
                        return (
                          <TableHead key={day} className="text-center">
                            <div className="flex flex-col items-center">
                              <span>{dayName}</span>
                              <span className="text-xs text-muted-foreground">{formattedDate}</span>
                            </div>
                          </TableHead>
                        );
                      })
                    }
                    <TableHead className="text-right">Attendance %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklyAttendance.map((employee) => (
                    <TableRow key={employee.eid}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      {Object.keys(employee.weekly_attendance).map((day) => {
                        const dayData = employee.weekly_attendance[day];
                        const hasAttendance = dayData.attendance.length > 0;
                        const isOnLeave = dayData.leave;
                        
                        return (
                          <TableCell key={day} className="text-center">
                            {isOnLeave ? (
                              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                Leave
                              </Badge>
                            ) : hasAttendance ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                Present
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                                -
                              </Badge>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right">
                        <Badge className={getAttendanceStatusColor(Math.round((employee.effective_attendance / 5) * 100))}>
                          {Math.round((employee.effective_attendance / 5) * 100)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}