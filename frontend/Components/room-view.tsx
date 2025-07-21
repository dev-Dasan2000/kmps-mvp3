"use client"

import { Card, CardContent } from "@/components/ui/card"
import { getDoctorColor } from "@/lib/mock-data"
import type { DayOfWeek } from "@/types/dentist"
import axios from "axios"
import { useContext, useEffect, useState } from "react"
import { toast } from "sonner"
import { AuthContext } from "@/context/auth-context"

interface RoomViewProps {
  weekDays: DayOfWeek[]
  selectedDate: string
  viewMode: "day" | "week"
}

interface RoomAssignment {
  room_id: string
  dentist_id: string
  date: string
  time_from: string
  time_to: string
  rooms: {
    room_id: string
    description: string
  }
  dentists: {
    dentist_id: string
    name: string
    email: string
    phone_number: string | null
    profile_picture: string | null
    language: string | null
    service_types: string | null
    work_days_from: string | null
    work_days_to: string | null
    work_time_from: string | null
    work_time_to: string | null
    appointment_duration: string | null
    appointment_fee: string | null
  }
}

export function RoomView({ weekDays, selectedDate, viewMode }: RoomViewProps) {
  const {apiClient} = useContext(AuthContext);
  const [loadingRoomAssignments, setLoadingRoomAssignments] = useState(false)
  const [roomAssignments, setRoomAssignments] = useState<RoomAssignment[]>([])
  const [rooms, setRooms] = useState<{ room_id: string; description: string }[]>([])

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL

  const fetchRoomAssignments = async () => {
    setLoadingRoomAssignments(true);
    try {
      // First, fetch all rooms
      const [assignmentsResponse, roomsResponse] = await Promise.all([
        apiClient.get(`/rooms-assign/`),
        apiClient.get(`/rooms/`)
      ]);

      if (assignmentsResponse.status === 200 && roomsResponse.status === 200) {
        const assignments = assignmentsResponse.data;
        const allRooms = roomsResponse.data;

        // Update room assignments with proper typing
        const formattedAssignments: RoomAssignment[] = assignments.map((assignment: any) => ({
          ...assignment,
          date: new Date(assignment.date).toISOString().split('T')[0], // Format date to YYYY-MM-DD
          time_from: assignment.time_from,
          time_to: assignment.time_to,
          rooms: assignment.rooms || { room_id: assignment.room_id, description: '' },
          dentists: assignment.dentists || { 
            dentist_id: assignment.dentist_id, 
            name: 'Unknown Dentist',
            email: '',
            phone_number: null,
            profile_picture: null,
            language: null,
            service_types: null,
            work_days_from: null,
            work_days_to: null,
            work_time_from: null,
            work_time_to: null,
            appointment_duration: null,
            appointment_fee: null
          }
        }));

        setRoomAssignments(formattedAssignments);
        setRooms(allRooms);
      } else {
        throw new Error("Failed to fetch data");
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      toast.error("Error", { 
        description: err.response?.data?.error || err.message || "Failed to load room assignments" 
      });
    } finally {
      setLoadingRoomAssignments(false);
    }
  }

  useEffect(() => {
    fetchRoomAssignments()
  }, [])

  // Filter days based on view mode
  const displayDays = viewMode === "day" ? weekDays.filter((day) => day.date === selectedDate) : weekDays

  // Get room assignments for specific room and date
  const getRoomAssignmentsForDay = (roomId: string, date: string) => {
    return roomAssignments.filter((assignment) => {
      try {
        const assignmentDate = new Date(assignment.date).toISOString().split('T')[0];
        const targetDate = new Date(date).toISOString().split('T')[0];
        return assignment.room_id === roomId && assignmentDate === targetDate;
      } catch (error) {
        console.error('Error processing assignment date:', error);
        return false;
      }
    }).sort((a, b) => {
      // Sort by time_from
      return a.time_from.localeCompare(b.time_from);
    });
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  if (loadingRoomAssignments) {
    return (
      <Card className="bg-white">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading room assignments...</p>
        </CardContent>
      </Card>
    )
  }

  if (viewMode === "day") {
    return (
      <Card className="bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {/* Header Row - Single Day */}
            <div className="border-b bg-gray-50">
              <div className="text-center p-3 sm:p-4 border-b bg-blue-50">
                <div className="font-medium text-sm sm:text-base">{formatDate(selectedDate)}</div>
              </div>

              {/* Room Headers */}
              <div
                className={`grid border-b bg-gray-100`}
                style={{
                  gridTemplateColumns: `repeat(${rooms.length}, 1fr)`,
                }}
              >
                {rooms.map((room) => (
                  <div
                    key={room.room_id}
                    className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium text-gray-700 border-r last:border-r-0"
                  >
                    {room.room_id}
                  </div>
                ))}
              </div>
            </div>

            {/* Assignment Content */}
            <div
              className={`grid min-h-[400px]`}
              style={{
                gridTemplateColumns: `repeat(${rooms.length}, 1fr)`,
              }}
            >
              {rooms.map((room) => {
                const assignments = getRoomAssignmentsForDay(room.room_id, selectedDate)

                return (
                  <div key={room.room_id} className="p-2 border-r last:border-r-0 space-y-2">
                    {assignments.length > 0 ? (
                      assignments.map((assignment, index) => {
                        const colorClass = getDoctorColor(assignment.dentist_id)

                        return (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border-2 cursor-pointer hover:shadow-md transition-shadow ${colorClass}`}
                          >
                            <div className="font-semibold text-sm mb-1">{assignment.dentists.name}</div>
                            <div className="text-xs text-gray-600 mb-1">
                              {assignment.time_from} - {assignment.time_to}
                            </div>
                            <div className="text-xs text-gray-500">{assignment.dentists.service_types}</div>
                            
                          </div>
                        )
                      })
                    ) : (
                      <div 
                        className="p-3 text-center text-xs text-gray-500 bg-gray-50 rounded border-2 border-dashed border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => {
                          console.log('Add new assignment for:', room.room_id, selectedDate);
                        }}
                      >
                        Available
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Week View - New Layout
  return (
    <Card className="bg-white">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {/* Week View Header */}
          <div className="grid grid-cols-8 bg-gray-50 border-b">
            <div className="p-3 text-center font-medium text-sm border-r bg-blue-50">Room</div>
            {displayDays.map((day) => (
              <div key={day.date} className="p-3 text-center font-medium text-sm border-r last:border-r-0 bg-blue-50">
                <div>{formatDateShort(day.date)}</div>
              </div>
            ))}
          </div>

          {/* Week View Content */}
          {rooms.map((room, roomIndex) => (
            <div key={room.room_id} className={`grid grid-cols-8 ${roomIndex < rooms.length - 1 ? 'border-b' : ''}`}>
              {/* Room Name Column */}
              <div className="p-3 text-center font-medium text-sm bg-gray-100 border-r flex items-center justify-center min-h-[120px]">
                {room.room_id}
              </div>
              
              {/* Days Columns */}
              {displayDays.map((day) => {
                const assignments = getRoomAssignmentsForDay(room.room_id, day.date);
                
                return (
                  <div key={`${room.room_id}-${day.date}`} className="p-2 border-r last:border-r-0 min-h-[120px]">
                    <div className="space-y-1">
                      {assignments.length > 0 ? (
                        assignments.map((assignment, index) => {
                          const colorClass = getDoctorColor(assignment.dentist_id);
                          
                          return (
                            <div
                              key={index}
                              className={`p-2 rounded text-xs cursor-pointer hover:shadow-sm transition-shadow ${colorClass}`}
                            >
                              <div className="font-medium mb-1">{assignment.dentists.name}</div>
                              <div className="text-gray-600 mb-1">
                                {assignment.time_from} - {assignment.time_to}
                              </div>
                              <div className="text-gray-500">{assignment.dentists.service_types}</div>
                             
                            </div>
                          );
                        })
                      ) : (
                        <div 
                          className="p-2 text-center text-xs text-gray-500 bg-gray-50 rounded border border-dashed border-gray-300 hover:bg-gray-100 transition-colors cursor-pointer h-full flex items-center justify-center"
                          onClick={() => {
                            console.log('Add new assignment for:', room.room_id, day.date);
                          }}
                        >
                          Available
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Summary Information */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
              <span>Room Assignments ({roomAssignments.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-50 border border-dashed border-gray-300 rounded"></div>
              <span>Available Slots</span>
            </div>
            <div className="text-gray-500">Rooms: {rooms.map((room) => room.room_id).join(", ")}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}