"use client";
import { useState, useEffect, useContext, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { User, Clock, Calendar, CheckCircle, UserCog, LogIn, LogOut } from 'lucide-react';
import { AuthContext } from '@/context/auth-context';
import ShiftSchedule from '@/components/ShiftSchedule';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// Interface for today's attendance data
// Added Employee and Shift interfaces for extra data fetching
interface Employee {
  eid: number;
  name: string;
  employment_status: "part time" | "full time";
}

interface Shift {
  shift_id: number;
  eid: number;
  from_time: string; // ISO string
  to_time: string;   // ISO string
  employee?: { name: string };
}

// Interface for today's attendance data
interface TodayAttendanceResponse {
  date: string;
  records: {
    eid: number;
    name: string;
    clock_in: string | null;
    clock_out: string | null;
    date: string;
    present: boolean;
  }[];
  stats: {
    present: number;
    absent: number;
    total: number;
  };
}

// Interface for today's leave data
interface TodayLeavesResponse {
  date: string;
  records: {
    eid: number;
    employee_name: string;
    from_date: string;
    to_date: string;
    type: string;
    status: string;
    duration: number;
  }[];
  stats: {
    on_leave: number;
    by_type: Record<string, number>;
  };
}

// Interface for today's attendance records
interface AttendanceRecord {
  eid: number;
  name: string;
  clock_in: string | null;
  clock_out: string | null;
  hours?: number;
  status: string;
}

// Interface for daily attendance stats
interface AttendanceStats {
  present: number;
  absent: number;
  on_leave: number;
}

export default function TimeManagementPage() {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const { isLoggedIn, isLoadingAuth, user, apiClient } = useContext(AuthContext);
  const router = useRouter();
  
  // State variables
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shiftsToday, setShiftsToday] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    on_leave: 0
  });
  const [clockingInEid, setClockingInEid] = useState<number | null>(null);
  const [clockingOutEid, setClockingOutEid] = useState<number | null>(null);
  
  // Fetch data helper wrapped in useCallback so it can be reused (e.g. after adding a shift)
  const fetchData = useCallback(async () => {
    if (!isLoggedIn || !backendURL) {
      return;
    }

    setLoading(true);
    try {
      // Fetch employees (used for employment status & part-time list)
      const employeesRes = await apiClient.get<Employee[]>(`/hr/employees`);
      setEmployees(employeesRes.data);

      // Fetch all shifts and keep today's only
      const shiftsRes = await apiClient.get<Shift[]>(`/hr/shifts`);
      const todayISO = new Date().toISOString().split("T")[0];
      const todaysShifts = shiftsRes.data.filter(sh => new Date(sh.from_time).toISOString().split("T")[0] === todayISO);
      setShiftsToday(todaysShifts);

      // Fetch today's attendance and leaves
      const [attendanceResponse, leavesResponse] = await Promise.all([
        apiClient.get<TodayAttendanceResponse>(`/hr/attendance/today`),
        apiClient.get<TodayLeavesResponse>(`/hr/leaves/today/all`)
      ]);

      if (attendanceResponse.data && leavesResponse.data) {
        const attendanceData = attendanceResponse.data;
        const leavesData = leavesResponse.data;

        // Build maps for faster lookups
        const leaveSet = new Set<number>(leavesData.records.map(l => l.eid));
        const empStatusMap: Record<number, Employee["employment_status"]> = {};
        employeesRes.data.forEach(emp => {
          empStatusMap[emp.eid] = emp.employment_status;
        });

        // Helper to know if part-timer has shift today
        const partTimerHasShift = (eid: number) => todaysShifts.some(sh => sh.eid === eid);

        const today = new Date();
        const isWeekend = today.getDay() === 0 || today.getDay() === 6; // Sunday =0, Saturday =6

        const processedRecords: AttendanceRecord[] = attendanceData.records.reduce((acc: AttendanceRecord[], record) => {
          const employment = empStatusMap[record.eid] || "full time";

          // Skip part-timers without shift today
          if (employment === "part time" && !partTimerHasShift(record.eid)) {
            return acc;
          }

          let status = record.present ? "Present" : "Absent";
          let hours = 0;

          // Calculate hours if both clock in and out are present
          if (record.clock_in && record.clock_out) {
            hours = calculateHoursFromTimeStrings(record.clock_in, record.clock_out);
          }

          // Override status if on leave
          if (leaveSet.has(record.eid)) {
            status = "On Leave";
          }

          // Weekend rule for full-timers
          if (employment === "full time" && !record.present && isWeekend) {
            status = "Weekend";
          }

          acc.push({
            eid: record.eid,
            name: record.name,
            clock_in: record.clock_in,
            clock_out: record.clock_out,
            hours,
            status
          });
          return acc;
        }, []);

        setAttendanceRecords(processedRecords);
        const present = processedRecords.filter(r => r.status === "Present").length;
        const absent = processedRecords.filter(r => r.status === "Absent").length;
        const on_leave = processedRecords.filter(r => r.status === "On Leave").length;
        setAttendanceStats({ present, absent, on_leave });
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [backendURL, isLoggedIn]);

  // Load data on component mount and whenever dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle clock in for an employee
  const handleClockIn = async (eid: number) => {
    setClockingInEid(eid);
    try {
      const response = await apiClient.post(`/hr/attendance/clock-in`, { eid });
      toast.success('Clock in successful');
      // Refresh data to update UI
      await fetchData();
    } catch (error: any) {
      console.error('Error clocking in:', error);
      const errorMessage = error.response?.data?.message || 'Failed to clock in';
      toast.error(errorMessage);
    } finally {
      setClockingInEid(null);
    }
  };

  // Handle clock out for an employee
  const handleClockOut = async (eid: number) => {
    setClockingOutEid(eid);
    try {
      const response = await apiClient.post(`/hr/attendance/clock-out`, { eid });
      toast.success('Clock out successful');
      // Refresh data to update UI
      await fetchData();
    } catch (error: any) {
      console.error('Error clocking out:', error);
      const errorMessage = error.response?.data?.message || 'Failed to clock out';
      toast.error(errorMessage);
    } finally {
      setClockingOutEid(null);
    }
  };

  // Helper function to determine status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'part-time':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'weekend':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Calculate hours between clock in and clock out
  const calculateHours = (clockIn: string, clockOut: string) => {
    if (!clockIn || !clockOut) return 0;
    
    const [inHour, inMinute] = clockIn.split(':').map(Number);
    const [outHour, outMinute] = clockOut.split(':').map(Number);
    
    const totalInMinutes = inHour * 60 + inMinute;
    const totalOutMinutes = outHour * 60 + outMinute;
    
    return ((totalOutMinutes - totalInMinutes) / 60).toFixed(1);
  };
  
  // Calculate hours from time strings in 12-hour format (e.g. '8:00 AM', '5:30 PM')
  const calculateHoursFromTimeStrings = (clockIn: string, clockOut: string): number => {
    if (!clockIn || !clockOut) return 0;
    
    // Parse the clock in time
    const inMatches = clockIn.match(/^(\d+):(\d+)\s(AM|PM)$/);
    if (!inMatches) return 0;
    
    let [_, inHourStr, inMinuteStr, inPeriod] = inMatches;
    let inHour = parseInt(inHourStr);
    if (inPeriod === 'PM' && inHour !== 12) inHour += 12;
    if (inPeriod === 'AM' && inHour === 12) inHour = 0;
    const inMinute = parseInt(inMinuteStr);
    
    // Parse the clock out time
    const outMatches = clockOut.match(/^(\d+):(\d+)\s(AM|PM)$/);
    if (!outMatches) return 0;
    
    let [__, outHourStr, outMinuteStr, outPeriod] = outMatches;
    let outHour = parseInt(outHourStr);
    if (outPeriod === 'PM' && outHour !== 12) outHour += 12;
    if (outPeriod === 'AM' && outHour === 12) outHour = 0;
    const outMinute = parseInt(outMinuteStr);
    
    // Calculate total minutes
    const totalInMinutes = inHour * 60 + inMinute;
    const totalOutMinutes = outHour * 60 + outMinute;
    
    // Handle overnight shifts
    let diffMinutes = totalOutMinutes - totalInMinutes;
    if (diffMinutes < 0) diffMinutes += 24 * 60; // Add a day worth of minutes
    
    return parseFloat((diffMinutes / 60).toFixed(1));
  };

  useEffect(()=>{
    if(isLoadingAuth) return;
    if(!isLoggedIn){
      toast.error("Login Error", {description:"Please Login"});
      router.push("/");
    }
    else if(user.role != "admin"){
      toast.error("Access Denied", {description:"You do not have admin priviledges"});
      router.push("/");
    }
  },[isLoadingAuth]);

  return (
    <div className="w-full">
      <div className="space-y-6 pb-6">
        {/* Stats cards */}
        <div className="mb-8">
          <p className="mt-1 text-sm text-gray-500">Time management and attendance tracking system</p>
        </div>
        
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3 mr-4">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Present</CardTitle>
                  <CardDescription>Today's attendance</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {loading ? '...' : attendanceStats.present}
              </div>
            </CardContent>
          </Card>
          

          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-500 rounded-md p-3 mr-4">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Absent</CardTitle>
                  <CardDescription>Missing staff</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {loading ? '...' : attendanceStats.absent}
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3 mr-4">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">On Leave</CardTitle>
                  <CardDescription>Approved absences</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {loading ? '...' : attendanceStats.on_leave}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {/* Attendance Table */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">Today's Attendance</CardTitle>
                    <CardDescription>
                      Staff time tracking for {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}
                    </CardDescription>
                  </div>
                  <Button size="sm" variant="outline" className="text-blue-600">
                    <Clock className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Loading attendance data...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableCaption>Staff attendance record for today</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Clock In</TableHead>
                          <TableHead>Clock Out</TableHead>
                          <TableHead>Hours</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceRecords.map((record) => (
                          <TableRow key={record.eid}>
                            <TableCell className="font-medium">{record.name}</TableCell>
                            <TableCell>{record.clock_in || "-"}</TableCell>
                            <TableCell>{record.clock_out || "-"}</TableCell>
                            <TableCell>{record.hours || "0"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusBadgeColor(record.status)}>
                                {record.status || "Unknown"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {!record.clock_in ? (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-green-600 hover:text-green-800"
                                    onClick={() => handleClockIn(record.eid)}
                                    disabled={clockingInEid === record.eid}
                                  >
                                    {clockingInEid === record.eid ? (
                                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
                                    ) : (
                                      <LogIn className="h-4 w-4 mr-1" />
                                    )}
                                    Clock In
                                  </Button>
                                ) : !record.clock_out ? (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-red-600 hover:text-red-800"
                                    onClick={() => handleClockOut(record.eid)}
                                    disabled={clockingOutEid === record.eid}
                                  >
                                    {clockingOutEid === record.eid ? (
                                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                                    ) : (
                                      <LogOut className="h-4 w-4 mr-1" />
                                    )}
                                    Clock Out
                                  </Button>
                                ) : null}
                              </div>
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
          
          <div>
            {/* Shift Schedule */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <ShiftSchedule 
                  loading={loading} 
                  shifts={shiftsToday}
                  partTimeEmployees={employees.filter(e => e.employment_status === 'part time')}
                  onShiftAdded={() => fetchData()}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}