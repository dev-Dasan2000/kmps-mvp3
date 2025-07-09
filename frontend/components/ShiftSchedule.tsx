"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, CalendarIcon, Clock } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import RosterView from './RosterView';
import DayRosterView from './DayRosterView';

// Shift schedule interface
interface Shift {
  shift_id: number;
  eid: number;
  from_time: string; // ISO
  to_time: string;   // ISO
  employee?: { name: string };
}

interface Employee {
  eid: number;
  name: string;
  employment_status: "part time" | "full time";
}

// Props for the ShiftSchedule component
interface ShiftScheduleProps {
  shifts?: Shift[];
  loading?: boolean;
  partTimeEmployees?: Employee[];
  onShiftAdded?: () => void;
}

export default function ShiftSchedule({ shifts = [], loading = false, partTimeEmployees = [], onShiftAdded }: ShiftScheduleProps) {
  // Local component state
  const [activeShifts, setActiveShifts] = useState<Shift[]>(shifts);
  const [addOpen, setAddOpen] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [selectedEid, setSelectedEid] = useState<number | null>(null);
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Sync when prop changes
  useEffect(() => {
    setActiveShifts(shifts);
  }, [shifts]);

  // Fetch all shifts for the roster view and shift validation
  useEffect(() => {
    const fetchAllShifts = async () => {
      if (!backendURL) return;
      try {
        const response = await axios.get<Shift[]>(`${backendURL}/hr/shifts`);
        setAllShifts(response.data);
      } catch (error) {
        console.error('Error fetching all shifts:', error);
      }
    };

    // Always fetch shifts when adding a new shift or viewing roster
    if (rosterOpen || addOpen) {
      fetchAllShifts();
    }
  }, [backendURL, rosterOpen, addOpen]);

  // Function to check if a new shift overlaps with existing ones
  const checkShiftOverlap = (eid: number, fromTime: string, toTime: string): boolean => {
    const newStart = new Date(fromTime).getTime();
    const newEnd = new Date(toTime).getTime();

    // Find all shifts for this employee
    const employeeShifts = allShifts.filter(shift => shift.eid === eid);

    // Check for overlaps
    return employeeShifts.some(shift => {
      const existingStart = new Date(shift.from_time).getTime();
      const existingEnd = new Date(shift.to_time).getTime();

      // Overlap occurs when newStart is between existing shift or newEnd is between existing shift
      // or if new shift completely encompasses existing shift
      return (newStart < existingEnd && newStart >= existingStart) || // New start during existing shift
             (newEnd <= existingEnd && newEnd > existingStart) || // New end during existing shift
             (newStart <= existingStart && newEnd >= existingEnd); // New shift contains existing shift
    });
  };

  // Format time in 12-hour format
  const formatTime = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const meridiem = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${meridiem}`;
  };

  // Count active shifts (current time-based logic would be more complex in production)
  const currentlyActiveCount = activeShifts.length;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Shift Schedule</h2>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      <div className="mb-6">
        <Card className="hover:shadow-sm mb-4">
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-emerald-500 rounded-md p-3 mr-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Active Shifts</CardTitle>
                <CardDescription>Currently active</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {loading ? "..." : currentlyActiveCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {activeShifts.map(shift => (
        <Card key={shift.shift_id} className="mb-3 hover:shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">{shift.employee?.name || `Employee ${shift.eid}`}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-2" />
                  {formatTime(shift.from_time.split('T')[1].slice(0,5))} - {formatTime(shift.to_time.split('T')[1].slice(0,5))}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-center mt-6">
        <Button 
          variant="outline" 
          className="text-blue-600 flex items-center gap-2" 
          onClick={() => setRosterOpen(true)}
        >
          <CalendarIcon className="h-4 w-4" />
          Manage Roster
        </Button>
      </div>
      
      <Dialog open={rosterOpen} onOpenChange={setRosterOpen}>
        <DialogContent className="sm:max-w-[90vw] w-[90vw] max-h-[90vh] flex flex-col" style={{ maxWidth: '90vw' }}>
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-xl flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Staff Roster Management
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">View and manage employee shift schedules</p>
          </DialogHeader>
          <div className="flex justify-between items-center my-4">
            <div className="text-lg font-semibold">Staff Roster</div>
            <div className="flex bg-gray-100 p-1 rounded-md">
              <button 
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'week' ? 'bg-white shadow-sm text-blue-800' : 'text-gray-600 hover:text-gray-800'}`}
                onClick={() => setViewMode('week')}
              >
                Week View
              </button>
              <button 
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'day' ? 'bg-white shadow-sm text-blue-800' : 'text-gray-600 hover:text-gray-800'}`}
                onClick={() => setViewMode('day')}
              >
                Day View
              </button>
            </div>
          </div>
          <div className="py-4">
            {viewMode === 'week' ? (
              <RosterView 
                employees={partTimeEmployees} 
                shifts={allShifts} 
                loading={loading} 
              />
            ) : (
              <DayRosterView 
                employees={partTimeEmployees} 
                shifts={allShifts} 
                loading={loading}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
              />
            )}
          </div>

          <DialogFooter className="mt-2 pt-4 border-t">
            <div className="text-xs text-gray-500 mr-auto">
              {allShifts.length} shifts • {partTimeEmployees.length} employees
            </div>
            <Button variant="outline" onClick={() => setRosterOpen(false)} className="">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Shift Dialog */}
      <Dialog open={addOpen} onOpenChange={(v) => setAddOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">Add Shift</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Part-Time Employee</label>
              <Select value={selectedEid ? String(selectedEid) : undefined} onValueChange={(val) => setSelectedEid(parseInt(val))}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Choose employee" />
                </SelectTrigger>
                <SelectContent>
                  {partTimeEmployees.map(emp => (
                    <SelectItem key={emp.eid} value={String(emp.eid)}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">From</label>
                <Input type="datetime-local" value={fromTime} onChange={e => setFromTime(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">To</label>
                <Input type="datetime-local" value={toTime} onChange={e => setToTime(e.target.value)} />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={async () => {
              if (!backendURL) return;
              if (!selectedEid || !fromTime || !toTime) {
                toast.error('Please fill all fields');
                return;
              }
              
              // Validate the times
              const newFromTime = new Date(fromTime);
              const newToTime = new Date(toTime);
              
              // Check if end time is after start time
              if (newToTime <= newFromTime) {
                toast.error('End time must be after start time');
                return;
              }
              
              // Check for overlaps with existing shifts
              if (checkShiftOverlap(selectedEid, fromTime, toTime)) {
                toast.error('This shift overlaps with an existing shift for this employee');
                return;
              }
              
              setSaving(true);
              try {
                await axios.post(`${backendURL}/hr/shifts`, {
                  eid: selectedEid,
                  from_time: newFromTime.toISOString(),
                  to_time: newToTime.toISOString()
                });
                toast.success('Shift added');
                setAddOpen(false);
                setSelectedEid(null);
                setFromTime('');
                setToTime('');
                onShiftAdded && onShiftAdded();
              } catch (err: any) {
                console.error(err);
                toast.error(err.response?.data?.message || 'Error adding shift');
              } finally {
                setSaving(false);
              }
            }} disabled={saving}>
              {saving ? 'Saving...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

