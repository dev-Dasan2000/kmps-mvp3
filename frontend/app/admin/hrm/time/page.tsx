"use client";
import { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { User, Calendar, Clock, CheckCircle, UserCog, RefreshCcw } from 'lucide-react';
import { AuthContext } from '@/context/auth-context';
import ShiftSchedule from '@/components/ShiftSchedule';
import axios from 'axios';
import { toast } from 'sonner';

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
    employment_type?: string;
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

// Interface for shift data
interface ShiftResponse {
  shift_id: number;
  eid: number;
  from_time: string;
  to_time: string;
  employee?: {
    name: string;
    employment_type: string;
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
  employment_type?: string;
  has_shift_today?: boolean;
}

// Interface for daily attendance stats
interface AttendanceStats {
  present: number;
  absent: number;
  on_leave: number;
}

export default function TimeManagementPage() {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const { accessToken, isLoggedIn } = useContext(AuthContext);
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [todayShifts, setTodayShifts] = useState<ShiftResponse[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    on_leave: 0
  });
  
  // Function to reload data
  const fetchData = async () => {
    if (!isLoggedIn || !backendURL) {
      return;
    }
    
    setLoading(true);
    try {
      // Get today's date and day of week (0 = Sunday, 6 = Saturday)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
      
      // Fetch today's attendance data
      const attendanceResponse = await axios.get<TodayAttendanceResponse>(
        `${backendURL}/hr/attendance/today`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      // Fetch today's leave data
      const leavesResponse = await axios.get<TodayLeavesResponse>(
        `${backendURL}/hr/leaves/today/all`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      // Fetch today's shifts
      const shiftsResponse = await axios.get<ShiftResponse[]>(
        `${backendURL}/hr/shifts`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      // Filter shifts for today
      const todayDateStr = today.toISOString().split('T')[0];
      const shiftsForToday = shiftsResponse.data.filter(shift => {
        const shiftDate = new Date(shift.from_time).toISOString().split('T')[0];
        return shiftDate === todayDateStr;
      });
      
      setTodayShifts(shiftsForToday);
      
      // Get employee IDs with shifts today
      const employeesWithShifts = new Set(shiftsForToday.map(shift => shift.eid));
      
      if (attendanceResponse.data && leavesResponse.data) {
        const attendanceData = attendanceResponse.data;
        const leavesData = leavesResponse.data;
        
        // Get employees on leave
        const employeesOnLeave = new Set(leavesData.records.map(leave => leave.eid));
        
        // Process records to add hours and status
        const processedRecords: AttendanceRecord[] = attendanceData.records
          .map(record => {
            // Check if this employee has a shift today
            const hasShiftToday = employeesWithShifts.has(record.eid);
            
            // Determine status
            let status = record.present ? 'Present' : 'Absent';
            let hours = 0;
            
            // Calculate hours if both clock in and out are present
            if (record.clock_in && record.clock_out) {
              hours = calculateHoursFromTimeStrings(record.clock_in, record.clock_out);
            }
            
            // Check if employee is on leave
            const isOnLeave = employeesOnLeave.has(record.eid);
            if (isOnLeave) {
              status = 'On Leave';
            }
            
            // For full-time employees on weekends, show 'Weekend' instead of 'Absent'
            if (isWeekend && status === 'Absent' && record.employment_type === 'full-time') {
              status = 'Weekend';
            }
            
            return {
              eid: record.eid,
              name: record.name,
              clock_in: record.clock_in,
              clock_out: record.clock_out,
              hours,
              status,
              employment_type: record.employment_type,
              has_shift_today: hasShiftToday
            };
          })
          // Only show employees with shifts today in the attendance list
          .filter(record => record.has_shift_today);
        
        // Calculate updated stats based on filtered records
        const presentCount = processedRecords.filter(r => r.status === 'Present').length;
        const absentCount = processedRecords.filter(r => r.status === 'Absent').length;
        const onLeaveCount = processedRecords.filter(r => r.status === 'On Leave').length;
        
        setAttendanceRecords(processedRecords);
        setAttendanceStats({
          present: presentCount,
          absent: absentCount,
          on_leave: onLeaveCount
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };
  
  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, [backendURL, isLoggedIn]);

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
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'on leave':
        return 'bg-amber-100 text-amber-800 border-amber-200';
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
                  <CheckCircle className="h-6 w-6 text-white" />
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
                  <CardDescription>Missing staff with shifts today</CardDescription>
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
                      Staff with shifts on {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="text-blue-600" onClick={fetchData}>
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button size="sm" variant="outline" className="text-blue-600">
                      <Clock className="h-4 w-4 mr-2" />
                      Export Report
                    </Button>
                  </div>
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
                <ShiftSchedule loading={loading} shifts={todayShifts} onUpdate={fetchData} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}