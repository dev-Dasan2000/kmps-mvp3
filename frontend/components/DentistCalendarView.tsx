'use client';

import { useEffect, useState } from 'react';
import { format, setHours, setMinutes } from 'date-fns';

interface BaseAppointment {
  appointment_id: number;
  dentist_id: string;
  patient_id: string;
  date: string;
  time_from: string;
  time_to: string;
  status?: string;
  patient?: {
    name: string;
  };
  isBlocked?: boolean;
  isContinuation?: boolean;
  reason?: string;
}

interface Appointment extends BaseAppointment {
  isBlocked?: false;
  isContinuation?: false;
}

interface BlockedSlot extends Omit<BaseAppointment, 'appointment_id' | 'patient_id'> {
  blocked_date_id: number;
  isBlocked: true;
  isContinuation?: boolean;
  reason?: string;
}

type CalendarSlot = Appointment | BlockedSlot | { isBlocked: true; isContinuation: true };

interface BlockedDate {
  blocked_date_id: number;
  dentist_id: string;
  date: string; // Format: 'YYYY-MM-DD'
  time_from: string; // Format: 'HH:MM'
  time_to: string;   // Format: 'HH:MM'
  reason?: string;
}

interface Dentist {
  dentist_id: string;
  name: string;
  appointments?: Appointment[];
  blockedSlots?: BlockedDate[];
}

const WORKING_HOURS = {
  start: 8,   // 8:00 AM
  end: 17.5,  // 5:30 PM
};

const TIME_SLOT_MINUTES = 10;
const ROW_HEIGHT = 48; // Increased row height to match the design

// Generate precise time slots from 8:00 AM to 5:30 PM in 10-minute intervals
const generateTimeSlots = () => {
  const slots = [];
  const startHour = WORKING_HOURS.start; // 8:00 AM
  const endHour = WORKING_HOURS.end;     // 5:30 PM
  
  // Calculate total minutes from start to end time
  const totalMinutes = (endHour - startHour) * 60;
  const totalSlots = Math.ceil(totalMinutes / TIME_SLOT_MINUTES);
  
  for (let i = 0; i <= totalSlots; i++) {
    const minutesFromStart = i * TIME_SLOT_MINUTES;
    const hour = Math.floor(startHour + Math.floor(minutesFromStart / 60));
    const minute = minutesFromStart % 60;
    
    // Create a date object at the start of the day
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    
    // Add the calculated hours and minutes
    date.setHours(hour, minute, 0, 0);
    
    // Format the time
    const timeString = format(date, 'h:mm a').toLowerCase();
    slots.push(timeString);
  }
  
  return slots;
};

export default function DentistCalendarView() {
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const timeSlots = generateTimeSlots();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        
        // Fetch all necessary data in parallel
        const [dentistsResponse, blockedDatesResponse] = await Promise.all([
          fetch(`${backendUrl}/dentists`),
          fetch(`${backendUrl}/blocked-dates`)
        ]);

        if (!dentistsResponse.ok) throw new Error('Failed to fetch dentists');
        
        const [dentistsData, blockedDatesData] = await Promise.all([
          dentistsResponse.json(),
          blockedDatesResponse.ok ? blockedDatesResponse.json() : []
        ]);

        // Fetch appointments for each dentist
        const dentistsWithData = await Promise.all(
          dentistsData.map(async (dentist: Dentist) => {
            try {
              // Fetch appointments for the dentist
              const appointmentsResponse = await fetch(
                `${backendUrl}/appointments/fordentist/${dentist.dentist_id}`
              );
              
              // Fetch blocked dates specifically for this dentist
              const blockedDatesResponse = await fetch(
                `${backendUrl}/blocked-dates/fordentist/${dentist.dentist_id}`
              );
              
              const appointments = appointmentsResponse.ok 
                ? await appointmentsResponse.json() 
                : [];

              const blockedSlots = blockedDatesResponse.ok
                ? await blockedDatesResponse.json()
                : [];

              // Filter appointments and blocked slots for the selected date
              const filteredAppointments = appointments.filter((appt: Appointment) => {
                const appointmentDate = new Date(appt.date);
                return format(appointmentDate, 'yyyy-MM-dd') === formattedDate;
              });
              
              const filteredBlockedSlots = blockedSlots.filter((blocked: BlockedDate) => {
                return blocked.date === formattedDate;
              });
              
              return {
                ...dentist,
                appointments: filteredAppointments,
                blockedSlots: filteredBlockedSlots
              };
            } catch (error) {
              console.error(`Error fetching data for dentist ${dentist.dentist_id}:`, error);
              return { 
                ...dentist, 
                appointments: [], 
                blockedSlots: [] 
              };
            }
          })
        );
        
        setDentists(dentistsWithData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, backendUrl]);

  // Parse 12-hour time string (e.g., '3:30 pm') to minutes since midnight
  const parseTimeToMinutes = (timeStr: string, period: string): number => {
    let [hours, minutes = 0] = timeStr.split(':').map(Number);
    
    // Convert 12-hour to 24-hour format
    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    
    return hours * 60 + minutes;
  };

  // Convert 24-hour time string (e.g., '15:30') to minutes since midnight
  const time24ToMinutes = (time24: string): number => {
    const [hours, minutes = 0] = time24.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Check if a time in minutes falls within a given range
  const isTimeInRange = (timeMinutes: number, startTimeStr: string, endTimeStr: string): boolean => {
    const startMinutes = time24ToMinutes(startTimeStr);
    const endMinutes = time24ToMinutes(endTimeStr);
    
    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  };
  


  const findAppointmentAtTime = (dentist: Dentist, timeSlot: string, slotIndex: number): CalendarSlot | null => {
    // Parse the time slot (e.g., '3:30 pm')
    const [time, period] = timeSlot.split(' ');
    const slotTimeMinutes = parseTimeToMinutes(time, period);
    const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');
    
    // Calculate the next slot's time to determine the end of this slot
    const nextSlotMinutes = slotTimeMinutes + TIME_SLOT_MINUTES;
    
    // Check for blocked slots first
    if (dentist.blockedSlots && dentist.blockedSlots.length > 0) {
      for (const blocked of dentist.blockedSlots) {
        if (blocked.date !== formattedSelectedDate) continue;
        
        const blockedStartMinutes = time24ToMinutes(blocked.time_from);
        const blockedEndMinutes = time24ToMinutes(blocked.time_to);
        
        // Check if this time slot is within the blocked period
        if (slotTimeMinutes >= blockedStartMinutes && slotTimeMinutes < blockedEndMinutes) {
          // If this is the first slot of the blocked period, return the blocked slot
          if (slotTimeMinutes === blockedStartMinutes) {
            return { ...blocked, isBlocked: true };
          }
          // For subsequent slots in the blocked period, return a continuation
          return { isBlocked: true, isContinuation: true };
        }
      }
    }



    // Check for appointments
    if (dentist.appointments && dentist.appointments.length > 0) {
      const appointment = dentist.appointments.find(appt => {
        const appointmentDate = new Date(appt.date);
        if (format(appointmentDate, 'yyyy-MM-dd') !== formattedSelectedDate) {
          return false;
        }

        const [apptHour, apptMinute] = appt.time_from.split(':').map(Number);
        const apptTimeMinutes = apptHour * 60 + apptMinute;
        
        // Check if this slot's start time matches the appointment's start time
        return Math.abs(slotTimeMinutes - apptTimeMinutes) < TIME_SLOT_MINUTES;
      });

      if (appointment) {
        return appointment;
      }
    }

    return null;
  };

  // Format 24-hour time to 12-hour format with period (e.g., '15:30' -> '3:30 pm')
  const formatTime = (time24: string): string => {
    const [hours, minutes = 0] = time24.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    return format(date, 'h:mm a').toLowerCase();
  };

  const getAppointmentDurationInSlots = (appointment: Appointment | BlockedSlot) => {
    if (!appointment) return 1;
    
    const [startHour, startMinute] = appointment.time_from.split(':').map(Number);
    const [endHour, endMinute] = appointment.time_to.split(':').map(Number);
    
    const start = new Date(selectedDate);
    start.setHours(startHour, startMinute, 0, 0);
    
    const end = new Date(selectedDate);
    end.setHours(endHour, endMinute, 0, 0);
    
    const durationInMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return Math.max(1, Math.round(durationInMinutes / TIME_SLOT_MINUTES));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Helper function to render time slot content
  const renderTimeSlot = (slot: CalendarSlot | null, isBooked: boolean, isBlocked: boolean) => {
    // If no slot, render an empty available slot
    if (!slot) {
      return (
        <div className="h-full w-full border-b hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center">
          <span className="text-sm font-medium text-gray-400">Available</span>
        </div>
      );
    }
    if (isBlocked && slot && 'time_from' in slot && 'time_to' in slot) {
      return (
        <div className="h-full rounded-md m-0 p-2 flex flex-col justify-center overflow-hidden bg-red-50 border border-red-200 cursor-not-allowed">
          <div className="text-sm font-semibold text-red-800">Blocked</div>
          <div className="text-xs text-red-600 mt-1">
            {formatTime(slot.time_from)} - {formatTime(slot.time_to)}
          </div>
          {slot.reason && (
            <div className="text-xs text-red-500 truncate" title={slot.reason}>
              {slot.reason}
            </div>
          )}
        </div>
      );
    }

    if (isBooked && slot && 'time_from' in slot && 'time_to' in slot) {
      return (
        <div className="h-full rounded-md m-0 p-2 flex flex-col justify-center overflow-hidden bg-green-50 border border-green-200">
          <div className="text-sm font-semibold text-green-800">
            {slot.patient?.name || 'Patient'}
          </div>
          <div className="text-xs text-green-600 mt-1">
            {slot.status || 'Booked'}
          </div>
          <div className="text-xs text-green-600">
            {formatTime(slot.time_from)} - {formatTime(slot.time_to)}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full overflow-x-auto bg-white rounded-lg shadow">
      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border-b bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-800 mb-2 md:mb-0">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setSelectedDate(prev => {
              const newDate = new Date(prev);
              newDate.setDate(prev.getDate() - 1);
              return newDate;
            })}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Previous day"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={() => setSelectedDate(new Date())}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Today
          </button>
          <button 
            onClick={() => setSelectedDate(prev => {
              const newDate = new Date(prev);
              newDate.setDate(prev.getDate() + 1);
              return newDate;
            })}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Next day"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Body */}
      <div className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[100px_repeat(auto-fit,minmax(0,1fr))] gap-0 min-w-max">
          {/* Time slots column */}
          <div className="bg-gray-50 p-0 border-r sticky left-0 z-10 w-[100px]">
            <div className="h-12 flex items-center justify-center font-semibold text-gray-700 border-b bg-white">
              Time
            </div>
            <div 
              className="grid"
              style={{
                gridTemplateRows: `repeat(${timeSlots.length}, minmax(${ROW_HEIGHT}px, auto))`
              }}
            >
              {timeSlots.map((time, index) => {
                const showTime = index % 3 === 0;
                return (
                  <div 
                    key={`time-${index}`} 
                    className="flex items-center justify-center text-sm font-medium text-gray-600 border-b"
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    {showTime ? time : ''}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dentists columns */}
          {dentists.map(dentist => (
            <div 
              key={dentist.dentist_id} 
              className="border-r last:border-r-0 min-w-[160px]"
            >
              <div className="h-12 flex items-center justify-center font-semibold text-gray-700 border-b bg-white sticky top-0 z-10">
                <div className="text-center px-2">
                  <div className="font-semibold text-sm truncate" title={dentist.name}>
                    {dentist.name}
                  </div>
                </div>
              </div>
              <div 
                className="grid relative"
                style={{
                  gridTemplateRows: `repeat(${timeSlots.length}, minmax(${ROW_HEIGHT}px, auto))`
                }}
              >
                {timeSlots.map((timeSlot, slotIndex) => {
                  const slot = findAppointmentAtTime(dentist, timeSlot, slotIndex);
                  
                  // Skip rendering if this is a continuation of a blocked slot
                  if (slot?.isBlocked && slot?.isContinuation) {
                    return null;
                  }
                  
                  const isBooked = slot && !slot.isBlocked;
                  const isBlocked = slot?.isBlocked;
                  
                  // Calculate duration in slots for both booked and blocked slots
                  let durationInSlots = 1;
                  
                  if ((isBooked || isBlocked) && slot && 'time_from' in slot && 'time_to' in slot) {
                    const startMinutes = time24ToMinutes(slot.time_from);
                    const endMinutes = time24ToMinutes(slot.time_to);
                    const slotStartMinutes = parseTimeToMinutes(timeSlot.split(' ')[0], timeSlot.split(' ')[1]);
                    
                    // Calculate duration in slots (minimum 1 slot)
                    durationInSlots = Math.max(1, Math.ceil((endMinutes - startMinutes) / TIME_SLOT_MINUTES));
                    
                    // Only render if this is the first slot of the block
                    if (Math.abs(slotStartMinutes - startMinutes) < TIME_SLOT_MINUTES) {
                      return (
                        <div 
                          key={`${dentist.dentist_id}-${timeSlot}-${slotIndex}`}
                          className={`relative ${isBlocked ? 'z-10' : 'z-5'}`}
                          style={{
                            gridRow: `span ${durationInSlots}`,
                            height: '100%',
                          }}
                        >
                          {renderTimeSlot(slot, isBooked, isBlocked)}
                        </div>
                      );
                    }
                    return null;
                  }

                  // Render empty slot if no booking or block
                  return (
                    <div 
                      key={`${dentist.dentist_id}-${timeSlot}-${slotIndex}`}
                      className="relative"
                      style={{
                        height: `${ROW_HEIGHT}px`,
                      }}
                    >
                      {renderTimeSlot(null, false, false)}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}