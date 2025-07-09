"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { format, startOfWeek, addDays, parseISO, isWithinInterval } from 'date-fns';
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

interface RosterViewProps {
  employees: Employee[];
  shifts: Shift[];
  loading?: boolean;
}

export default function RosterView({ employees, shifts, loading = false }: RosterViewProps) {
  // Filter to only show part-time employees
  const partTimeEmployees = employees.filter(e => e.employment_status === 'part time');
  
  // State for current week
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  // Generate array of days for the week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  // Format time in 12-hour format
  const formatTime = (isoTime: string) => {
    const date = parseISO(isoTime);
    return format(date, 'h:mm a');
  };

  // Check if shift is on a specific day
  const isShiftOnDay = (shift: Shift, day: Date) => {
    const shiftStart = parseISO(shift.from_time);
    const shiftEnd = parseISO(shift.to_time);
    
    const dayStart = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      0, 0, 0
    );
    
    const dayEnd = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      23, 59, 59
    );
    
    return (
      isWithinInterval(shiftStart, { start: dayStart, end: dayEnd }) ||
      isWithinInterval(shiftEnd, { start: dayStart, end: dayEnd }) ||
      (shiftStart <= dayStart && shiftEnd >= dayEnd)
    );
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  // Navigate to next week
  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  return (
    <div className="w-full">
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm font-medium">
            {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
          </span>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
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
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                {/* Table Header */}
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 bg-white border-r sticky left-0 z-10">Employee</th>
                    {weekDays.map((day, index) => (
                      <th key={index} className="p-2 text-center border-r min-w-[120px]">
                        <div className="font-medium">{format(day, 'EEE')}</div>
                        <div className="text-xs text-gray-500">Jul {format(day, 'd')}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                
                {/* Table Body */}
                <tbody>
                  {partTimeEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-6 text-gray-500">
                        No part-time employees found
                      </td>
                    </tr>
                  ) : (
                    partTimeEmployees.map((employee) => (
                      <tr key={employee.eid} className="border-b hover:bg-gray-50">
                        <td className="p-3 border-r font-medium sticky left-0 bg-white z-10">
                          <div className="font-semibold">{employee.name}</div>
                        </td>
                        
                        {weekDays.map((day, dayIndex) => {
                          // Find shifts for this employee on this day
                          const employeeShifts = shifts.filter(
                            shift => shift.eid === employee.eid && isShiftOnDay(shift, day)
                          );
                          
                          return (
                            <td key={dayIndex} className="p-1 border-r relative min-h-[60px]">
                              {employeeShifts.length > 0 ? (
                                <div className="space-y-1">
                                  {employeeShifts.map(shift => {
                                    // Format time without spaces between time and AM/PM
                                    const fromDateTime = parseISO(shift.from_time);
                                    const toDateTime = parseISO(shift.to_time);
                                    const fromTime = format(fromDateTime, 'h:mm').padStart(4, ' ') + format(fromDateTime, 'a').toLowerCase();
                                    const toTime = format(toDateTime, 'h:mm').padStart(4, ' ') + format(toDateTime, 'a').toLowerCase();
                                    
                                    return (
                                      <div 
                                        key={shift.shift_id}
                                        className="bg-blue-100 text-blue-800 p-2 text-xs rounded-sm"
                                        style={{ backgroundColor: '#e3efff' }}
                                      >
                                        {fromTime} - {toTime}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="h-6"></div> // Empty placeholder for height consistency
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
