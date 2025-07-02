"use client";

import { useParams, useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { AuthContext } from '@/context/auth-context';
import { toast } from "sonner";
import axios from "axios";
import CustomCalendar from "@/components/CustomCalendar"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Dentist {
  dentist_id: string;
  email: string;
  name: string;
  profile_picture: string;
  phone_number: string;
  language: string;
  service_types: string;
  work_days_from: string;
  work_days_to: string;
  work_time_from: string;
  work_time_to: string;
  appointment_duration: string;
  appointment_fee: number;
}

interface Service {
  service_id: string;
  service: string;
  description: string;
}

interface Appointment {
  appointment_id: string;
  patient_id: string;
  dentist_id: string;
  date: string;
  time_from: string;
  time_to: string;
  note?: string;
}

interface BlockedDate {
  blocked_date_id: string;
  dentist_id: string;
  date: string;
  time_from: string;
  time_to: string;
}

export default function DentistBookingPage() {
  const { user, isLoadingAuth } = useContext(AuthContext);
  const { dentist_id } = useParams();
  const [dentist, setDentist] = useState<Dentist | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [currentAppointments, setCurrentAppointments] = useState<Appointment[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const router = useRouter();
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;



  const bookedDates = useMemo(() => {
    return currentAppointments.map(app => new Date(app.date));
  }, [currentAppointments]);

  const fetchDentist = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${backendURL}/dentists/${dentist_id}`
      );
      if (response.data) {
        setDentist(response.data);
      }
    }
    catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to fetch dentist details"
      });
    }
    finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${backendURL}/appointments/fordentist/${dentist?.dentist_id}`,
      );
      if (response.data) {
        setCurrentAppointments(response.data);
      }
    }
    catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to fetch current appointments"
      });
    }
    finally {
      setIsLoading(false);
    }
  };

  const fetchBlockedDates = async () => {
    try {
      const response = await axios.get(
        `${backendURL}/blocked-dates/fordentist/${dentist_id}`
      );
      if (response.status == 500) {
        throw new Error("Error fetching blocked dates");
      }
      setBlockedDates(response.data);
    }
    catch (err: any) {
      toast.error("Error", {
        description: err.message || "Failed to fetch blocked dates"
      });
    }
  }

  const pad = (n: number) => n.toString().padStart(2, '0');

  const isTimeSlotAvailable = (date: Date | undefined, timeSlot: string): boolean => {
    if (!dentist || !date) return false;

    const [hours, minutes] = timeSlot.split(':').map(Number);
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    const slotStart = new Date(year, month, day, hours, minutes, 0, 0);
    const duration = parseInt(dentist.appointment_duration || '0');
    const slotEnd = new Date(slotStart.getTime() + duration * 60000);

    // Check against appointments
    const dateStr = date.toISOString().split('T')[0];
    const sameDayAppointments = currentAppointments.filter(app => app.date === dateStr);

    for (const app of sameDayAppointments) {
      const [appStartH, appStartM] = app.time_from.split(':').map(Number);
      const [appEndH, appEndM] = app.time_to.split(':').map(Number);
      const appStart = new Date(year, month, day, appStartH, appStartM);
      const appEnd = new Date(year, month, day, appEndH, appEndM);

      if (slotStart < appEnd && slotEnd > appStart) return false;
    }

    // Check against blocked dates
    const sameDayBlocks = blockedDates.filter(b => b.date === dateStr);
    for (const block of sameDayBlocks) {
      const [blockStartH, blockStartM] = block.time_from.split(':').map(Number);
      const [blockEndH, blockEndM] = block.time_to.split(':').map(Number);
      const blockStart = new Date(year, month, day, blockStartH, blockStartM);
      const blockEnd = new Date(year, month, day, blockEndH, blockEndM);

      if (slotStart < blockEnd && slotEnd > blockStart) return false;
    }

    // Check if within working hours
    const [workStartH, workStartM] = dentist.work_time_from.split(':').map(Number);
    const [workEndH, workEndM] = dentist.work_time_to.split(':').map(Number);
    const workStart = new Date(year, month, day, workStartH, workStartM);
    const workEnd = new Date(year, month, day, workEndH, workEndM);

    if (slotStart < workStart || slotEnd > workEnd) return false;

    return true;
  };

  const isTimeSlotBooked = (date: Date | undefined, timeSlot: string): boolean => {
    if (!date) return false;
  
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
  
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotTime = `${pad(hours)}:${pad(minutes)}`;
  
    // Filter appointments for the selected date only
    const appointmentsForDate = currentAppointments.filter(app => {
      if (!app.date || !app.patient_id) return false;
  
      const appDate = new Date(app.date);
      if (isNaN(appDate.getTime())) return false; // prevent invalid Date
  
      appDate.setHours(0, 0, 0, 0);
      const appDateStr = appDate.toISOString().split('T')[0];
  
      return appDateStr === selectedDateStr;
    });
  
    return appointmentsForDate.some(app => app.time_from === slotTime);
  };
  

  const isTimeSlotBookedByUser = (date: Date | undefined, timeSlot: string): boolean => {
    try {
      if (!date || !user || isNaN(date.getTime())) return false;

      const selectedDate = new Date(date);
      if (isNaN(selectedDate.getTime())) return false;

      selectedDate.setHours(0, 0, 0, 0);
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      if (!selectedDateStr) return false;

      const timeParts = timeSlot.split(':');
      if (timeParts.length < 2) return false;

      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      if (isNaN(hours) || isNaN(minutes)) return false;

      const slotTime = `${pad(hours)}:${pad(minutes)}`;

      // Filter appointments for the selected date only
      const appointmentsForDate = currentAppointments.filter(app => {
        const appDate = new Date(app.date);
        if (isNaN(appDate.getTime())) return false;

        appDate.setHours(0, 0, 0, 0);
        const appDateStr = appDate.toISOString().split('T')[0];
        console.log(appDateStr === selectedDateStr && app.patient_id)
        return appDateStr === selectedDateStr && app.patient_id;
      });

      return appointmentsForDate.some(app =>
        app.time_from === slotTime &&
        app.patient_id === user.id
      );
    } catch (error) {
      console.error('Error in isTimeSlotBookedByUser:', error);
      return false;
    }
  };

  const isPastTimeSlot = (date: Date | undefined, timeSlot: string): boolean => {
    if (!date) return true;

    const now = new Date();
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hours, minutes, 0, 0);

    return slotDateTime < now;
  };

  const getTimeSlotState = (date: Date | undefined, timeSlot: string): 'available' | 'booked' | 'blocked' | 'user-booked' => {
    if (!date || isNaN(date.getTime())) return 'blocked';

    if (isPastTimeSlot(date, timeSlot)) return 'blocked';

    if (isTimeSlotBookedByUser(date, timeSlot)) return 'user-booked';

    if (isTimeSlotBooked(date, timeSlot)) return 'booked';

    if (!isTimeSlotAvailable(date, timeSlot)) return 'blocked';

    return 'available';
  };


  const handleNoteSubmit = async (shouldBook: boolean) => {
    setIsNoteDialogOpen(false);
    if (shouldBook) {
      await processBooking();
    }
  };

  const handleConfirmBooking = () => {
    if (!selectedDate || !selectedTime || !dentist?.dentist_id || !user?.id) {
      toast.error("Missing Information", {
        description: "Please select a date and time for your appointment."
      });
      return;
    }

    // Check if selected date is in the past
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const selectedDateCopy = new Date(selectedDate);
    selectedDateCopy.setHours(0, 0, 0, 0);

    if (selectedDateCopy < now) {
      toast.error("Invalid Date", {
        description: "Cannot book appointments in the past."
      });
      return;
    }

    // Check if time slot is still available
    if (!isTimeSlotAvailable(selectedDate, selectedTime)) {
      toast.error("Time Slot Unavailable", {
        description: "This time slot is no longer available. Please select another time."
      });
      return;
    }

    // Open note dialog
    setIsNoteDialogOpen(true);
  };

  const processBooking = async () => {
    try {
      setIsLoading(true);
      if (!selectedDate || !selectedTime || !dentist || !user) {
        throw new Error("Missing required booking information");
      }

      // Create a date string that preserves the selected date regardless of timezone
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`; // YYYY-MM-DD

      const [hours, minutes] = selectedTime.split(':').map(Number);
      const timeFromStr = `${pad(hours)}:${pad(minutes)}`;

      const durationMatch = dentist.appointment_duration.match(/\d+/);
      const durationInMinutes = durationMatch ? parseInt(durationMatch[0]) : 0;

      if (durationInMinutes === 0) {
        toast.error("Invalid Duration", {
          description: "Invalid appointment duration. Please contact support."
        });
        return;
      }

      // Calculate end time using the selected date components
      const endTime = new Date(year, selectedDate.getMonth(), selectedDate.getDate(), hours, minutes + durationInMinutes);
      const timeToStr = `${pad(endTime.getHours())}:${pad(endTime.getMinutes())}`;

      const response = await axios.post(
        `${backendURL}/appointments`,
        {
          patient_id: user.id,
          dentist_id: dentist_id,
          date: dateStr,
          time_from: timeFromStr,
          time_to: timeToStr,
          fee: dentist.appointment_fee,
          note: note || undefined,
          status: "pending",
          payment_status: "not-paid"
        }
      );

      if (response.status === 201) {
        toast.success("Success", {
          description: "Your appointment has been booked successfully!"
        });
        setNote('');
        setSelectedTime(null);
        setSelectedDate(new Date());
        fetchCurrentAppointments();
      } else {
        throw new Error(response.data.error || "Failed to book appointment");
      }
    } catch (error: any) {
      toast.error("Booking Failed", {
        description: error.message || "Failed to book appointment. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateTimeSlots = (
    startTime: string, // HH:MM:SS
    endTime: string,   // HH:MM:SS
    interval: number   // in minutes
  ): string[] => {
    const slots: string[] = [];

    // Parse start and end times
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    let currentHours = startHours;
    let currentMinutes = startMinutes;

    while (currentHours < endHours || (currentHours === endHours && currentMinutes < endMinutes)) {
      slots.push(`${pad(currentHours)}:${pad(currentMinutes)}`);

      // Increment by interval
      currentMinutes += interval;
      if (currentMinutes >= 60) {
        currentHours += Math.floor(currentMinutes / 60);
        currentMinutes = currentMinutes % 60;
      }
    }

    return slots;
  };

  const timeSlots = dentist
    ? generateTimeSlots(
      dentist.work_time_from,
      dentist.work_time_to,
      parseInt(dentist.appointment_duration)
    ) : [];

  useEffect(() => {
    fetchDentist();
  }, [dentist_id]);

  useEffect(() => {
    if (dentist) {
      fetchCurrentAppointments();
      fetchBlockedDates();
    }
  }, [dentist]);

  useEffect(() => {
    if (isLoadingAuth) return;

    if (user == null) {
      toast.error("Please log in to book an appointment", {
        description: "You must be logged in to book an appointment.",
      });

      router.push("/");
    }
  }, [user, isLoadingAuth]);


  if (!dentist) {
    return <p className="p-4 text-gray-500">Loading dentist details...</p>;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Card className="overflow-hidden p-0 m-0 bg-white shadow-lg rounded-lg">
            <div className="flex flex-col lg:flex-row">
              {/* Dentist Profile Section */}
              <div className="w-full lg:w-80 xl:w-96 p-4 sm:p-6 bg-gray-50 border-b lg:border-b-0 lg:border-r">
                <div className="text-center lg:text-left">
                  <div className="flex flex-col sm:flex-row lg:flex-col items-center sm:items-start lg:items-center gap-4 sm:gap-6 lg:gap-3">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-20 lg:h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {dentist.profile_picture ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${dentist.profile_picture}`}
                          alt={dentist.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const fallback = parent.querySelector('.profile-fallback');
                              if (fallback) fallback.classList.remove('hidden');
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className={`profile-fallback ${dentist.profile_picture ? 'hidden' : ''} w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-800 font-semibold text-xl`}
                      >
                        {dentist.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .substring(0, 2)}
                      </div>
                    </div>
                    <div className="flex-1 sm:text-left lg:text-center">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 capitalize">Dr. {dentist.name}</h2>
                      <h4 className="text-emerald-500 text-sm sm:text-base capitalize">{service?.service}</h4>
                      <h4 className="text-gray-600 font-semibold text-sm capitalize">Dentist</h4>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 space-y-3 mt-4 sm:mt-6 text-center">
                    <div className="pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4 lg:gap-3">
                        <div>
                          <div className="font-medium text-gray-700 mb-1">Contact:</div>
                          <div className="font-medium text-gray-800 text-sm">
                            {dentist.phone_number}
                          </div>
                        </div>

                        <div>
                          <div className="font-medium text-gray-700 mb-1">Email:</div>
                          <div className="text-xs sm:text-sm leading-relaxed text-gray-600">
                            {dentist.email}
                          </div>
                        </div>

                        <div>
                          <div className="font-medium text-gray-700 mb-1">Language:</div>
                          <div className="text-gray-600 capitalize">
                            {dentist.language}
                          </div>
                        </div>

                        <div>
                          <div className="font-medium text-gray-700 mb-1">Price:</div>
                          <div className="text-emerald-600 font-semibold">
                            ${dentist.appointment_fee}
                          </div>
                        </div>

                        <div>
                          <div className="font-medium text-gray-700 mb-1">Duration:</div>
                          <div className="text-gray-600">
                            {dentist.appointment_duration} minutes
                          </div>
                        </div>

                        <div>
                          <div className="font-medium text-gray-700 mb-1">Working Days:</div>
                          <div className="text-gray-600 capitalize">
                            {dentist.work_days_from} - {dentist.work_days_to}
                          </div>
                        </div>

                        <div>
                          <div className="font-medium text-gray-700 mb-1">Working Hours:</div>
                          <div className="text-gray-600">
                            {dentist.work_time_from} - {dentist.work_time_to}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Section */}
              <div className="flex-1 p-4 sm:p-6">
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">Book Your Dental Appointment</h3>
                  <p className="text-sm text-gray-600">Select Date & Time</p>
                </div>

                <div className="flex flex-col items-center space-y-6">
                  {/* Calendar - Made larger and centered */}
                  <div className="w-full max-w-lg">
                    <CustomCalendar
                      selectedDate={selectedDate}
                      onSelect={setSelectedDate}
                      modifiers={{
                        booked: bookedDates
                      }}
                    />
                  </div>

                  {/* Time Slots Legend */}
                  <div className="w-full max-w-2xl mb-4">
                    <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:justify-center sm:space-x-6">
                      <div className="flex items-center justify-center sm:justify-start">
                        <div className="w-4 h-4 rounded border border-gray-300 bg-white mr-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-600">Available</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start">
                        <div className="w-4 h-4 rounded bg-red-100 border border-red-300 mr-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-600">Booked</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start">
                        <div className="w-4 h-4 rounded bg-gray-200 mr-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-600">Blocked</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start">
                        <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300 mr-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-600">Your Booking</span>
                      </div>
                    </div>
                  </div>

                  {/* Available Time Slots */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-3">
                    {timeSlots.map((slot) => {
                      const slotState = getTimeSlotState(selectedDate, slot);
                      return (
                        <Button
                          key={slot}
                          variant={selectedTime === slot ? "default" : "outline"}
                          onClick={() => slotState === 'available' && setSelectedTime(slot)}
                          size="sm"
                          disabled={slotState !== 'available'}
                          className={`text-sm h-10 ${selectedTime === slot
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                            : slotState === 'available'
                              ? "border-gray-300 hover:border-emerald-500 text-gray-700 hover:bg-emerald-50"
                              : slotState === 'booked'
                                ? "bg-red-100 border-red-300 text-red-700 cursor-not-allowed"
                                : slotState === 'user-booked'
                                  ? "bg-emerald-100 border-emerald-300 text-emerald-700 cursor-not-allowed"
                                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
                            }`}
                        >
                          {slot}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Confirm Button */}
                  <div className="w-full max-w-lg">
                    <Button
                      disabled={!selectedDate || !selectedTime}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-medium h-12 px-8 text-base"
                      onClick={handleConfirmBooking}
                    >
                      Confirm Dental Appointment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a Note (Optional)</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter any special requests or notes for your dental appointment..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter className="flex justify-end space-x-2">
            <Button
              onClick={() => handleNoteSubmit(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {note.trim() ? 'Add Note & Book' : 'Book Without Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}