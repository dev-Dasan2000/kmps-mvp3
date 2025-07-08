"use client";
import { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import { toast } from 'sonner';
import { AuthContext } from '@/context/auth-context';

// Shift schedule interface
interface Shift {
  shift_id: number;
  eid: number;
  from_time: string;
  to_time: string;
  name?: string;
  staff_count?: number;
  group?: string;
}

// Employee interface
interface Employee {
  eid: number;
  name: string;
  email: string;
  job_title: string;
  employment_type: string;
}

interface ShiftScheduleProps {
  shifts?: Shift[];
  loading?: boolean;
  onUpdate?: () => void;
}

export default function ShiftSchedule({ shifts, loading = false, onUpdate }: ShiftScheduleProps) {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const { accessToken } = useContext(AuthContext);

  const [activeShifts, setActiveShifts] = useState<Shift[]>([]);
  const [partTimeEmployees, setPartTimeEmployees] = useState<Employee[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [formLoading, setFormLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  // Fetch today's shifts and part-time employees
  useEffect(() => {
    const fetchShiftsAndEmployees = async () => {
      if (!backendURL) return;
      
      try {
        // Get today's date in YYYY-MM-DD format
        
        // Fetch today's shifts
        const shiftsResponse = await axios.get(`${backendURL}/hr/shifts`);
        
        // Filter for today's shifts only
        const todayShifts = shiftsResponse.data.filter((shift: Shift) => {
          const shiftDate = new Date(shift.from_time).toISOString().split('T')[0];
          return shiftDate === today;
        });
        
        setActiveShifts(todayShifts);
        
        // Fetch part-time employees
        const employeesResponse = await axios.get(`${backendURL}/hr/employees`);
        
        setPartTimeEmployees(employeesResponse.data.filter((emp: Employee) => 
          emp.employment_type === 'part-time'
        ));
        
      } catch (error) {
        console.error('Error fetching shifts or employees:', error);
        toast.error('Failed to load shifts or employees');
      }
    };
    
    if (!loading) {
      fetchShiftsAndEmployees();
    }
  }, [backendURL, accessToken, loading]);

  // Format time in 12-hour format
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    
    let date;
    if (timeStr.includes('T')) {
      // Handle ISO format
      date = new Date(timeStr);
    } else {
      // Handle HH:MM format
      const [hours, minutes] = timeStr.split(':');
      date = new Date();
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Count active shifts
  const currentlyActiveCount = activeShifts.length;

  // Handle form submission
  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !startTime || !endTime) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setFormLoading(true);
    try {
      // Format times to ISO format
      const fromTime = `${today}T${startTime}:00`;
      const toTime = `${today}T${endTime}:00`;
      
      await axios.post(`${backendURL}/hr/shifts`, {
        eid: parseInt(selectedEmployee),
        from_time: fromTime,
        to_time: toTime
      });
      
      toast.success('Shift added successfully');
      setIsAddDialogOpen(false);
      
      // Reset form fields
      setSelectedEmployee('');
      setStartTime('');
      setEndTime('');
      
      // Refetch shifts
      const shiftsResponse = await axios.get(`${backendURL}/hr/shifts`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      // Filter for today's shifts only
      const todayShifts = shiftsResponse.data.filter((shift: Shift) => {
        const shiftDate = new Date(shift.from_time).toISOString().split('T')[0];
        return shiftDate === today;
      });
      
      setActiveShifts(todayShifts);
      if (onUpdate) onUpdate();
      
    } catch (error) {
      console.error('Error adding shift:', error);
      toast.error('Failed to add shift');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Shift Schedule</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="text-xs">
              <Plus className="h-3 w-3 mr-1" /> Add Shift
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Shift</DialogTitle>
              <DialogDescription>Schedule a shift for a part-time employee</DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAddShift}>
              <div className="space-y-3 py-2">
                <div className="space-y-1">
                  <Label htmlFor="employee">Select Employee</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {partTimeEmployees.map((employee) => (
                        <SelectItem key={employee.eid} value={employee.eid.toString()}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input 
                      id="start-time" 
                      type="time" 
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="end-time">End Time</Label>
                    <Input 
                      id="end-time" 
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={formLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? 'Adding...' : 'Add Shift'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-3">
        <Card className="hover:shadow-sm transition-shadow mb-4">
          <CardHeader className="pb-1 pt-3">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-emerald-500 rounded-md p-2 mr-3">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Active Shifts</CardTitle>
                <CardDescription className="text-xs">Currently active</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-2xl font-bold text-emerald-600">
              {loading ? "..." : currentlyActiveCount}
            </div>
            {activeShifts.length > 0 ? (
              <div className="mt-2 space-y-1 text-sm">
                {/* Group shifts by time period */}
                {[...new Set(activeShifts.map(shift => {
                  const hour = new Date(shift.from_time).getHours();
                  if (hour < 12) return 'Morning';
                  if (hour < 17) return 'Afternoon';
                  return 'Evening';
                }))].map(period => (
                  <p key={period} className="font-medium text-xs">
                    {period}: {activeShifts.filter(shift => {
                      const hour = new Date(shift.from_time).getHours();
                      if (period === 'Morning' && hour < 12) return true;
                      if (period === 'Afternoon' && hour >= 12 && hour < 17) return true;
                      if (period === 'Evening' && hour >= 17) return true;
                      return false;
                    }).length} staff
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-2">No active shifts today</p>
            )}
          </CardContent>
        </Card>
      </div>

      {activeShifts.length > 0 ? (
        activeShifts.map(shift => (
          <Card key={shift.shift_id} className="mb-3 hover:shadow-sm transition-shadow">
            <CardHeader className="py-2 px-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">
                    {shift.name || `Shift ${shift.shift_id}`}
                  </p>
                  <div className="flex items-center mt-0.5 text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(shift.from_time)} - {formatTime(shift.to_time)}
                  </div>
                </div>
                <Badge className="text-xs px-1.5 py-0.5">ID: {shift.eid}</Badge>
              </div>
            </CardHeader>
          </Card>
        ))
      ) : (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">No shifts scheduled for today</p>
          <p className="text-xs text-gray-400 mt-1">Add shifts using the button above</p>
        </div>
      )}

      <div className="flex justify-center mt-4">
        <Button variant="outline" size="sm" className="text-blue-600 text-xs">
          <Calendar className="h-3 w-3 mr-1" />
          View Schedule
        </Button>
      </div>
    </div>
  );
}
