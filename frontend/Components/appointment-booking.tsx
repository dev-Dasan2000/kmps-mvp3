"use client"

import { useContext, useEffect, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, Plus, Search, Filter, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { DoctorScheduleColumn } from "./doctor-schedule-column"
import { RoomView } from "./room-view"
import { ListView } from "./list-view"
import { Dentist, type DayOfWeek } from "@/types/dentist"
import { AppointmentDialog } from '@/components/AppointmentDialog'
import { AuthContext } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import axios from "axios"

// Helper function to get current date as string
const getCurrentDateString = () => {
  return new Date().toISOString().split("T")[0]
}

export default function AppointmentBooking() {
  const [selectedDate, setSelectedDate] = useState(getCurrentDateString())
  const [viewMode, setViewMode] = useState<"day" | "week">("week")
  const [calendarView, setCalendarView] = useState<"week" | "room" | "list">("week")
  const [searchQuery, setSearchQuery] = useState("")
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedWeekDate, setSelectedWeekDate] = useState(getCurrentDateString()) // For week navigation
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dentists, setDentists] = useState<Dentist[]>([]);

  const [loadingDentists, setLoadingDentists] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const {isLoadingAuth, isLoggedIn, user} = useContext(AuthContext); 

  const router = useRouter();
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const fetchDentists = async() => {
    setLoadingDentists(true);
    try{
      const response = await axios.get(
        `${backendURL}/dentists`
      );
      if(response.status == 500){
        throw new Error("Error Fetching Dentists");
      }
      setDentists(response.data);
    }
    catch(err: any){
      window.alert(err.message);
    }
    finally{
      setLoadingDentists(false);
    }
  }

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
    fetchDentists();
  },[isLoadingAuth]);


  const filteredDentists = dentists.filter(
    (dentist) =>
      dentist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dentist.service_types?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Generate week days based on selected week
  const generateWeekDays = (baseDate: string): DayOfWeek[] => {
    const base = new Date(baseDate)
    const startOfWeek = new Date(base)
    startOfWeek.setDate(base.getDate() - base.getDay() + 1) // Start from Monday

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      return {
        name: dayNames[date.getDay()],
        date: date.toISOString().split("T")[0],
        dayIndex: date.getDay(),
      }
    })
  }
  

  const weekDays = generateWeekDays(selectedWeekDate)

  const formatSelectedDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    })
  }

  const formatWeekRange = (weekDays: DayOfWeek[]) => {
    if (weekDays.length === 0) return ""
    const startDate = new Date(weekDays[0].date)
    const endDate = new Date(weekDays[6].date)

    return `${startDate.getDate()} - ${endDate.getDate()} ${endDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })}`
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = date.toISOString().split("T")[0]
      setSelectedDate(formattedDate)
      if (viewMode === "week") {
        setSelectedWeekDate(formattedDate)
      }
      setCalendarOpen(false)
    }
  }

  const handleAppointmentCreated = () => {
    // Close the dialog
    setIsDialogOpen(false);
    
    // Show success message
    toast.success("Appointment created successfully!");
    
    // Increment the refresh key to force re-render of all DoctorScheduleColumn components
    // This will make each column refetch its appointments
    setRefreshKey(prev => prev + 1);
  };

  const handleWeekNavigation = (direction: "prev" | "next") => {
    const currentWeek = new Date(selectedWeekDate)
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() + (direction === "next" ? 7 : -7))
    setSelectedWeekDate(newWeek.toISOString().split("T")[0])
  }

  const handleDaySelect = (date: string) => {
    setSelectedDate(date)
    if (viewMode === "week") {
      setViewMode("day")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search appointments"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white text-sm"
              />
            </div>
            <div className="flex gap-2 ">
             
             <Button 
            className="bg-emerald-500 hover:bg-emerald-600 text-white w-full"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Appointment
          </Button>
            </div>
          </div>
        </div>

        {/* Date and View Controls */}
        <div className="flex flex-col gap-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {/* Date Picker */}
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="font-medium">{formatSelectedDate(selectedDate)}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={new Date(selectedDate)}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* View Mode Toggle */}
              <div className="flex rounded-lg p-1 ">
                <Button
                 // variant={viewMode === "day" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("day")}
                    className={`flex items-center text-sm ${
    viewMode === "day" ? 'bg-green-500 text-white hover:bg-green-600' :'bg-white text-black border hover:bg-green-100 '
  }`}
                >
                  By day
                </Button>
                <Button
                 // variant={viewMode === "week" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("week")}
                  className={`flex items-center  text-sm ${
    viewMode === "week" ?  'bg-green-500 text-white hover:bg-green-600' :'bg-white text-black border hover:bg-green-100' }`}
                >
                  By Week
                </Button>
              </div>
            </div>

            {/* Calendar View Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-sm">
                  <span className="hidden sm:inline">
                    {calendarView === "week" ? "Calendar view" : calendarView === "room" ? "Room view" : "List view"}
                  </span>
                  <span className="sm:hidden">
                    {calendarView === "week" ? "Calendar" : calendarView === "room" ? "Room" : "List"}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setCalendarView("week")}>Calendar View </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCalendarView("room")}>Room View</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCalendarView("list")}>List View</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Week Days Navigation - Show for all views except list */}
          {calendarView !== "list" && (
            <div className="bg-white rounded-lg border p-3 sm:p-4">
              {/* Week Header with Navigation */}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <Button variant="ghost" size="sm" onClick={() => handleWeekNavigation("prev")} className="p-1 sm:p-2">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 text-center">
                  {formatWeekRange(weekDays)}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => handleWeekNavigation("next")} className="p-1 sm:p-2">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Week Days */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {weekDays.map((day, index) => {
                  const isSelected = day.date === selectedDate
                  const isToday = day.date === new Date().toISOString().split("T")[0]

                  return (
                    <button
                      key={index}
                      onClick={() => handleDaySelect(day.date)}
                      className={`p-2 sm:p-3 rounded-lg text-center transition-colors ${
                        isSelected
                          ? "bg-blue-500 text-white"
                          : isToday
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-medium">{day.name}</div>
                      <div className="text-xs sm:text-sm mt-1">{new Date(day.date).getDate()}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Day View Header */}
        {viewMode === "day" && calendarView !== "list" && (
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              {new Date(selectedDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Daily appointments view</p>
          </div>
        )}

        {/* Content based on calendar view */}
        {calendarView === "room" ? (
          <RoomView weekDays={weekDays} selectedDate={selectedDate} viewMode={viewMode} />
        ) : calendarView === "list" ? (
          <ListView selectedDate={selectedDate} />
        ) : (
          /* Doctor Schedule Columns */
          <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-4">
            {filteredDentists?.map((dentist) => (
              <DoctorScheduleColumn
                key={`${dentist.dentist_id}-${refreshKey}`}
                dentist={dentist}
                weekDays={weekDays}
                selectedWeek={formatWeekRange(weekDays)}
                viewMode={viewMode}
                selectedDate={selectedDate}
              />
            ))}
          </div>
        )}

        {/* No doctors found message */}
        {calendarView === "week" && filteredDentists.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-500 text-sm sm:text-base">No doctors found matching your search criteria.</p>
          </div>
        )}
        {/* Appointment Dialog */}
                <AppointmentDialog
                  open={isDialogOpen}
                  onOpenChange={setIsDialogOpen}
                  onAppointmentCreated={handleAppointmentCreated}
                />
      </div>
    </div>
  )
}