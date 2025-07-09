'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Dentist[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firstMatchRef, setFirstMatchRef] = useState<string | null>(null);
  // Add a new state to track highlighted appointment
  const [highlightedAppointmentId, setHighlightedAppointmentId] = useState<number | null>(null);
  // Add state to track current match index and all matches
  const [matchingAppointments, setMatchingAppointments] = useState<Appointment[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1);

  // Simplified match checking function
  const matchesSearch = (appointment: Appointment | undefined) => {
    if (!appointment || !searchQuery) return false;
    const searchLower = searchQuery.toLowerCase();
    return (
      (appointment.patient?.name?.toLowerCase().includes(searchLower) || false) ||
      (appointment.note?.toLowerCase().includes(searchLower) || false)
    );
  };

  // Reset highlighted appointment when search query changes
  useEffect(() => {
    setHighlightedAppointmentId(null);
    setMatchingAppointments([]);
    setCurrentMatchIndex(-1);
  }, [searchQuery]);

  // Find all matching appointments
  const findAllMatches = () => {
    if (!searchQuery) return [];
    
    const matches = appointments.filter(apt => 
      (apt.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (apt.note?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    );
    
    return matches;
  };

  // Simplified search handler with cycling through matches
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery) {
      // If we don't have matches yet or search changed, find all matches
      if (matchingAppointments.length === 0) {
        const matches = findAllMatches();
        setMatchingAppointments(matches);
        
        if (matches.length > 0) {
          // Start with the first match
          setCurrentMatchIndex(0);
          setHighlightedAppointmentId(matches[0].appointment_id);
          scrollToAppointment(matches[0]);
        } else {
          console.log('No matching appointments found');
        }
      } else {
        // We already have matches, move to the next one
        const nextIndex = (currentMatchIndex + 1) % matchingAppointments.length;
        setCurrentMatchIndex(nextIndex);
        setHighlightedAppointmentId(matchingAppointments[nextIndex].appointment_id);
        scrollToAppointment(matchingAppointments[nextIndex]);
      }
    }
  };

  // Function to scroll to a specific appointment
  const scrollToAppointment = (appointment: Appointment) => {
    setTimeout(() => {
      // Check if we're in desktop view
      const isDesktopView = window.innerWidth >= 768; // md breakpoint
      console.log('Is desktop view:', isDesktopView);
      
      // Get the correct element based on the view
      let elementToScroll = null;
      
      if (isDesktopView) {
        // In desktop view, find the element in the desktop container
        const desktopElement = document.querySelector(`.calendar-container [data-appointment-id="${appointment.appointment_id}"]`);
        console.log('Found desktop element:', !!desktopElement);
        elementToScroll = desktopElement;
        
        // Handle horizontal scrolling for desktop view
        if (desktopElement) {
          const container = document.querySelector('.calendar-container');
          if (container) {
            const elementRect = desktopElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            container.scrollLeft = elementRect.left - containerRect.left + container.scrollLeft - 100;
          }
        }
      } else {
        // In mobile view, find the element in the mobile container
        const mobileElement = document.querySelector(`.md\\:hidden [data-appointment-id="${appointment.appointment_id}"]`);
        console.log('Found mobile element:', !!mobileElement);
        elementToScroll = mobileElement;
      }
      
      if (elementToScroll) {
        // Scroll to the element
        elementToScroll.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add highlight effect
        elementToScroll.classList.add('flash-highlight');
        setTimeout(() => {
          elementToScroll.classList.remove('flash-highlight');
        }, 2000);
      }
    }, 100);
  };

  // Add this useEffect to log appointments for debugging
  useEffect(() => {
    if (appointments.length > 0) {
      console.log('Total appointments loaded:', appointments.length);
    }
  }, [appointments]);

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

  // Add this helper function to format the time
  const formatTimeRange = (timeFrom: string, timeTo: string) => {
    return `${timeFrom} - ${timeTo}`;
  };

  // Update the mobile view to use data-appointment-id
  const MobileScheduleView = ({ doctor }: { doctor: Dentist }) => (
    <div className="space-y-4">
      <div className="font-medium text-lg py-2 px-4 bg-gray-50 rounded-lg">
        {doctor.name}
        {doctor.work_time_from && doctor.work_time_to && (
          <span className="text-sm text-gray-500 ml-2">
            ({doctor.work_time_from} - {doctor.work_time_to})
          </span>
        )}
      </div>
      <div className="space-y-2">
        {timeSlots.map((time) => {
          const appointment = getAppointment(doctor.dentist_id, time);
          const isBlocked = isTimeBlocked(doctor.dentist_id, time);
          const isHighlighted = appointment && highlightedAppointmentId === appointment.appointment_id;

          if (!appointment && !isBlocked) return null; // Skip empty slots on mobile

          return (
            <div 
              key={time} 
              data-appointment-id={appointment?.appointment_id}
              data-time={time}
              className={`bg-white rounded-lg shadow p-4 ${isHighlighted ? 'flash-highlight' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="font-medium text-gray-600">{time}</span>
                  {appointment && (
                    <div className="text-sm text-gray-500">
                      {formatTimeRange(appointment.time_from, appointment.time_to)}
                    </div>
                  )}
                </div>
                <div
                  className={`px-2 py-1 rounded text-sm ${
                    isBlocked
                      ? 'bg-red-100 text-red-800'
                      : appointment
                      ? matchesSearch(appointment)
                        ? 'bg-purple-100 text-purple-800'
                        : appointment.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : appointment.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {isBlocked ? 'Blocked' : appointment?.status.charAt(0).toUpperCase() + appointment?.status.slice(1)}
                </div>
              </div>
              {appointment && (
                <div className="mt-2">
                  <div className="font-medium">{appointment.patient?.name || 'No patient name'}</div>
                  <div className="text-sm text-gray-500">{appointment.note || 'No details'}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

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
      <div className="flex justify-center w-full mb-6">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="search"
            placeholder={matchingAppointments.length > 0 
              ? `Found ${matchingAppointments.length} matches. Press Enter to cycle (${currentMatchIndex + 1}/${matchingAppointments.length})` 
              : "Search appointments by patient name or description"}
            className="pl-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      {/* Style for flash highlight effect */}
      <style jsx global>{`
        @keyframes flashHighlight {
          0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
        }
        .flash-highlight {
          animation: flashHighlight 2s ease-out;
          border: 2px solid #8b5cf6;
        }
      `}</style>

      {/* Calendar Controls - Centered */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col gap-4">
          {/* Mobile doctor selector */}
          <div className="md:hidden w-full">
            <div className="mx-auto w-full">
              <select
                className="w-full p-3 text-base bg-white border border-gray-200 rounded-lg focus:outline-none appearance-none"
                value={selectedDoctor || ''}
                onChange={(e) => setSelectedDoctor(e.target.value || null)}
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1em'
                }}
              >
                <option value="">All Doctors</option>
                {doctors.map((doctor) => (
                  <option key={doctor.dentist_id} value={doctor.dentist_id}>
                    {doctor.name.length > 20 ? `${doctor.name.substring(0, 20)}...` : doctor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Centered Date Navigation */}
          <div className="flex justify-center items-center gap-2">
            <Button
              variant="outline"
              onClick={handlePreviousDay}
              className="px-2 py-1"
            >
              ←
            </Button>
            <span className="font-medium text-lg min-w-[150px] text-center">
              {format(selectedDate, 'd MMMM yyyy')}
            </span>
            <Button
              variant="outline"
              onClick={handleNextDay}
              className="px-2 py-1"
            >
              →
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        {doctors.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No doctors available
          </div>
        ) : selectedDoctor ? (
          (() => {
            const doctor = doctors.find(d => d.dentist_id === selectedDoctor);
            if (!doctor) {
              return (
                <div className="text-center text-gray-500 py-4">
                  Selected doctor not found
                </div>
              );
            }
            return <MobileScheduleView doctor={doctor} />;
          })()
        ) : (
          <div className="space-y-6">
            {doctors.map((doctor) => (
              <MobileScheduleView key={doctor.dentist_id} doctor={doctor} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Calendar Grid */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto calendar-container">
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
                const isHighlighted = appointment && highlightedAppointmentId === appointment.appointment_id;

                return (
                  <div key={doctor.dentist_id} className="p-2 border-l min-h-[80px]">
                    <div
                      data-appointment-id={appointment?.appointment_id}
                      data-time={time}
                      className={`h-full p-2 rounded ${
                        isBlocked
                          ? 'bg-red-100'
                          : appointment
                          ? matchesSearch(appointment)
                            ? 'bg-purple-100 ring-2 ring-purple-400'
                            : appointment.status === 'confirmed'
                            ? 'bg-green-100'
                            : appointment.status === 'pending'
                            ? 'bg-yellow-100'
                            : appointment.status === 'completed'
                            ? 'bg-blue-100'
                            : appointment.status === 'canceled'
                            ? 'bg-gray-100'
                            : 'bg-gray-50'
                          : 'bg-gray-50'
                      } ${isHighlighted ? 'flash-highlight' : ''}`}
                    >
                      {isBlocked ? (
                        <div className="text-sm text-red-500">Blocked</div>
                      ) : appointment ? (
                        <>
                          <div className="font-medium text-sm">
                            {appointment.patient?.name || 'No patient name'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatTimeRange(appointment.time_from, appointment.time_to)}
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