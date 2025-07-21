"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { mockDentists, mockAppointments, generateDentistTimeSlots, isDentistWorkingDay } from "@/lib/mock-data"
import type { Appointment } from "@/types/dentist"

interface DayViewProps {
  selectedDate: string
}

export function DayView({ selectedDate }: DayViewProps) {
  // Get appointments for the selected date
  const dayAppointments = mockAppointments.filter((apt) => apt.date === selectedDate)

  // Get the day index for the selected date
  const selectedDateObj = new Date(selectedDate)
  const dayIndex = selectedDateObj.getDay()

  const getDentistAppointments = (dentistId: string) => {
    return dayAppointments.filter((apt) => apt.dentist_id === dentistId)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getAppointmentContent = (appointment: Appointment) => {
    if (appointment.status === "blocked") {
      return (
        <div className="p-3 bg-red-100 border-2 border-red-200 rounded-lg">
          <div className="text-sm text-red-600 font-medium">Blocked</div>
          <div className="text-xs text-red-500 mt-1">{appointment.duration}</div>
        </div>
      )
    }

    if (appointment.status === "booked") {
      return (
        <div className="p-3 bg-green-100 border-2 border-green-200 rounded-lg hover:bg-green-200 cursor-pointer transition-colors">
          <div className="font-semibold text-green-800 text-sm">{appointment.patient_name}</div>
          <div className="text-green-700 text-xs mt-1 leading-relaxed">{appointment.service}</div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {appointment.duration}
            </Badge>
            {appointment.room_id && (
              <Badge variant="outline" className="text-xs">
                {appointment.room_id.replace("room_", "Room ")}
              </Badge>
            )}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-800">{formatDate(selectedDate)}</h2>
        <p className="text-gray-600 mt-1">{dayAppointments.length} appointments scheduled</p>
      </div>

      {dayAppointments.length === 0 ? (
        <Card className="p-8">
          <div className="text-center text-gray-500">
            <p className="text-lg">No appointments scheduled for this date</p>
            <p className="text-sm mt-2">Select a different date or add new appointments</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {mockDentists.map((dentist) => {
            const dentistAppointments = getDentistAppointments(dentist.dentist_id)
            const isWorkingDay = isDentistWorkingDay(dentist, dayIndex)
            const dentistTimeSlots = generateDentistTimeSlots(dentist)

            // Only show doctors who have appointments on this day or are working
            if (dentistAppointments.length === 0 && !isWorkingDay) {
              return null
            }

            return (
              <Card key={dentist.dentist_id} className="min-h-[400px]">
                <CardHeader className="pb-4">
                  {/* Doctor Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${dentist.profile_picture}` || "/placeholder.svg"} />
                      <AvatarFallback className="text-sm">
                        {dentist.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{dentist.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>${dentist.appointment_fee}</span>
                        <span>•</span>
                        <span>{dentist.appointment_duration}min slots</span>
                      </div>
                    </div>
                  </div>

                  {/* Working Status */}
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant={isWorkingDay ? "default" : "secondary"} className="text-xs">
                      {isWorkingDay ? "Working Today" : "Off Today"}
                    </Badge>
                    {isWorkingDay && (
                      <Badge variant="outline" className="text-xs">
                        {dentist.work_time_from} - {dentist.work_time_to}
                      </Badge>
                    )}
                  </div>

                  {/* Appointment Count */}
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{dentistAppointments.length}</span> appointments today
                    {isWorkingDay && (
                      <span className="ml-2 text-xs">• {dentistTimeSlots.length} total slots available</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  {dentistAppointments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {isWorkingDay ? (
                        <div>
                          <p className="text-sm">No appointments scheduled</p>
                          <p className="text-xs mt-1">All slots available</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm">Not working today</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Sort appointments by time */}
                      {dentistAppointments
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((appointment) => (
                          <div key={appointment.id} className="flex items-start gap-3">
                            <div className="w-16 text-sm font-medium text-gray-600 flex-shrink-0 pt-3">
                              {appointment.time}
                            </div>
                            <div className="flex-1">{getAppointmentContent(appointment)}</div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Doctor Details */}
                  <div className="mt-6 pt-4 border-t space-y-2 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Services:</span>
                      <div className="mt-1 text-xs leading-relaxed">{dentist.service_types}</div>
                    </div>
                    <div>
                      <span className="font-medium">Languages:</span> {dentist.language}
                    </div>
                    <div>
                      <span className="font-medium">Contact:</span> {dentist.phone_number}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
