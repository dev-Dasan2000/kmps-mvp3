'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { format, addDays, subDays, parseISO, isSameDay } from 'date-fns';
import axios from 'axios';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Dentist {
  dentist_id: string;
  name: string;
  profile_picture?: string;
  work_time_from?: string;
  work_time_to?: string;
}

interface Appointment {
  appointment_id: number;
  patient_id: string;
  dentist_id: string;
  date: string;
  time_from: string;
  time_to: string;
  fee: number;
  note?: string;
  status: string;
  payment_status: string;
  patient?: {
    name: string;
  };
}

interface BlockedDate {
  blocked_date_id: number;
  dentist_id: string;
  date: string;
  time_from: string;
  time_to: string;
}

// Generate time slots from 8:00 AM to 5:00 PM in 30-minute intervals
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour <= 17; hour++) {
    for (let minute of ['00', '30']) {
      // Skip 17:30 as the last appointment is at 17:00 (5:00 PM)
      if (hour === 17 && minute === '30') continue;
      slots.push(`${hour.toString().padStart(2, '0')}:${minute}`);
    }
  }
  return slots;
};

const timeSlots = generateTimeSlots();

export default function AllAppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [doctors, setDoctors] = useState<Dentist[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get(`${backendUrl}/dentists`);
        setDoctors(response.data);
      } catch (err) {
        setError('Failed to fetch doctors');
        console.error('Error fetching doctors:', err);
      }
    };

    fetchDoctors();
  }, []);

  // Fetch appointments and blocked dates for the selected date
  useEffect(() => {
    const fetchAppointmentsAndBlockedDates = async () => {
      try {
        setLoading(true);
        
        // Fetch appointments for all doctors
        const appointmentsPromises = doctors.map(doctor =>
          axios.get(`${backendUrl}/appointments/fordentist/${doctor.dentist_id}`)
        );
        
        // Fetch blocked dates for all doctors
        const blockedDatesPromises = doctors.map(doctor =>
          axios.get(`${backendUrl}/blocked-dates/fordentist/${doctor.dentist_id}`)
        );

        const [appointmentsResponses, blockedDatesResponses] = await Promise.all([
          Promise.all(appointmentsPromises),
          Promise.all(blockedDatesPromises)
        ]);

        // Combine all appointments and blocked dates
        const allAppointments = appointmentsResponses.flatMap(response => response.data);
        const allBlockedDates = blockedDatesResponses.flatMap(response => response.data);

        setAppointments(allAppointments);
        setBlockedDates(allBlockedDates);
        setError(null);
      } catch (err) {
        setError('Failed to fetch schedule data');
        console.error('Error fetching schedule data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (doctors.length > 0) {
      fetchAppointmentsAndBlockedDates();
    }
  }, [doctors, selectedDate]);

  const handlePreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));

  // Helper function to check if a time slot is blocked
  const isTimeBlocked = (doctorId: string, time: string) => {
    return blockedDates.some(blocked => 
      blocked.dentist_id === doctorId &&
      isSameDay(parseISO(blocked.date), selectedDate) &&
      blocked.time_from <= time &&
      blocked.time_to > time
    );
  };

  // Helper function to get appointment for a time slot
  const getAppointment = (doctorId: string, time: string) => {
    return appointments.find(apt => 
      apt.dentist_id === doctorId &&
      isSameDay(parseISO(apt.date), selectedDate) &&
      apt.time_from === time
    );
  };

  if (loading && doctors.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading doctors schedule...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="search"
            placeholder="Search appointments"
            className="pl-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          + Add Appointment
        </Button>
      </div>

      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePreviousDay}
            className="px-2 py-1"
          >
            ←
          </Button>
          <span className="font-medium">{format(selectedDate, 'd MMMM yyyy')}</span>
          <Button
            variant="outline"
            onClick={handleNextDay}
            className="px-2 py-1"
          >
            →
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <select
            className="border rounded-md px-3 py-1"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'day' | 'week')}
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
          </select>
          <Button variant="outline">calendar view ▾</Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="min-w-[1000px]">
          {/* Doctor Headers */}
          <div className="grid grid-cols-[100px_repeat(auto-fit,minmax(150px,1fr))] border-b">
            <div className="p-4 font-medium text-gray-500">Time</div>
            {doctors.map((doctor) => (
              <div key={doctor.dentist_id} className="p-4 text-center border-l">
                <div className="font-medium">{doctor.name}</div>
                {doctor.work_time_from && doctor.work_time_to && (
                  <div className="text-xs text-gray-500">
                    {doctor.work_time_from} - {doctor.work_time_to}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Time Slots */}
          {timeSlots.map((time) => (
            <div key={time} className="grid grid-cols-[100px_repeat(auto-fit,minmax(150px,1fr))] border-b">
              <div className="p-4 font-medium text-gray-500">{time}</div>
              {doctors.map((doctor) => {
                const appointment = getAppointment(doctor.dentist_id, time);
                const isBlocked = isTimeBlocked(doctor.dentist_id, time);

                return (
                  <div key={doctor.dentist_id} className="p-2 border-l min-h-[80px]">
                    <div
                      className={`h-full p-2 rounded ${
                        isBlocked
                          ? 'bg-red-100'
                          : appointment
                          ? appointment.status === 'confirmed'
                            ? 'bg-green-100'
                            : appointment.status === 'pending'
                            ? 'bg-yellow-100'
                            : appointment.status === 'completed'
                            ? 'bg-blue-100'
                            : appointment.status === 'canceled'
                            ? 'bg-gray-100'
                            : 'bg-gray-50'
                          : 'bg-gray-50'
                      }`}
                    >
                      {isBlocked ? (
                        <div className="text-sm text-red-500">Blocked</div>
                      ) : appointment ? (
                        <>
                          <div className="font-medium text-sm">
                            {appointment.patient?.name || 'No patient name'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {appointment.note || 'No details'}
                          </div>
                          <div className="text-xs font-medium mt-1">
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">Available</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}