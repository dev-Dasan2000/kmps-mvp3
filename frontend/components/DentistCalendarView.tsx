'use client';

import { useEffect, useState } from 'react';
import { format, setHours, setMinutes } from 'date-fns';

interface Appointment {
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
}

interface Dentist {
  dentist_id: string;
  name: string;
  appointments?: Appointment[];
}

const WORKING_HOURS = {
  start: 8,   // 8:00 AM
  end: 17.5,  // 5:30 PM
};

const TIME_SLOT_MINUTES = 10;
const ROW_HEIGHT = 24; // Fixed row height in pixels

// Generate precise time slots from 8:00 AM to 5:30 PM in 10-minute intervals
const generateTimeSlots = () => {
  const slots = [];
  const totalMinutes = (WORKING_HOURS.end - WORKING_HOURS.start) * 60;
  const totalSlots = totalMinutes / TIME_SLOT_MINUTES;
  
  for (let i = 0; i <= totalSlots; i++) {
    const hour = Math.floor(WORKING_HOURS.start + (i * TIME_SLOT_MINUTES) / 60);
    const minute = (i * TIME_SLOT_MINUTES) % 60;
    const timeString = format(
      setMinutes(setHours(new Date(), hour), minute), 
      'h:mm a'
    ).toLowerCase();
    slots.push(timeString);
  }
  
  return slots;
};

export default function DentistCalendarView() {
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const timeSlots = generateTimeSlots();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dentistsResponse = await fetch(`${backendUrl}/dentists`);
        if (!dentistsResponse.ok) throw new Error('Failed to fetch dentists');
        const dentistsData = await dentistsResponse.json();
        
        const dentistsWithAppointments = await Promise.all(
          dentistsData.map(async (dentist: Dentist) => {
            try {
              const appointmentsResponse = await fetch(
                `${backendUrl}/appointments/fordentist/${dentist.dentist_id}`
              );
              const appointments = await appointmentsResponse.ok ? await appointmentsResponse.json() : [];
              return {
                ...dentist,
                appointments: Array.isArray(appointments) ? appointments : []
              };
            } catch (error) {
              console.error(`Error fetching appointments for dentist ${dentist.dentist_id}:`, error);
              return { ...dentist, appointments: [] };
            }
          })
        );
        
        setDentists(dentistsWithAppointments);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, backendUrl]);

  const findAppointmentAtTime = (dentist: Dentist, timeSlot: string) => {
    if (!dentist.appointments || dentist.appointments.length === 0) return null;

    const [time, period] = timeSlot.split(' ');
    let [hour, minute] = time.split(':').map(Number);
    
    if (period === 'pm' && hour < 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;

    const slotTime = new Date(selectedDate);
    slotTime.setHours(hour, minute, 0, 0);
    const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');

    return dentist.appointments.find(appointment => {
      const appointmentDate = new Date(appointment.date);
      if (format(appointmentDate, 'yyyy-MM-dd') !== formattedSelectedDate) {
        return false;
      }

      const [startHour, startMinute] = appointment.time_from.split(':').map(Number);
      const appointmentStart = new Date(appointmentDate);
      appointmentStart.setHours(startHour, startMinute, 0, 0);
      
      return slotTime.getTime() === appointmentStart.getTime();
    }) || null;
  };

  const formatTime = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getAppointmentDurationInSlots = (appointment: Appointment) => {
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

  return (
    <div className="w-full overflow-x-auto bg-white rounded-lg shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-3 border-b">
        <h2 className="text-lg font-semibold text-gray-800 mb-2 md:mb-0">
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

      <div className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[80px_repeat(auto-fit,minmax(0,1fr))] gap-0 min-w-max">
          {/* Time slots column */}
          <div className="bg-gray-50 p-0 border-r sticky left-0 z-10 w-[80px]">
            <div className="h-10 flex items-center justify-center font-medium text-gray-700 border-b bg-white">
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
                    className="flex items-center justify-center text-xs text-gray-500 border-b"
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
              className="border-r last:border-r-0 min-w-0"
            >
              <div className="h-10 flex items-center justify-center font-medium text-gray-700 border-b bg-white sticky top-0 z-10">
                <div className="text-center px-1">
                  <div className="font-semibold text-sm truncate" title={dentist.name}>
                    {dentist.name}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {dentist.appointments?.length || 0} {dentist.appointments?.length === 1 ? 'appt' : 'appts'}
                  </div>
                </div>
              </div>
              <div 
                className="grid relative"
                style={{
                  gridTemplateRows: `repeat(${timeSlots.length}, minmax(${ROW_HEIGHT}px, auto))`
                }}
              >
                {timeSlots.map((time, index) => {
                  const appointment = findAppointmentAtTime(dentist, time);
                  const isBooked = !!appointment;
                  const durationInSlots = isBooked ? getAppointmentDurationInSlots(appointment) : 1;
                  const isStartOfAppointment = isBooked && 
                    format(
                      setMinutes(
                        setHours(
                          new Date(appointment.date), 
                          parseInt(appointment.time_from.split(':')[0])
                        ), 
                        parseInt(appointment.time_from.split(':')[1])
                      ), 
                      'h:mm a'
                    ).toLowerCase() === time.toLowerCase();

                  if (isBooked && !isStartOfAppointment) {
                    return null;
                  }

                  return (
                    <div 
                      key={`${dentist.dentist_id}-${time}-${index}`}
                      className={`relative ${isBooked ? 'z-10' : ''}`}
                      style={{
                        gridRow: isBooked ? `span ${durationInSlots}` : 'auto',
                        height: isBooked ? '100%' : `${ROW_HEIGHT}px`,
                      }}
                    >
                      {isBooked ? (
                        <div className="h-full bg-blue-100 border-l-4 border-blue-500 p-2 flex flex-col justify-center overflow-hidden">
                          <div className="text-sm font-medium text-blue-800 truncate" title={appointment.patient?.name || 'Appointment'}>
                            {appointment.patient?.name || 'Appointment'}
                          </div>
                          <div className="text-xs text-blue-600 whitespace-nowrap">
                            {formatTime(appointment.time_from)} - {formatTime(appointment.time_to)}
                          </div>
                          {appointment.status && (
                            <div className="absolute bottom-1 right-1 text-[10px] px-1 rounded bg-blue-200 text-blue-800">
                              {appointment.status}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-full w-full border-b hover:bg-gray-50" />
                      )}
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