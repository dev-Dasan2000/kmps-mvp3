"use client"

import { Card, CardContent } from "@/components/ui/card"
import { mockRooms, mockAppointments, mockDentists, getDoctorColor } from "@/lib/mock-data"
import type { DayOfWeek } from "@/types/dentist"

interface RoomViewProps {
  weekDays: DayOfWeek[]
  selectedDate: string
  viewMode: "day" | "week"
}

export function RoomView({ weekDays, selectedDate, viewMode }: RoomViewProps) {
  const timeSlots = ["09:00", "09:30", "10:00"]

  // Filter days based on view mode
  const displayDays = viewMode === "day" ? weekDays.filter((day) => day.date === selectedDate) : weekDays

  const getAppointmentForRoomAndTime = (roomId: string, date: string, time: string) => {
    return mockAppointments.find((apt) => apt.room_id === roomId && apt.date === date && apt.time === time)
  }

  const getDentistInfo = (dentistId: string) => {
    return mockDentists.find((d) => d.dentist_id === dentistId)
  }

  const getAppointmentContent = (roomId: string, date: string, time: string) => {
    const appointment = getAppointmentForRoomAndTime(roomId, date, time)

    if (!appointment) {
      return (
        <div className="h-16 sm:h-20 bg-white border border-gray-200 rounded p-1 sm:p-2 flex items-center justify-center text-[10px] sm:text-xs text-gray-500">
          Available
        </div>
      )
    }

    const dentist = getDentistInfo(appointment.dentist_id)
    const colorClass = getDoctorColor(appointment.dentist_id)

    return (
      <div
        className={`h-16 sm:h-20 border-2 rounded p-1 sm:p-2 text-[10px] sm:text-xs cursor-pointer hover:shadow-md transition-shadow ${colorClass}`}
      >
        <div className="font-semibold truncate">{dentist?.name}</div>
        <div className="font-medium truncate mt-1">{appointment.patient_name}</div>
        <div className="text-[9px] sm:text-[10px] leading-tight truncate mt-1">{appointment.service}</div>
        <div className="text-[9px] sm:text-[10px] mt-1">{appointment.duration}</div>
      </div>
    )
  }

  return (
    <Card className="bg-white">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {/* Header Row - Days and Rooms */}
          <div
            className={`grid border-b bg-gray-50 min-w-fit ${
              viewMode === "day"
                ? "grid-cols-[80px_repeat(3,minmax(100px,1fr))] sm:grid-cols-[120px_repeat(3,minmax(120px,1fr))]"
                : "grid-cols-[80px_repeat(21,minmax(80px,1fr))] sm:grid-cols-[120px_repeat(21,minmax(100px,1fr))]"
            }`}
          >
            <div className="p-2 sm:p-3 border-r">
              <span className="text-xs sm:text-sm font-medium text-gray-600">Time</span>
            </div>
            {displayDays.map((day) => (
              <div key={day.date} className="col-span-3 border-r">
                <div className="text-center p-2 sm:p-3 border-b bg-blue-50">
                  <div className="font-medium text-xs sm:text-sm">
                    {new Date(day.date).getDate()} {day.name} 2025
                  </div>
                </div>
                <div className="grid grid-cols-3">
                  {mockRooms.map((room) => (
                    <div
                      key={room.room_id}
                      className="p-1 sm:p-2 text-center text-[10px] sm:text-xs font-medium text-gray-600 border-r last:border-r-0"
                    >
                      {room.description}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots Rows */}
          {timeSlots.map((timeSlot) => (
            <div
              key={timeSlot}
              className={`grid border-b min-h-[80px] sm:min-h-[100px] min-w-fit ${
                viewMode === "day"
                  ? "grid-cols-[80px_repeat(3,minmax(100px,1fr))] sm:grid-cols-[120px_repeat(3,minmax(120px,1fr))]"
                  : "grid-cols-[80px_repeat(21,minmax(80px,1fr))] sm:grid-cols-[120px_repeat(21,minmax(100px,1fr))]"
              }`}
            >
              {/* Time Column */}
              <div className="p-2 sm:p-4 border-r flex items-center bg-gray-50">
                <span className="text-xs sm:text-sm font-medium text-gray-700">{timeSlot}</span>
              </div>

              {/* Room Slots for each day */}
              {displayDays.map((day) => (
                <div key={day.date} className="col-span-3 border-r">
                  <div className="grid grid-cols-3 h-full">
                    {mockRooms.map((room) => (
                      <div key={room.room_id} className="p-1 sm:p-2 border-r last:border-r-0">
                        {getAppointmentContent(room.room_id, day.date, timeSlot)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
