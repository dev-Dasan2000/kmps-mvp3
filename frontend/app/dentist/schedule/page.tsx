// app/dentist/[dentistId]/schedule/page.tsx
"use client";

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Calendar, Clock, User, Search, Plus, X, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthContext } from '@/context/auth-context';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Appointment {
  appointment_id: number;
  patient_id: string;
  dentist_id: string;
  date: string;
  time_from: string;
  time_to: string;
  fee: number;
  note: string;
  status: string;
  payment_status: string;
  patient: {
    patient_id: string,
    name: string,
    email: string,
    profile_picture: string
  };
}

interface BlockedDate {
  blocked_date_id: number;
  dentist_id: string;
  date: string;
  time_from: string;
  time_to: string;
}

interface DentistScheduleProps {
  params: {
    dentistId: string;
  };
}

interface DentistWorkInfo {
  work_days_from: string,
  work_days_to: string,
  work_time_from: string,
  work_time_to: string,
  appointment_duration: string,
  appointment_fee: number
}

const formatDate = (dateString: string) => {
  return dateString.split('T')[0];
};

interface NewAppointmentFormProps {
  patient_id: string;
  setPatient_id: (value: string) => void;
  patientSearchTerm: string;
  setPatientSearchTerm: (value: string) => void;
  patientSearchResults: any[];
  setPatientSearchResults: React.Dispatch<React.SetStateAction<any[]>>;
  showPatientDropdown: boolean;
  setShowPatientDropdown: (value: boolean) => void;
  date: string;
  setDate: (value: string) => void;
  time_from: string;
  setTimeFrom: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  timeSlots: string[];
  handleAppointmentCreation: () => void;
  creatingAppointment: boolean;
  isTimeSlotAvailable: (time: string) => boolean;
  patientValidated: boolean;
  setPatientValidated: (value: boolean) => void;
  patientErrorMessage: string;
  setPatientErrorMessage: (value: string) => void;
}

const NewAppointmentForm = ({
  patient_id,
  setPatient_id,
  patientSearchTerm,
  setPatientSearchTerm,
  patientSearchResults,
  setPatientSearchResults,
  showPatientDropdown,
  setShowPatientDropdown,
  date,
  setDate,
  time_from,
  setTimeFrom,
  note,
  setNote,
  timeSlots,
  handleAppointmentCreation,
  creatingAppointment,
  isTimeSlotAvailable,
  patientValidated,
  setPatientValidated,
  patientErrorMessage,
  setPatientErrorMessage
}: NewAppointmentFormProps) => (
  <DialogContent className="max-h-screen overflow-y-auto">
    <DialogHeader>
      <DialogTitle>New Appointment</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <div className="relative">
        <Label className='mb-2' htmlFor="patient">Patient <span className="text-red-500">*</span></Label>
        <Input
          id="patient"
          placeholder="Search by patient name or ID..."
          value={patientSearchTerm}
          onChange={(e) => {
            const value = e.target.value;
            setPatientSearchTerm(value);
            
            if (!value) {
              // Clear everything if input is empty
              setPatient_id('');
              setPatientValidated(true);
              setPatientErrorMessage('');
              setPatientSearchResults(prevResults => []);
              setShowPatientDropdown(false);
            } else if (patient_id && !value.includes(patient_id)) {
              // Reset validation if user modifies a selected patient
              setPatient_id('');
              setPatientValidated(false);
              setPatientErrorMessage('Please select a patient from the dropdown list');
            }
            
            if (value.length >= 2) {
              setShowPatientDropdown(true);
            }
          }}
          onFocus={() => {
            if (patientSearchTerm.length >= 2) {
              setShowPatientDropdown(true);
            }
            if (!patient_id && patientSearchTerm.length > 0) {
              setPatientValidated(false);
              setPatientErrorMessage('Please select a patient from the dropdown list');
            }
          }}
          onBlur={() => setTimeout(() => {
            setShowPatientDropdown(false);
            if (!patient_id && patientSearchTerm.length > 0) {
              setPatientValidated(false);
              setPatientErrorMessage('Please select a patient from the dropdown list');
            }
          }, 200)}
          className={`w-full ${!patientValidated && patientSearchTerm ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'}`}
        />
        {showPatientDropdown && patientSearchResults.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            {patientSearchResults.map((patient) => (
              <div
                key={patient.patient_id}
                className="cursor-pointer hover:bg-gray-100 px-4 py-2 text-sm text-gray-700"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setPatient_id(patient.patient_id);
                  setPatientSearchTerm(`${patient.name} (${patient.patient_id})`);
                  setShowPatientDropdown(false);
                  setPatientValidated(true);
                  setPatientErrorMessage('');
                  setPatientSearchResults(prevResults => []);
                }}
              >
                <div className="font-medium">{patient.name}</div>
                <div className="text-xs text-gray-500">ID: {patient.patient_id}</div>
                {patient.email && <div className="text-xs text-gray-500">{patient.email}</div>}
              </div>
            ))}
          </div>
        )}
        {!patientValidated && patientErrorMessage && (
          <div className="text-red-500 text-xs mt-1">{patientErrorMessage}</div>
        )}
      </div>
      <div>
        <Label className='mb-2' htmlFor="date">Date <span className="text-red-500">*</span></Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className='mb-2' htmlFor="time_from">Time <span className="text-red-500">*</span></Label>
          <Select value={time_from} onValueChange={(value) => setTimeFrom(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Start time" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((time) => {
                const isAvailable = isTimeSlotAvailable(time);
                return (
                  <SelectItem
                    key={time}
                    value={time}
                    disabled={!isAvailable}
                    className={!isAvailable ? "text-gray-400 line-through" : ""}
                  >
                    {time} {!isAvailable && "(Unavailable)"}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className='mb-2' htmlFor="note">Note</Label>
        <Textarea
          id="note"
          placeholder="Appointment notes..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <Button
        className="w-full bg-emerald-500 hover:bg-emerald-600"
        onClick={handleAppointmentCreation}
        disabled={creatingAppointment}
      >
        {creatingAppointment ? "Creating..." : "Create Appointment"}
      </Button>
    </div>
  </DialogContent>
);

const BlockTimeForm = ({
  blockDate,
  setBlockDate,
  blockTimeFrom,
  setBlockTimeFrom,
  blockTimeTo,
  setBlockTimeTo,
  timeSlots,
  handleBlockSlotCreation,
  creatingBlockSlot,
  appointments,
  dentistWorkInfo,
  isTimeSlotConflicting
}: {
  blockDate: string;
  setBlockDate: (value: string) => void;
  blockTimeFrom: string;
  setBlockTimeFrom: (value: string) => void;
  blockTimeTo: string;
  setBlockTimeTo: (value: string) => void;
  timeSlots: string[];
  handleBlockSlotCreation: () => void;
  creatingBlockSlot: boolean;
  appointments: Appointment[];
  dentistWorkInfo: DentistWorkInfo | undefined;
  isTimeSlotConflicting: (startTime: string, endTime: string) => boolean;
}) => (
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Block Time</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <div>
        <Label className='mb-2' htmlFor="block_date">Date</Label>
        <Input
          id="block_date"
          type="date"
          value={blockDate}
          onChange={(e) => setBlockDate(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className='mb-2' htmlFor="block_from">From</Label>
          <Select
            value={blockTimeFrom}
            onValueChange={(value) => setBlockTimeFrom(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Start time" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map(time => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className='mb-2' htmlFor="block_to">To</Label>
          <Select
            value={blockTimeTo}
            onValueChange={(value) => setBlockTimeTo(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="End time" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map(time => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button
        className="w-full bg-emerald-500 hover:bg-emerald-600"
        onClick={handleBlockSlotCreation}
        disabled={creatingBlockSlot || isTimeSlotConflicting(blockTimeFrom, blockTimeTo)}
      >
        {creatingBlockSlot ? "Blocking..." :
          isTimeSlotConflicting(blockTimeFrom, blockTimeTo) ? "Time Conflicts with Appointment" :
            "Block Time"}
      </Button>
    </div>
  </DialogContent>
);

export default function DentistSchedulePage({ params }: DentistScheduleProps) {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const { user, isLoadingAuth, isLoggedIn, apiClient } = useContext(AuthContext);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("today");
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isBlockTimeOpen, setIsBlockTimeOpen] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loadingBlockedSlots, setLoadingBlockedSlots] = useState(false);
  const [creatingAppointment, setCreatingAppointment] = useState(false);
  const [creatingBlockSlot, setCreatingBlockSlot] = useState(false);
  const [deletingBlock, setDeletingBlock] = useState(false);
  const [cancellingAppointment, setCancellingAppointment] = useState(false);
  const [dentistWorkInfo, setDentistWorkInfo] = useState<DentistWorkInfo>();
  const [unavailableSlots, setUnavailableSlots] = useState<{ start: string; end: string }[]>([]);

  // Patient search states
  const [patientSearchTerm, setPatientSearchTerm] = useState<string>("");
  const [patientSearchResults, setPatientSearchResults] = useState<any[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState<boolean>(false);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout>();

  // Patient validation states
  const [patientValidated, setPatientValidated] = useState<boolean>(true);
  const [patientErrorMessage, setPatientErrorMessage] = useState<string>('');

  const router = useRouter();

  // States for creating new appointment
  const [patient_id, setPatient_id] = useState("");
  const [date, setDate] = useState("");
  const [time_from, setTimeFrom] = useState("");
  const [time_to, setTimeTo] = useState("");
  const [note, setNote] = useState("");

  // States for creating new block slot
  const [blockDate, setBlockDate] = useState("");
  const [blockTimeFrom, setBlockTimeFrom] = useState("");
  const [blockTimeTo, setBlockTimeTo] = useState("");

  // Update the searchPatients function
  const searchPatients = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setPatientSearchResults([]);
      setShowPatientDropdown(false);
      setPatientErrorMessage('');
      setPatientValidated(true);
      return;
    }

    try {
      const response = await apiClient.get(`/patients/search?q=${encodeURIComponent(term)}`);
      if (response.status === 200) {
        const data = response.data;
        
        if (data.length === 0) {
          setPatientSearchResults([]);
          setPatientValidated(false);
          setPatientErrorMessage('No matching patients found. Please try a different search term.');
        } else {
          setPatientSearchResults(data);
          setShowPatientDropdown(true);
          // Only clear error if we haven't selected a patient yet
          if (!patient_id) {
            setPatientErrorMessage('');
          }
        }
      }
    } catch (err) {
      console.error('Error searching patients:', err);
      setPatientSearchResults([]);
      setShowPatientDropdown(false);
      setPatientErrorMessage('Error searching for patients');
      setPatientValidated(false);
    }
  }, [apiClient, patient_id]);

  // Update the useEffect for search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search if we have a selected patient
    if (patient_id) {
      setPatientSearchResults([]);
      return;
    }

    if (patientSearchTerm.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchPatients(patientSearchTerm);
      }, 300);
    } else {
      setPatientSearchResults([]);
      setShowPatientDropdown(false);
      setPatientErrorMessage('');
      setPatientValidated(patientSearchTerm.length === 0);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [patientSearchTerm, searchPatients, patient_id]);

  // Reset search when modal is opened/closed
  useEffect(() => {
    if (!isNewAppointmentOpen) {
      setPatientSearchTerm("");
      setPatientSearchResults(prevResults => []);
      setShowPatientDropdown(false);
      setPatient_id("");
      setDate("");
      setTimeFrom("");
      setNote("");
      setPatientValidated(true);
      setPatientErrorMessage("");
    }
  }, [isNewAppointmentOpen]);

  const [timeSlots, setTimeSlots] = useState([""]);


  const today = new Date().toISOString().split('T')[0];

  function addMinutesToTime(timeFrom: string, durationMinutesStr: string): string {
    const [hoursFrom, minutesFrom] = timeFrom.split(":").map(Number);
    const durationMinutes = Number(durationMinutesStr);

    let totalMinutes = hoursFrom * 60 + minutesFrom + durationMinutes;

    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;

    const hh = newHours.toString().padStart(2, "0");
    const mm = newMinutes.toString().padStart(2, "0");

    return `${hh}:${mm}`;
  };


  const fetchAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const response = await apiClient.get(
        `/appointments/fordentist/${user.id}`
      );
      if (response.status === 500) {
        throw new Error("Internal server error");
      }
      const validAppointments = response.data.filter(
        (appointment: Appointment) => appointment.patient !== null
      );
      setAppointments(validAppointments);
    }
    catch (err: any) {
      console.error("Error fetching appointments:", err);
      toast.error(err.message);
    }
    finally {
      setLoadingAppointments(false);
    }
  };

  const fetchBlockedSlots = async () => {
    setLoadingBlockedSlots(true);
    try {
      const response = await apiClient.get(
        `/blocked-dates/fordentist/${user.id}`
      );
      if (response.status === 500) {
        throw new Error("Internal Server Error");
      }
      setBlockedDates(response.data);
    }
    catch (err: any) {
      console.error("Error fetching blocked slots:", err);
      toast.error(err.message);
    }
    finally {
      setLoadingBlockedSlots(false);
    }
  };

  const handleBlockDeletion = async (blocked_date_id: number) => {
    toast.custom((t) => (
      <div className="bg-emerald-50 rounded-lg shadow-lg p-6 min-w-[400px] max-w-2xl">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-full">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">Delete Block Slot</h3>
            <p className="text-sm text-gray-500 mt-1">This action cannot be undone. Are you sure you want to proceed?</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            size="sm"
            className="px-4"
            onClick={() => toast.dismiss(t)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="px-4"
            onClick={async () => {
              toast.dismiss(t);
              setDeletingBlock(true);
              try {
                const response = await apiClient.delete(
                  `/blocked-dates/${blocked_date_id}`
                );
                if (response.status == 500) {
                  throw new Error("Error Deleting Block Slot");
                }
                fetchBlockedSlots();
                toast.success("Block slot deleted successfully");
              }
              catch (err: any) {
                toast.error(err.message);
              }
              finally {
                setDeletingBlock(false);
              }
            }}
          >
            Delete Block
          </Button>
        </div>
      </div>
    ), {
      duration: 6000,
      position: 'top-center',
    });
  }

  const fetchDentistWorkInfo = async () => {
    try {
      const response = await apiClient.get(
        `/dentists/getworkinfo/${user.id}`
      );
      if (response.status == 500) {
        throw new Error("Internal Server Error");
      }
      setDentistWorkInfo(response.data);
    }
    catch (err: any) {

      toast.error(err.message);
    }
  };

  // Memoize time slot generation to prevent unnecessary recalculations
  const generateTimeSlots = async (workInfo: DentistWorkInfo) => {
    if (!date || !workInfo) {
      setTimeSlots([]);
      setUnavailableSlots([]);
      return;
    }

    console.time('generateTimeSlots'); // Performance measurement

    // Generate all possible time slots based on dentist's schedule
    const allSlots: string[] = [];

    const [startHour, startMin] = workInfo.work_time_from.split(":").map(Number);
    const [endHour, endMin] = workInfo.work_time_to.split(":").map(Number);
    const duration = parseInt(workInfo.appointment_duration, 10);

    let start = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;

    while (start + duration <= end) {
      const hour = Math.floor(start / 60);
      const min = start % 60;
      const formatted = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      allSlots.push(formatted);
      start += duration;
    }

    if (allSlots.length === 0) {
      setTimeSlots([]);
      setUnavailableSlots([]);
      return;
    }

    // ---------------- Process already reserved intervals ----------------
    let takenIntervals: { start: string; end: string }[] = [];
    try {
      // Get appointments for this dentist on the selected date - optimize by filtering once
      const currentDate = date; // Capture current date to avoid closure issues
      const appointmentsForDate = appointments.filter(appt => formatDate(appt.date) === currentDate);
      const blockedSlotsForDate = blockedDates.filter(block => block.date === currentDate);

      // Pre-allocate array size for better performance
      takenIntervals = new Array(appointmentsForDate.length + blockedSlotsForDate.length);
      let index = 0;

      // Add appointments to taken intervals
      for (let i = 0; i < appointmentsForDate.length; i++) {
        takenIntervals[index++] = {
          start: appointmentsForDate[i].time_from,
          end: appointmentsForDate[i].time_to
        };
      }

      // Add blocked slots to taken intervals
      for (let i = 0; i < blockedSlotsForDate.length; i++) {
        const block = blockedSlotsForDate[i];
        if (block.time_from && block.time_to) {
          takenIntervals[index++] = { start: block.time_from, end: block.time_to };
        } else {
          // Whole day blocked
          takenIntervals[index++] = { start: '00:00', end: '23:59' };
        }
      }

      // Trim array if needed
      if (index < takenIntervals.length) {
        takenIntervals = takenIntervals.slice(0, index);
      }
    } catch (err) {
      console.error('❌ Error processing reserved intervals:', err);
    }

    // Keep track of unavailable slots for the form selector
    // but show ALL slots in the daily schedule
    setUnavailableSlots(takenIntervals);
    setTimeSlots(allSlots);

    console.timeEnd('generateTimeSlots'); // Performance measurement
    console.log(`✅ All time slots: ${allSlots.length}, with ${takenIntervals.length} unavailable intervals`);
  };

  // Helper function to check if a time slot is available
  const isTimeSlotAvailable = (slotTime: string): boolean => {
    if (!dentistWorkInfo) return false;

    const duration = parseInt(dentistWorkInfo.appointment_duration, 10);
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map((n: string) => parseInt(n));
      return h * 60 + (m || 0);
    };

    // Check if this slot overlaps with any unavailable interval
    const slotMinutes = toMinutes(slotTime);
    const endSlotMinutes = slotMinutes + duration;

    for (const interval of unavailableSlots) {
      const startRangeMinutes = toMinutes(interval.start);
      const endRangeMinutes = toMinutes(interval.end);

      if (slotMinutes < endRangeMinutes && endSlotMinutes > startRangeMinutes) {
        return false; // There is an overlap
      }
    }

    return true;
  };

  const handleAppointmentCreation = async () => {
    // Validate that a patient was properly selected
    if (!patient_id) {
      setPatientValidated(false);
      setPatientErrorMessage('Please select a patient from the dropdown');
      toast.error('Patient selection required');
      return;
    }

    if (!date || !time_from) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreatingAppointment(true);
    try {
      const timeTo = addMinutesToTime(time_from, dentistWorkInfo?.appointment_duration || "0");

      // Check if the time slot is available before making the API call
      if (!isTimeSlotAvailable(time_from)) {
        throw new Error("This time slot is no longer available");
      }

      // 1. Create the appointment
      const response = await apiClient.post(
        `/appointments/`,
        {
          patient_id: patient_id,
          dentist_id: user.id,
          date: date,
          time_from: time_from,
          time_to: timeTo,
          fee: dentistWorkInfo?.appointment_fee,
          note: note,
          status: "confirmed",
          payment_status: "not-paid"
        }
      );

      if (response.status !== 201) {
        throw new Error("Error Creating Appointment");
      } else {
        // 2. Fetch patient details to include in the appointment
        try {
          const patientResponse = await apiClient.get(`/patients/${patient_id}`);
          const patientData = patientResponse.data;

          // 3. Create a complete appointment object with patient details
          const newAppointment = {
            ...response.data,
            patient: patientData
          };

          // 4. Update the appointments state with the complete data
          setAppointments(prev => [...prev, newAppointment]);

          toast.success("Appointment Created Successfully");
        } catch (patientErr) {
          console.error("Could not fetch patient details:", patientErr);
          // If patient fetch fails, still add appointment but mark for refresh
          setAppointments(prev => [...prev, response.data]);
          toast.success("Appointment Created Successfully, refreshing data...");
          // Fetch all appointments to ensure data consistency
          fetchAppointments();
        }

        setIsNewAppointmentOpen(false);

        fetchAppointments();
        // Reset form
        setPatient_id("");
        setDate("");
        setTimeFrom("");
        setNote("");
        setPatientValidated(true);
        setPatientErrorMessage("");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreatingAppointment(false);
    }
  };

  const isTimeSlotConflicting = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return false;

    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(n => parseInt(n));
      return h * 60 + m;
    };

    const blockStart = toMinutes(startTime);
    const blockEnd = toMinutes(endTime);

    return filteredAppointments.some(apt => {
      const aptStart = toMinutes(apt.time_from);
      const aptEnd = toMinutes(apt.time_to);

      // Check if there's any overlap
      return blockStart < aptEnd && blockEnd > aptStart;
    });
  };

  const handleBlockSlotCreation = async () => {
    if (isTimeSlotConflicting(blockTimeFrom, blockTimeTo)) {
      toast.error("Cannot block time that conflicts with existing appointments");
      return;
    }

    setCreatingBlockSlot(true);
    try {
      const response = await apiClient.post(
        `/blocked-dates/`,
        {
          dentist_id: user.id,
          date: blockDate,
          time_from: blockTimeFrom,
          time_to: blockTimeTo
        }
      );
      if (response.status != 201) {
        throw new Error("Internal Server Error");
      }
      // Optimistically update local state
      const newBlockedDate = response.data;
      setBlockedDates(prev => [...prev, newBlockedDate]);
      toast.success("Block Slot Created Successfully");
      setIsBlockTimeOpen(false);
      // Reset form
      setBlockDate("");
      setBlockTimeFrom("");
      setBlockTimeTo("");

      // Only fetch if optimistic update fails
      if (!newBlockedDate || !newBlockedDate.blocked_date_id) {
        fetchBlockedSlots();
      }
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setCreatingBlockSlot(false);
    }
  }

  const handleAppointmentCancellation = async (appointment_id: number) => {
    setCancellingAppointment(true);
    try {
      const response = await apiClient.put(
        `/appointments/${appointment_id}`,
        {
          status: "cancelled"
        }
      );
      if (response.status != 202) {
        throw new Error("Error cancelling appointment");
      }
      // Optimistically update the local state to avoid full refetch
      setAppointments(prev => prev.map(apt =>
        apt.appointment_id === appointment_id
          ? { ...apt, status: "cancelled" }
          : apt
      ));
      toast.success("Appointment Cancelled Successfully");
      fetchAppointments();
    }
    catch (err: any) {
      toast.error(err.message);
      fetchAppointments();
    }
    finally {
      setCancellingAppointment(false);
    }
  };

  // Filter appointments based on selected date and search term (includes all statuses for left side)
  const filteredAppointments = appointments.filter(apt => {
    const aptDate = formatDate(apt.date);
    const matchesDate = aptDate === selectedDate;
    const matchesSearch = searchTerm === "" ||
      apt.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.note?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesSearch;
  });
  
  // Filter for right side (excludes cancelled)
  const filteredAppointmentsForRightSide = filteredAppointments.filter(
    apt => apt.status !== 'cancelled'
  );

  // Get appointments for different time periods
  const todayAppointments = appointments.filter(apt => formatDate(apt.date) === today);
  const upcomingAppointments = appointments.filter(apt => formatDate(apt.date) > today);
  const pastAppointments = appointments.filter(apt => formatDate(apt.date) < today);

  // Filter by search term for each category
  const getFilteredAppointmentsByTab = (tabAppointments: Appointment[]) => {
    return tabAppointments.filter(apt =>
      searchTerm === "" ||
      apt.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.note?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Filter blocked dates for selected date
  const selectedDateBlockedSlots = blockedDates.filter(block => formatDate(block.date) === selectedDate);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'checkedin': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isTimeSlotBlocked = (time: string) => {
    return selectedDateBlockedSlots.some(block => {
      const blockStart = block.time_from;
      const blockEnd = block.time_to;
      return time >= blockStart && time < blockEnd;
    });
  };

  const isTimeSlotBooked = (time: string) => {
    return filteredAppointments.some(apt => {
      return time >= apt.time_from && time < apt.time_to;
    });
  };

  useEffect(()=>{
    if(isLoadingAuth) return;
    if(!isLoggedIn){
      toast.error("Login Error", {description:"Please Login"});
      router.push("/");
    }
    else if(user.role != "dentist"){
      toast.error("Access Denied", {description:"You do not have admin priviledges"});
      router.push("/");
    }
  },[isLoadingAuth]);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isLoggedIn) {
      toast.error("You are not logged in.");
      router.push("/");
      return;
    }
    if (user?.id) {
      Promise.all([
        fetchAppointments(),
        fetchBlockedSlots(),
        fetchDentistWorkInfo()
      ]);
    }
  }, [user?.id, isLoadingAuth, isLoggedIn]);

  useEffect(() => {
    // Only regenerate time slots if we have the necessary data
    if (dentistWorkInfo && date) {
      // Use a small timeout to prevent blocking the UI thread
      const timerId = setTimeout(() => {
        generateTimeSlots(dentistWorkInfo);
      }, 0);

      return () => clearTimeout(timerId);
    }
  }, [
    // Only these specific changes should trigger regeneration
    dentistWorkInfo?.work_time_from,
    dentistWorkInfo?.work_time_to,
    dentistWorkInfo?.appointment_duration,
    date,
    // Use string representation of appointments and blocked dates to avoid
    // unnecessary regeneration when the objects haven't actually changed
    JSON.stringify(appointments.map(a => ({ id: a.appointment_id, date: formatDate(a.date), from: a.time_from, to: a.time_to }))),
    JSON.stringify(blockedDates.map(b => ({ id: b.blocked_date_id, date: b.date, from: b.time_from, to: b.time_to })))
  ]);

  // Update date in new appointment dialog when selected date changes
  useEffect(() => {
    setDate(selectedDate);
  }, [selectedDate]);

  const renderAppointmentTable = (appointmentList: Appointment[], showActions: boolean = true) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Patient</th>
            <th className="text-left p-2 hidden sm:table-cell">Service</th>
            <th className="text-left p-2 ">Date & Time</th>
            <th className="text-left p-2 hidden md:table-cell">Fee</th>
            <th className="text-left p-2">Status</th>
            {showActions && <th className="text-left p-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {appointmentList.length === 0 ? (
            <tr>
              <td colSpan={showActions ? 6 : 5} className="p-4 text-center text-gray-500">
                {loadingAppointments ? "Loading appointments..." : "No appointments found"}
              </td>
            </tr>
          ) : (
            appointmentList.map((appointment) => (
              <tr key={appointment.appointment_id} className="border-b">
                <td className="p-2">
                  <div className="flex items-center space-x-3">
                    <div className="relative h-8 w-8 rounded-full overflow-hidden bg-blue-100 flex-shrink-0">
                      {appointment.patient?.profile_picture ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${appointment.patient.profile_picture}`}
                          alt={appointment.patient?.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) {
                              fallback.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-100 text-blue-700 font-medium text-sm">
                        {appointment.patient?.name 
                          ? appointment.patient.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                          : '?'}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">{appointment.patient?.name || 'Unknown Patient'}</div>
                      <div className="text-sm text-gray-600 sm:hidden">
                        {appointment.note}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-2 hidden sm:table-cell">{appointment.note}</td>
                <td className="p-2">
                  <div className="text-sm">
                    {formatDate(appointment.date)}
                    <br />
                    {appointment.time_from} - {appointment.time_to}
                  </div>
                </td>
                <td className="p-2 hidden md:table-cell">Rs {appointment.fee}</td>
                <td className="p-2">
                  <div className="space-y-1">
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                    <div className="md:hidden">
                      <Badge className={getPaymentStatusColor(appointment.payment_status)}>
                        {appointment.payment_status}
                      </Badge>
                    </div>
                  </div>
                </td>
                {showActions && (
                  <td className="p-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAppointmentCancellation(appointment.appointment_id)}
                      disabled={cancellingAppointment || appointment.status === "cancelled" || appointment.status === "completed"}
                    >
                      {appointment.status === "cancelled" ? "Cancelled" : "Cancel"}
                    </Button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedule Management</h1>
            <p className="text-gray-600">Manage your appointments and blocked time slots</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Dialog open={isNewAppointmentOpen} onOpenChange={setIsNewAppointmentOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600">
                  <Plus className="w-4 h-4 mr-2" />
                  New Appointment
                </Button>
              </DialogTrigger>
              <NewAppointmentForm
                patient_id={patient_id}
                setPatient_id={setPatient_id}
                date={date}
                setDate={setDate}
                time_from={time_from}
                setTimeFrom={setTimeFrom}
                note={note}
                setNote={setNote}
                timeSlots={timeSlots}
                handleAppointmentCreation={handleAppointmentCreation}
                creatingAppointment={creatingAppointment}
                isTimeSlotAvailable={isTimeSlotAvailable}
                patientValidated={patientValidated}
                setPatientValidated={setPatientValidated}
                patientErrorMessage={patientErrorMessage}
                setPatientErrorMessage={setPatientErrorMessage}
                patientSearchTerm={patientSearchTerm}
                setPatientSearchTerm={setPatientSearchTerm}
                patientSearchResults={patientSearchResults}
                setPatientSearchResults={setPatientSearchResults}
                showPatientDropdown={showPatientDropdown}
                setShowPatientDropdown={setShowPatientDropdown}
              />
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Schedule */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Daily Schedule</CardTitle>
                <div className="flex items-center space-x-2">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loadingAppointments || loadingBlockedSlots ? (
                  <div className="text-center py-8 text-gray-500">Loading schedule...</div>
                ) : (
                  <div className="space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto">
                    {timeSlots.map((time) => {
                      const appointment = filteredAppointments.find(apt =>
                        apt.time_from <= time && apt.time_to > time
                      );
                      const isBlocked = isTimeSlotBlocked(time);
                      const isAvailable = !appointment && !isBlocked;

                      // Apply appropriate styling based on availability
                      const borderClass = isAvailable
                        ? "border-gray-200"
                        : appointment
                          ? "border-blue-200"
                          : "border-red-200";

                      return (
                        <div
                          key={time}
                          className={`flex items-center space-x-3 p-2 rounded-lg border ${borderClass}`}
                        >
                          <div className="text-sm font-medium w-16 text-gray-600">
                            {time}
                          </div>
                          <div className="flex-1">
                            {appointment ? (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                                <div className="flex items-center space-x-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium">{appointment.patient?.name || 'Unknown Patient'}</span>
                                  <Badge className={getStatusColor(appointment.status)}>
                                    {appointment.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600">Rs {appointment.fee}</span>
                                  <Badge className={getPaymentStatusColor(appointment.payment_status)}>
                                    {appointment.payment_status}
                                  </Badge>
                                </div>
                              </div>
                            ) : isBlocked ? (
                              <div className="flex items-center space-x-2">
                                <X className="w-4 h-4 text-red-500" />
                                <span className="text-red-600 font-medium">Blocked</span>
                                
                              </div>
                            ) : (
                              <span className="text-gray-400">Available</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 ">
            {/* Schedule Summary Card */}
            <Card className="h-[calc(100vh-20rem)]"> {/* Fixed height container */}
              <CardHeader className="pb-3 flex-shrink-0"> {/* Prevent header from shrinking */}
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">
                    Schedule for {new Date(selectedDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </CardTitle>
                  <Dialog open={isBlockTimeOpen} onOpenChange={setIsBlockTimeOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-auto">
                        Block Time
                      </Button>
                    </DialogTrigger>
                    <BlockTimeForm
                      blockDate={blockDate}
                      setBlockDate={setBlockDate}
                      blockTimeFrom={blockTimeFrom}
                      setBlockTimeFrom={setBlockTimeFrom}
                      blockTimeTo={blockTimeTo}
                      setBlockTimeTo={setBlockTimeTo}
                      timeSlots={timeSlots}
                      handleBlockSlotCreation={handleBlockSlotCreation}
                      creatingBlockSlot={creatingBlockSlot}
                      appointments={filteredAppointments}  // Add this
                      dentistWorkInfo={dentistWorkInfo}    // Add this
                      isTimeSlotConflicting={isTimeSlotConflicting}
                    />
                  </Dialog>
                </div>
                <div className="text-sm text-gray-500">
                  Appointments for selected date: {filteredAppointments.filter(apt => apt.status !== 'cancelled').length}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 overflow-y-auto flex-1 min-h-0">
                {filteredAppointmentsForRightSide.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No appointments for this date
                  </div>
                ) : (
                  filteredAppointmentsForRightSide.map((appointment) => (
                    <div key={appointment.appointment_id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.patient?.name || 'Unknown Patient'}
                          </div>
                          <div className="text-xs text-blue-600">
                            {appointment.time_from} - {appointment.time_to}
                          </div>
                          <div className="text-xs text-gray-500">{appointment.note}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Blocked Time Items */}
                {selectedDateBlockedSlots.map((block) => (
                  <div key={block.blocked_date_id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="text-sm font-medium text-red-700">
                          {block.time_from} - {block.time_to}
                        </div>
                        <div className="text-xs text-red-600">Blocked</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 text-xs"
                        onClick={() => handleBlockDeletion(block.blocked_date_id)}
                        disabled={deletingBlock}
                      >
                        {deletingBlock ? "Deleting..." : "Cancel Block"}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Appointment Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Appointment Management</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-8"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    tabIndex={-1}
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="today">Today ({todayAppointments.length})</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming ({upcomingAppointments.length})</TabsTrigger>
                <TabsTrigger value="past">Past ({pastAppointments.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="today" className="space-y-4">
                {renderAppointmentTable(getFilteredAppointmentsByTab(todayAppointments), true)}
              </TabsContent>
              <TabsContent value="upcoming" className="space-y-4">
                {renderAppointmentTable(getFilteredAppointmentsByTab(upcomingAppointments), true)}
              </TabsContent>
              <TabsContent value="past" className="space-y-4">
                {renderAppointmentTable(getFilteredAppointmentsByTab(pastAppointments), false)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}