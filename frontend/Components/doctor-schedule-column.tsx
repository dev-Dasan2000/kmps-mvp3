"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { generateDentistTimeSlots, isDentistWorkingDay, mockAppointments } from "@/lib/mock-data"
import type { Dentist, Appointment, DayOfWeek } from "@/types/dentist"
import { AuthContext } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useContext, useEffect, useState } from "react"
import axios from "axios"
import { toast } from "sonner"

interface DoctorScheduleColumnProps {
  dentist: Dentist
  weekDays: DayOfWeek[]
  selectedWeek: string
  viewMode: "day" | "week"
  selectedDate: string
}

interface Blocked{
  blocked_date_id:number
  dentist_id: string
  date: string
  time_from: string
  time_to: string
}

export function DoctorScheduleColumn({
  dentist,
  weekDays,
  selectedWeek,
  viewMode,
  selectedDate,
}: DoctorScheduleColumnProps) {
  const dentistTimeSlots = generateDentistTimeSlots(dentist)
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blocked, setBlocked] = useState<Blocked[]>([]);

  const getDuration = (from: string, to: string) => {
    const [fromHours, fromMinutes] = from.split(':').map(Number);
    const [toHours, toMinutes] = to.split(':').map(Number);
  
    const fromDate = new Date(0, 0, 0, fromHours, fromMinutes);
    const toDate = new Date(0, 0, 0, toHours, toMinutes);
  
    let diff = (toDate.getTime() - fromDate.getTime()) / 1000 / 60; // difference in minutes
  
    // Handle cases where time_to is past midnight (optional)
    if (diff < 0) diff += 24 * 60;
  
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
  
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Helper to trim seconds from a time string (e.g. "09:00:00" -> "09:00")
  const normalizeTime = (t: string) => {
    if (!t) return "";
    const trimmed = t.trim();
    const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      const h = match[1].padStart(2, "0");
      const m = match[2].padStart(2, "0");
      return `${h}:${m}`;
    }
    // Fallback – if regex fails, attempt simple split
    const [rawH, rawM = "00"] = trimmed.split(":");
    const h = (rawH || "0").padStart(2, "0");
    const m = (rawM || "0").padStart(2, "0").replace(/\D+/g, ""); // strip non-digits
    return `${h}:${m || "00"}`;
  };

  // Helper – convert ISO date string to local YYYY-MM-DD (avoids timezone offsets)
  const normalizeDate = (iso: string) => {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const da = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${da}`;
  };

  const getAppointmentForSlot = (date: string, time: string): Appointment | null => {
    const slotTime = normalizeTime(time);
    return (
      appointments.find((apt) => {
        const aptDate = normalizeDate(apt.date);
        const aptTime = normalizeTime(apt.time_from);
        return String(apt.dentist_id) === String(dentist.dentist_id) && aptDate === date && aptTime === slotTime;
      }) || null
    );
  }

  const getBlockedForSlot = (date: string, time: string) => {
    const slotTime = normalizeTime(time);
    return (
      blocked.find((blk) => {
        const blkDate = normalizeDate(blk.date);
        const blkTime = normalizeTime(blk.time_from);
        return String(blk.dentist_id) === String(dentist.dentist_id) && blkDate === date && blkTime === slotTime;
      }) || null
    );
  }

  const getAppointmentContent = (day: DayOfWeek, timeSlot: string) => {
    const isWorkingDay = isDentistWorkingDay(dentist, day.dayIndex)

    if (!isWorkingDay) {
      return (
        <div className="h-16 sm:h-20 bg-gray-50 border-2 border-gray-100 rounded-lg p-1 sm:p-2 flex items-center justify-center">
          <span className="text-xs sm:text-sm text-gray-400 font-medium">Off</span>
        </div>
      )
    }

    const appointment = getAppointmentForSlot(day.date, timeSlot);
    const block = getBlockedForSlot(day.date, timeSlot);

    if (!appointment && !block) {
      return (
        <div className="h-16 sm:h-20 bg-white border-2 border-gray-200 rounded-lg p-1 sm:p-2 flex items-center justify-center text-xs sm:text-sm text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors hover:border-gray-300">
          Available
        </div>
      );
    }

    if (block) {
      return (
        <div className="h-16 sm:h-20 bg-red-100 border-2 border-red-200 rounded-lg p-1 sm:p-2 flex items-center justify-center text-xs sm:text-sm text-red-600 font-medium">
          Blocked
        </div>
      );
    }

    // 3. Any appointment present – style based on status
    if (appointment) {
      // Week view: only patient name, centered for space
      if (viewMode === "week") {
        const statusColours: Record<string, { bg: string; border: string; text: string }> = {
          confirmed: { bg: "bg-green-100", border: "border-green-200", text: "text-green-800" },
          pending: { bg: "bg-yellow-100", border: "border-yellow-200", text: "text-yellow-800" },
          completed: { bg: "bg-gray-100", border: "border-gray-200", text: "text-gray-800" },
        };
        const colours = statusColours[appointment.status?.toLowerCase()] || statusColours.confirmed;
        return (
          <div
            className={`h-16 sm:h-20 ${colours.bg} border-2 ${colours.border} rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-semibold ${colours.text}`}
          >
            {appointment.patient?.name ?? "Patient"}
          </div>
        );
      }

      // Day view: detailed view

      // Choose styling by status
      const statusColours: Record<string, { bg: string; border: string; text: string }> = {
        confirmed: { bg: "bg-green-100", border: "border-green-200", text: "text-green-800" },
        pending: { bg: "bg-yellow-100", border: "border-yellow-200", text: "text-yellow-800" },
        completed: { bg: "bg-gray-100", border: "border-gray-200", text: "text-gray-800" },
      };
      const colours = statusColours[appointment.status?.toLowerCase()] || statusColours.confirmed;

      return (
        <div
          className={`h-16 sm:h-20 ${colours.bg} border-2 ${colours.border} rounded-lg p-1 sm:p-2 text-xs cursor-pointer hover:opacity-90 transition-colors`}
        >
          <div className={`font-semibold truncate text-[10px] sm:text-xs leading-tight ${colours.text}`}>
            {appointment.patient?.name ?? "Appointment"}
          </div>
          {appointment.note && (
            <div className={`${colours.text.replace("800", "700")} text-[10px] sm:text-xs leading-tight truncate mt-1`}>
              {appointment.note}
            </div>
          )}
          <div className={`${colours.text.replace("800", "600")} text-[10px] sm:text-xs mt-1`}>
            {getDuration(appointment.time_from, appointment.time_to)}
          </div>
        </div>
      );
    }

    return (
      <div className="h-16 sm:h-20 bg-white border-2 border-gray-200 rounded-lg p-1 sm:p-2 flex items-center justify-center text-xs sm:text-sm text-gray-500">
        Available
      </div>
    );
  }

  // Filter days based on view mode
  const displayDays = viewMode === "day" ? weekDays.filter((day) => day.date === selectedDate) : weekDays

  // Get appointments for the selected date (for day view statistics)
  const dayAppointments =
    viewMode === "day"
      ? appointments.filter((apt) => apt.dentist_id === dentist.dentist_id && apt.date.split("T")[0] === selectedDate)
      : []

  // Check if dentist is working on selected date (for day view)
  const {isLoadingAuth, isLoggedIn, user} = useContext(AuthContext);
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();

  const selectedDateObj = new Date(selectedDate)
  const selectedDayIndex = selectedDateObj.getDay()
  const isWorkingSelectedDay = isDentistWorkingDay(dentist, selectedDayIndex)

  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  const fetchBlocked = async () => {
    setLoadingBlocked(true);
    try{
      const response = await axios.get(
        `${backendURL}/blocked-dates`
      );
      if(response.status == 500){
        throw new Error("Error Fetching Blocked Slots");
      }
      setBlocked(response.data);
    }
    catch(err: any){
      toast.error("Error",{description:err.message});
    }
    finally{
      setLoadingBlocked(false);
    }
  }

  const fetchAppointments = async () => {
    setLoadingAppointments(true);
    try{
      const response = await axios.get(
        `${backendURL}/appointments/fordentist/${dentist.dentist_id}`
      );
      if(response.status == 500){
        throw new Error(`Error Fetching Appointments for Doctor : ${dentist.name}`);
      }
      setAppointments(response.data);
    }
    catch(err: any){
      window.alert(err.message);
    }
    finally{
      setLoadingAppointments(false);
    }
  };

  useEffect(()=>{
    if(isLoadingAuth) return;
    if(!isLoggedIn){
      window.alert("Please Log in");
      router.push("/");
    }
    else if(user.role != "receptionist" && user.role != "admin"){
      window.alert("Access Denied");
      router.push("/");
    }
    fetchAppointments();
    fetchBlocked();
  },[isLoadingAuth])
  

  return (
    <Card className="min-w-[340px] sm:min-w-[500px] lg:min-w-[700px] max-w-[700px] flex-shrink-0">
      <CardHeader className="pb-2 sm:pb-3">
        {/* Doctor Header */}
        <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
          <Avatar className="h-10 w-10 sm:h-14 sm:w-14">
            <AvatarImage src={dentist.profile_picture || "/placeholder.svg"} />
            <AvatarFallback className="text-sm sm:text-lg">
              {dentist.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-xl truncate">{dentist.name}</h3>
            <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-gray-600 mt-1">
              <span className="font-medium">${dentist.appointment_fee}</span>
              <span>•</span>
              <span>{dentist.appointment_duration}min slots</span>
            </div>
          </div>
        </div>

        {/* Working Hours Info */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
          <Badge variant="outline" className="text-xs px-2 sm:px-3 py-1">
            {dentist.work_time_from} - {dentist.work_time_to}
          </Badge>
          <Badge variant="outline" className="text-xs px-2 sm:px-3 py-1">
            {dentist.work_days_from} - {dentist.work_days_to}
          </Badge>
          {viewMode === "day" && (
            <Badge variant={isWorkingSelectedDay ? "default" : "secondary"} className="text-xs px-2 sm:px-3 py-1">
              {isWorkingSelectedDay ? "Working Today" : "Off Today"}
            </Badge>
          )}
        </div>

        {/* Day View Statistics */}
        {viewMode === "day" && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-purple-50 rounded-lg">
            <div className="text-xs sm:text-sm text-purple-800">
              <span className="font-semibold">{dayAppointments.length}</span> appointments scheduled
              {isWorkingSelectedDay && <span className="ml-2">• {dentistTimeSlots.length} total slots available</span>}
            </div>
          </div>
        )}

        {/* Week Days Header */}
        <div className={`grid gap-1 sm:gap-2 mb-3 sm:mb-4 ${viewMode === "day" ? "grid-cols-1" : "grid-cols-8"}`}>
          <div className="opacity-0 pointer-events-none" aria-hidden="true"></div>
          {displayDays.map((day, index) => {
            const isWorkingDay = isDentistWorkingDay(dentist, day.dayIndex)
            const dayAppointmentCount = appointments.filter(
              (apt) => apt.dentist_id === dentist.dentist_id && apt.date.split("T")[0] === day.date,
            ).length

            return (
              <div
                key={index}
                className={`text-center p-2 sm:p-3 rounded-lg text-xs sm:text-sm font-medium ${
                  isWorkingDay
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-gray-50 text-gray-400 border border-gray-200"
                } ${viewMode === "day" ? "flex items-center justify-between" : ""}`}
              >
                <div>
                  <div className="font-semibold">
                    {viewMode === "day"
                      ? new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })
                      : day.name}
                  </div>
                  {viewMode === "week" && <div className="text-[10px] sm:text-xs mt-1">{day.date.split("-")[2]}</div>}
                </div>
                {viewMode === "day" && <div className="text-[10px] sm:text-xs">{dayAppointmentCount} appointments</div>}
              </div>
            )
          })}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Time Slots Grid */}
        <div className="space-y-2 sm:space-y-3">
          {dentistTimeSlots.map((timeSlot) => (
            <div key={timeSlot} className="flex items-center gap-2 sm:gap-3">
              {/* Time Label */}
              <div className="w-12 sm:w-16 text-xs sm:text-sm font-semibold text-gray-700 flex-shrink-0">
                {timeSlot}
              </div>

              {/* Appointment Slots for each day */}
              <div className={`grid gap-1 sm:gap-2 flex-1 ${viewMode === "day" ? "grid-cols-1" : "grid-cols-7"}`}>
                {displayDays.map((day, dayIndex) => (
                  <div key={dayIndex} className="min-w-0">
                    {getAppointmentContent(day, timeSlot)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* No appointments message for day view */}
        {viewMode === "day" && dayAppointments.length === 0 && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              {isWorkingSelectedDay ? "No appointments scheduled for this date" : "Doctor is not working on this date"}
            </p>
          </div>
        )}

        {/* Doctor Details */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600">
          <div>
            <span className="font-semibold text-gray-800">Services:</span>
            <div className="mt-1 text-xs sm:text-sm leading-relaxed">{dentist.service_types}</div>
          </div>
          <div>
            <span className="font-semibold text-gray-800">Languages:</span>
            <span className="ml-2">{dentist.language}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <div>
              <span className="font-semibold text-gray-800">Contact:</span>
              <span className="ml-2">{dentist.phone_number}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-800">Email:</span>
              <span className="ml-2 break-all">{dentist.email}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
