"use client";
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  format, 
  parseISO, 
  isWithinInterval, 
  addHours, 
  setHours, 
  setMinutes,
  differenceInMinutes
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Interfaces
interface Employee {
  eid: number;
  name: string;
  employment_status: "part time" | "full time";
}

interface Shift {
  shift_id: number;
  eid: number;
  from_time: string; // ISO
  to_time: string;   // ISO
  employee?: { name: string };
}

interface DayRosterViewProps {
  employees: Employee[];
  shifts: Shift[];
  loading?: boolean;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DayRosterView({ 
  employees, 
  shifts, 
  loading = false,
  currentDate,
  onDateChange
}: DayRosterViewProps) {
  // Filter to only show part-time employees
  const partTimeEmployees = employees.filter(e => e.employment_status === "part time");

  // Generate time slots for the day (9am to 5pm, 30-minute intervals)
  const startHour = 9;
  const endHour = 17;
  const interval = 30; // 30 minutes
  const totalMinutes = (endHour - startHour) * 60; // Total minutes in the view
  
  const generateTimeSlots = () => {
    const slots = [];
    const dayStart = setHours(setMinutes(new Date(currentDate), 0), startHour);
    
    for (let h = 0; h <= (endHour - startHour) * 2; h++) {
      const slotTime = addHours(dayStart, h / 2);
      slots.push(slotTime);
    }
    
    return slots;
  };
  
  const timeSlots = generateTimeSlots();
  
  // Format time display
  const formatTimeSlot = (date: Date) => {
    return format(date, 'h:mm a').toLowerCase();
  };
  
  // Check if shift is within a specific time slot
  const isShiftInTimeSlot = (
    shift: Shift, 
    slotStart: Date, 
    slotEnd: Date
  ) => {
    const shiftStart = parseISO(shift.from_time);
    const shiftEnd = parseISO(shift.to_time);
    
    // Check if shift overlaps with this time slot
    return (
      isWithinInterval(shiftStart, { start: slotStart, end: slotEnd }) ||
      isWithinInterval(shiftEnd, { start: slotStart, end: slotEnd }) ||
      (shiftStart <= slotStart && shiftEnd >= slotEnd)
    );
  };
  
  // Calculate position and width of shift block in grid
  const calculateShiftDisplay = (shift: Shift) => {
    const shiftStart = parseISO(shift.from_time);
    const shiftEnd = parseISO(shift.to_time);
    
    // Get start of day at 9am for calculations
    const currentDay = new Date(currentDate);
    const dayStart = setHours(setMinutes(currentDay, 0), startHour);
    const dayEnd = setHours(setMinutes(currentDay, 0), endHour);
    
    // Adjust if shift starts before view start or ends after view end
    const displayStart = shiftStart < dayStart ? dayStart : shiftStart;
    const displayEnd = shiftEnd > dayEnd ? dayEnd : shiftEnd;
    
    // Get hours and minutes to calculate exact position
    const startHours = displayStart.getHours();
    const startMinutes = displayStart.getMinutes();
    const totalStartMinutes = (startHours - startHour) * 60 + startMinutes;
    
    const endHours = displayEnd.getHours();
    const endMinutes = displayEnd.getMinutes();
    const totalEndMinutes = (endHours - startHour) * 60 + endMinutes;
    
    // Calculate exact percentages
    const leftPercent = (totalStartMinutes / totalMinutes) * 100;
    const rightEndPercent = (totalEndMinutes / totalMinutes) * 100;
    const widthPercent = rightEndPercent - leftPercent;
    
    // Format time strings for display
    const fromTime = format(shiftStart, 'h:mm').padStart(4, ' ') + format(shiftStart, 'a').toLowerCase();
    const toTime = format(shiftEnd, 'h:mm').padStart(4, ' ') + format(shiftEnd, 'a').toLowerCase();
    
    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
      fromTime,
      toTime
    };
  };
  
  // Check if a shift is visible in today's view
  const isShiftVisible = (shift: Shift) => {
    const shiftDate = parseISO(shift.from_time).toDateString();
    const viewDate = currentDate.toDateString();
    return shiftDate === viewDate;
  };
  
  // Navigate to previous/next day
  const goToPreviousDay = () => {
    const prevDay = new Date(currentDate);
    prevDay.setDate(prevDay.getDate() - 1);
    onDateChange(prevDay);
  };
  
  const goToNextDay = () => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    onDateChange(nextDay);
  };
  
  return (
    <div className="w-full">
      {/* Day navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm font-medium">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </span>
          <Button variant="outline" size="sm" onClick={goToNextDay}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <Card className="border-2 border-gray-200">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Time header */}
                <div className="flex border-b border-gray-300">
                  <div className="w-[120px] p-3 font-medium bg-white border-r border-gray-300 sticky left-0 z-10">
                    Employee
                  </div>
                  <div className="flex-1 relative">
                    <div className="flex">
                      {timeSlots.map((slot, index) => (
                        <div 
                          key={index} 
                          className="flex-1 p-2 text-center border-r border-gray-300 text-xs font-medium"
                        >
                          {formatTimeSlot(slot)}
                        </div>
                      ))}
                    </div>
                    
                    {/* Time grid vertical lines for precise positioning */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {timeSlots.map((_, index) => (
                        <div key={index} className="flex-1 border-r border-gray-300"></div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Employee rows */}
                {partTimeEmployees.length === 0 ? (
                  <div className="text-center p-6 text-gray-500">
                    No part-time employees found
                  </div>
                ) : (
                  partTimeEmployees.map((employee) => {
                    // Get shifts for this employee on selected day
                    const employeeShifts = shifts.filter(
                      shift => shift.eid === employee.eid && isShiftVisible(shift)
                    );
                    
                    return (
                      <div key={employee.eid} className="flex border-b border-gray-300 hover:bg-gray-50">
                        <div className="w-[120px] p-3 font-semibold bg-white border-r border-gray-300 sticky left-0 z-10">
                          {employee.name}
                        </div>
                        <div className="flex-1 relative h-16">
                          {/* Time grid background - add subtle background for better visibility */}
                          <div className="flex h-full absolute w-full">
                            {timeSlots.map((_, index) => (
                              <div key={index} className={`flex-1 h-full border-r border-gray-300 ${index % 2 === 0 ? 'bg-gray-50/30' : ''}`}></div>
                            ))}
                          </div>
                          
                          {/* Shifts as positioned blocks */}
                          {employeeShifts.map(shift => {
                            const { left, width, fromTime, toTime } = calculateShiftDisplay(shift);
                            
                            return (
                              <div
                                key={shift.shift_id}
                                className="absolute h-10 top-3 rounded-sm text-xs flex items-center"
                                style={{ 
                                  left,
                                  width,
                                  backgroundColor: '#e3efff',
                                  border: '1px solid #aecdf7',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                  zIndex: 5 // Ensure shifts appear above grid lines
                                }}
                              >
                                <div className="px-1 py-1 truncate text-blue-800 w-full text-center font-medium">
                                  {fromTime} - {toTime}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
