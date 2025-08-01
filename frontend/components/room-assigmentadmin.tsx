"use client"

import { useState, useEffect, useContext } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Plus, Calendar, Clock, User, Building, Search, CalendarIcon, X, Edit, Trash2 } from "lucide-react"
import type { RoomAssignment } from "@/types/dentist"
import axios from "axios"
import { toast } from "sonner"
import { AuthContext } from "@/context/auth-context"

interface Dentist {
  dentist_id: string
  name: string
  email?: string
  phone?: string
}

interface Room {
  room_id: string
  description: string
}

interface ExtendedRoomAssignment extends RoomAssignment {
  id: string
  dentist_name?: string
  room_description?: string
}

export function RoomAssignment({ refreshKey }: { refreshKey: number }) {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL
  const { apiClient } = useContext(AuthContext);
  const [assignments, setAssignments] = useState<ExtendedRoomAssignment[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<ExtendedRoomAssignment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState<string>("")
  const [viewFilter, setViewFilter] = useState<"today" | "all" | "custom">("today")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<ExtendedRoomAssignment | null>(null)
  const [loading, setLoading] = useState(false)
  const [dentists, setDentists] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])

  // Form state
  const [formData, setFormData] = useState({
    dentist_id: "",
    date: "",
    time_from: "",
    time_to: "",
  })

  // Fetch dentists from backend
  const fetchDentists = async () => {
    try {
      const response = await apiClient.get(`/dentists`)
      setDentists(response.data)
    } catch (error) {
      console.error("Failed to fetch dentists:", error)
      toast.error("Failed to load dentists")
    }
  }

  // Delete room
  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.delete(`/rooms/${roomId}`);
      toast.success('Room deleted successfully');
      fetchRooms(); // Refresh the rooms list
      fetchAssignments(); // Refresh assignments as well
    } catch (error) {
      console.error('Failed to delete room:', error);
      toast.error('Failed to delete room. Please try again.');
    }
  };

  // Fetch rooms from backend
  const fetchRooms = async () => {
    try {
      const response = await apiClient.get(`/rooms`)
      setRooms(response.data)
    } catch (error) {
      console.error("Failed to fetch rooms:", error)
      toast.error("Failed to load rooms")
    }
  }

  // Fetch room assignments from backend
  const fetchAssignments = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get(`/rooms-assign`)

      // Transform the data to match the ExtendedRoomAssignment interface
      const extendedAssignments: ExtendedRoomAssignment[] = response.data.map((assignment: any, index: number) => {
        const dentist = dentists.find((d: Dentist) => d.dentist_id === assignment.dentist_id)
        const room = rooms.find((r: Room) => r.room_id === assignment.room_id)

        const dateObj = new Date(assignment.date)
        const formattedDate = dateObj.toISOString().split('T')[0]

        return {
          ...assignment,
          id: `assignment_${index + 1}`,
          dentist_name: dentist?.name || "Unknown Dentist",
          room_description: room?.description || "Unknown Room",
          date: formattedDate,
        }
      })

      setAssignments(extendedAssignments)
    } catch (error) {
      console.error("Failed to fetch room assignments:", error)
      toast.error("Failed to load room assignments")
    } finally {
      setLoading(false)
    }
  }

  // Initialize data
  useEffect(() => {
    fetchDentists()
    fetchRooms()
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [refreshKey])

  // Fetch assignments after dentists and rooms are loaded
  useEffect(() => {
    if (dentists.length > 0 && rooms.length > 0) {
      fetchAssignments()
    }
  }, [dentists, rooms])

  // Filter assignments based on search, date, and view filter
  useEffect(() => {
    let filtered = [...assignments]

    // Filter by search term first
    if (searchTerm) {
      filtered = filtered.filter(
        (assignment) =>
          assignment.dentist_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assignment.room_description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Create a function to normalize dates to YYYY-MM-DD in local timezone
    const toLocalDateString = (date: Date | string) => {
      const d = new Date(date);
      // Use toLocaleDateString with timezone to get consistent local date
      return d.toLocaleDateString('en-CA'); // 'en-CA' gives YYYY-MM-DD format
    };

    const today = toLocalDateString(new Date());
    const selectedDateStr = toLocalDateString(selectedDate);

    if (viewFilter === "today") {
      filtered = filtered.filter((assignment) => {
        // Ensure we're comparing dates in the same timezone
        const assignmentDate = toLocalDateString(assignment.date);
        return assignmentDate === today;
      });
    } else if (viewFilter === "all") {
      // Show all assignments, no date filtering
    } else {
      // Show assignments for the selected date
      filtered = filtered.filter((assignment) => {
        // Compare dates in local timezone
        const assignmentDate = toLocalDateString(assignment.date);
        return assignmentDate === selectedDateStr;
      });
    }

    setFilteredAssignments(filtered)
  }, [assignments, searchTerm, selectedDate, viewFilter])

  // Check for overlapping time slots
  const hasTimeSlotOverlap = (
    roomId: string,
    date: string,
    timeFrom: string,
    timeTo: string,
    excludeAssignmentId?: string,
    dentistId?: string,
    strictDentistCheck = true
  ) => {
    const newStart = new Date(`${date}T${timeFrom}`).getTime();
    const newEnd = new Date(`${date}T${timeTo}`).getTime();

    return assignments.some((assignment) => {
      if (excludeAssignmentId && assignment.id === excludeAssignmentId) return false;

      const sameDay = assignment.date === date;
      const sameRoom = assignment.room_id === roomId;
      const sameDentist = assignment.dentist_id === dentistId;

      if (!sameDay) return false;

      const existingStart = new Date(`${assignment.date}T${assignment.time_from}`).getTime();
      const existingEnd = new Date(`${assignment.date}T${assignment.time_to}`).getTime();
      const overlap = newStart < existingEnd && newEnd > existingStart;

      if (strictDentistCheck) {
        return sameDentist && overlap; // Check across all rooms
      } else {
        return sameRoom && overlap; // Default: only room-level conflict
      }
    });
  };

  const handleAddAssignment = async () => {
    if (!selectedRoomId || !formData.dentist_id || !formData.date || !formData.time_from || !formData.time_to) {
      toast.error("Please fill all required fields")
      return
    }

    // Validate time range
    if (formData.time_from >= formData.time_to) {
      toast.error("End time must be after start time")
      return
    }

    // Check for overlapping time slots
    if (hasTimeSlotOverlap(selectedRoomId, formData.date, formData.time_from, formData.time_to, undefined, formData.dentist_id)) {
      toast.error("Time slot overlaps with an existing assignment")
      return
    }

    setLoading(true)
    try {
      const payload = {
        room_id: selectedRoomId,
        dentist_id: formData.dentist_id,
        date: formData.date,
        time_from: formData.time_from,
        time_to: formData.time_to,
      }
      await apiClient.post(`/rooms-assign`, payload)

      toast.success("Room assignment created successfully")
      fetchAssignments() // Refresh the assignments list
      resetForm()
      setIsAddDialogOpen(false)
      setSelectedRoomId("")
    } catch (error) {
      console.error("Failed to create room assignment:", error)
      toast.error("Failed to create room assignment")
    } finally {
      setLoading(false)
    }
  }

  const handleEditAssignment = async () => {
    if (!editingAssignment || !formData.dentist_id || !formData.date || !formData.time_from || !formData.time_to) {
      toast.error("Please fill all required fields")
      return
    }

    // Validate time range
    if (formData.time_from >= formData.time_to) {
      toast.error("End time must be after start time")
      return
    }

    // Check for overlapping time slots, excluding the current assignment being edited
    if (hasTimeSlotOverlap(editingAssignment.room_id, formData.date, formData.time_from, formData.time_to, editingAssignment.id, formData.dentist_id, false)) {
      toast.error("This room is already booked for the selected time slot")
      return
    }

    setLoading(true)
    try {
      // Interpret date-only string as UTC to avoid timezone offset issues
      const isoDate = new Date(`${formData.date}T00:00:00Z`).toISOString()
      // Get the original data for creating the URL
      const originalRoomId = editingAssignment.room_id
      const originalDentistId = editingAssignment.dentist_id
      const originalDate = encodeURIComponent(editingAssignment.date)
      const originalTimeFrom = encodeURIComponent(editingAssignment.time_from)
      const originalTimeTo = encodeURIComponent(editingAssignment.time_to)

      // The new data to update to
      const payload = {
        room_id: editingAssignment.room_id,
        dentist_id: formData.dentist_id,
        date: isoDate,
        time_from: formData.time_from,
        time_to: formData.time_to,
      }

      await apiClient.put(
        `/rooms-assign/${originalRoomId}/${originalDentistId}/${originalDate}/${originalTimeFrom}/${originalTimeTo}`,
        payload
      )

      toast.success("Room assignment updated successfully")
      fetchAssignments() // Refresh the assignments list
      resetForm()
      setIsEditDialogOpen(false)
      setEditingAssignment(null)
    } catch (error) {
      console.error("Failed to update room assignment:", error)
      toast.error("Failed to update room assignment")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId)
    if (!assignment) return

    setLoading(true)
    try {
      const roomId = assignment.room_id
      const dentistId = assignment.dentist_id
      const date = encodeURIComponent(assignment.date)
      const time_from = encodeURIComponent(assignment.time_from)
      const time_to = encodeURIComponent(assignment.time_to)

      await apiClient.delete(`/rooms-assign/${roomId}/${dentistId}/${date}/${time_from}/${time_to}`)

      toast.success("Room assignment deleted successfully")
      fetchAssignments() // Refresh the assignments list
    } catch (error) {
      console.error("Failed to delete room assignment:", error)
      toast.error("Failed to delete room assignment")
    } finally {
      setLoading(false)
    }
  }

  const openAddDialog = (roomId: string) => {
    setSelectedRoomId(roomId)
    setFormData({ dentist_id: "", date: "", time_from: "", time_to: "" })
    setIsAddDialogOpen(true)
  }

  const openEditDialog = (assignment: ExtendedRoomAssignment) => {
    setEditingAssignment(assignment)
    setFormData({
      dentist_id: assignment.dentist_id,
      date: assignment.date,
      time_from: assignment.time_from,
      time_to: assignment.time_to,
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({ dentist_id: "", date: "", time_from: "", time_to: "" })
    setSelectedRoomId("")
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (date: string) => {
    // Ensure consistent date formatting by using the full date string
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      timeZone: 'UTC', // Use UTC to prevent timezone shifting
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const getAssignmentsForRoom = (roomId: string) => {
    return filteredAssignments.filter((assignment) => assignment.room_id === roomId)
  }

  const selectedRoom = rooms.find((room) => room.room_id === selectedRoomId)

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header 
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 ">
          <div>
            <h1 className="text-2xl sm:text-3xl mt-7 md:mt-0 font-bold text-gray-900">
              Appointments 
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
              View and manage appointments.
            </p>
          </div>
        </div>*/}

        {/* Filter and Date Selection */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4 md:mb-6 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by dentist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-[50%] -translate-y-[50%] text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>



          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6 flex gap-36 md:gap-2">

            {/* Filter Dropdown */}
            <Select
              value={viewFilter}
              onValueChange={(value: "today" | "all") => {
                setViewFilter(value)
                // Reset selected date when changing view filter to today or all
                if (value === 'today' || value === 'all') {
                  setSelectedDate(new Date())
                }
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>


            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date)
                      // Set view filter to custom when a specific date is selected
                      setViewFilter('custom' as any)
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Current View Indicator */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>
              Showing assignments for:{" "}
              <span className="font-medium text-gray-900">
                {viewFilter === "today"
                  ? "Today"
                  : viewFilter === "all"
                    ? "All Assignments"
                    : selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
              </span>
            </span>
          </div>
        </div>

        {/* Room Columns Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {rooms.map((room: Room) => {
            const roomAssignments = getAssignmentsForRoom(room.room_id)

            return (
              <Card key={room.room_id} className="min-h-[400px]">
                <CardHeader className="pb-4">
                  {/* Room Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Building className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">{room.room_id}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {roomAssignments.length} assignment{roomAssignments.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAddDialog(room.room_id);
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 h-8 w-8"
                        title="Add assignment"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRoom(room.room_id);
                        }}
                        className="text-white hover:bg-red-600 p-2 h-8 w-8"
                        title="Delete room"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Assignments List */}
                  <div className="space-y-3">
                    {roomAssignments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Building className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm">No dentists assigned</p>
                        <p className="text-xs mt-1">Click + to add a dentist</p>
                      </div>
                    ) : (
                      roomAssignments.map((assignment) => {
                        const startTime = new Date(`2000-01-01T${assignment.time_from}`)
                        const endTime = new Date(`2000-01-01T${assignment.time_to}`)
                        const duration = ((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)).toFixed(1);

                        return (
                          <div
                            key={assignment.id}
                            className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                          >
                            {/* Dentist Info */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 rounded-full">
                                  <User className="w-3 h-3 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{assignment.dentist_name}</p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEditDialog(assignment)}
                                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 h-6 w-6"
                                  title="Edit assignment"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteAssignment(assignment.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6"
                                  title="Delete assignment"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Date and Time */}
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(assignment.date)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {formatTime(assignment.time_from)} - {formatTime(assignment.time_to)}
                                </span>
                              </div>
                            </div>

                            {/* Duration Badge */}
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                {duration}h duration
                              </Badge>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Empty State for No Rooms */}
        {(rooms.length === 0 || loading) && (
          <Card>
            <CardContent className="text-center py-12">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms available</h3>
              <p className="text-gray-600">Add rooms to start assigning dentists</p>
            </CardContent>
          </Card>
        )}

        {/* Add Assignment Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600" />
                Assign Dentist to {selectedRoom?.id}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Dentist Selection */}
              <div className="space-y-2">
                <Label htmlFor="dentist">Select Dentist</Label>
                <Select
                  value={formData.dentist_id}
                  onValueChange={(value) => setFormData({ ...formData, dentist_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a dentist" />
                  </SelectTrigger>
                  <SelectContent>
                    {dentists.map((dentist: Dentist) => (
                      <SelectItem key={dentist.dentist_id} value={dentist.dentist_id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <span>{dentist.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Time From */}
                <div className="space-y-2">
                  <Label htmlFor="time_from">Start Time</Label>
                  <Input
                    type="time"
                    value={formData.time_from}
                    onChange={(e) => setFormData({ ...formData, time_from: e.target.value })}
                  />
                </div>

                {/* Time To */}
                <div className="space-y-2">
                  <Label htmlFor="time_to">End Time</Label>
                  <Input
                    type="time"
                    value={formData.time_to}
                    onChange={(e) => setFormData({ ...formData, time_to: e.target.value })}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm()
                    setIsAddDialogOpen(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddAssignment}
                  className="bg-emerald-500 hover:bg-emerald-600"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Assign Dentist"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Assignment Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                Edit Assignment - {editingAssignment?.room_id}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Dentist Selection */}
              <div className="space-y-2">
                <Label htmlFor="dentist">Select Dentist</Label>
                <Select
                  value={formData.dentist_id}
                  onValueChange={(value) => setFormData({ ...formData, dentist_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a dentist" />
                  </SelectTrigger>
                  <SelectContent>
                    {dentists.map((dentist: Dentist) => (
                      <SelectItem key={dentist.dentist_id} value={dentist.dentist_id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <span>{dentist.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Time From */}
                <div className="space-y-2">
                  <Label htmlFor="time_from">Start Time</Label>
                  <Input
                    type="time"
                    value={formData.time_from}
                    onChange={(e) => setFormData({ ...formData, time_from: e.target.value })}
                  />
                </div>

                {/* Time To */}
                <div className="space-y-2">
                  <Label htmlFor="time_to">End Time</Label>
                  <Input
                    type="time"
                    value={formData.time_to}
                    onChange={(e) => setFormData({ ...formData, time_to: e.target.value })}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm()
                    setIsEditDialogOpen(false)
                    setEditingAssignment(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditAssignment}
                  className="bg-blue-500 hover:bg-blue-600"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Assignment"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
