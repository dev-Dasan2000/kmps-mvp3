"use client";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Shift schedule interface
interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  staff_count: number;
  group?: string;
}

interface ShiftScheduleProps {
  shifts?: Shift[];
  loading?: boolean;
}

export default function ShiftSchedule({ shifts, loading = false }: ShiftScheduleProps) {
  const defaultShifts: Shift[] = [
    {
      id: 1,
      name: "Morning Shift",
      start_time: "08:00",
      end_time: "16:00",
      staff_count: 8,
      group: "General"
    },
    {
      id: 2,
      name: "Afternoon Shift",
      start_time: "12:00",
      end_time: "20:00",
      staff_count: 5,
      group: "Emergency"
    },
    {
      id: 3,
      name: "Evening Shift",
      start_time: "16:00",
      end_time: "24:00",
      staff_count: 3,
      group: "Critical Care"
    },
    {
      id: 4,
      name: "Night Shift",
      start_time: "00:00",
      end_time: "08:00",
      staff_count: 2,
      group: "Emergency"
    }
  ];

  const [activeShifts, setActiveShifts] = useState<Shift[]>(shifts || defaultShifts);

  // Format time in 12-hour format
  const formatTime = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const meridiem = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${meridiem}`;
  };

  // Count active shifts (current time-based logic would be more complex in production)
  const currentlyActiveCount = activeShifts.filter(shift => 
    shift.name !== "Night Shift"
  ).length;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Shift Schedule</h2>
        <Button size="sm" variant="outline">
          <span className="mr-2">+ Add Shift</span>
        </Button>
      </div>

      <div className="mb-6">
        <Card className="hover:shadow-md transition-shadow mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-emerald-500 rounded-md p-3 mr-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Active Shifts</CardTitle>
                <CardDescription>Currently active</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {loading ? "..." : currentlyActiveCount}
            </div>
            <div className="mt-4 space-y-2">
              <p className="font-medium">Morning: {activeShifts[0]?.staff_count || 0} staff</p>
              <p className="font-medium">Afternoon: {activeShifts[1]?.staff_count || 0} staff</p>
              <p className="font-medium">Evening: {activeShifts[2]?.staff_count || 0} staff</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {activeShifts.map(shift => (
        <Card key={shift.id} className="mb-4 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{shift.name}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-2" />
                  {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                </CardDescription>
              </div>
              <Badge className="text-sm">{shift.staff_count} staff</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-gray-500">
              <Users className="h-4 w-4 mr-2" />
              <span>{shift.group}</span>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-center mt-6">
        <Button variant="outline" className="text-blue-600">
          <Calendar className="h-4 w-4 mr-2" />
          Manage Roster
        </Button>
      </div>
    </div>
  );
}
