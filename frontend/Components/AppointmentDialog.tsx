'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from "sonner"
import axios from 'axios'

interface Patient {
  patient_id: string
  name: string
  email: string
  phone_number: string
}

interface Dentist {
  dentist_id: string
  name: string
  email: string
  phone_number: string
  service_types: string
  work_days_from: string
  work_days_to: string
  work_time_from: string
  work_time_to: string
  appointment_duration: string
  appointment_fee: number
}

interface TimeSlot {
  start: string
  end: string
}

interface AppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAppointmentCreated: () => void
}

export function AppointmentDialog({ open, onOpenChange, onAppointmentCreated }: AppointmentDialogProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [dentists, setDentists] = useState<Dentist[]>([])
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [dateString, setDateString] = useState<string>('')
  const [debugInfo, setDebugInfo] = useState<string>('') // Added for debugging
  
  const [formData, setFormData] = useState({
    patientId: '',
    dentistId: '',
    timeSlot: '',
    note: ''
  })

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Helper function to generate time slots based on work hours and duration
  const generateTimeSlots = (workTimeFrom: string, workTimeTo: string, duration: string): TimeSlot[] => {
    const slots: TimeSlot[] = []
    
    console.log('🔍 Generating slots with:', { workTimeFrom, workTimeTo, duration })
    
    // More robust duration parsing
    const durationMatch = duration.match(/(\d+)/)
    const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 30
    
    if (durationMinutes <= 0) {
      console.warn('⚠️ Invalid duration:', duration)
      return slots
    }
    
    console.log('⏱️ Parsed duration minutes:', durationMinutes)
    
    // Enhanced time parsing function
    const parseTime = (timeStr: string): { hours: number, minutes: number } | null => {
      if (!timeStr || typeof timeStr !== 'string') {
        console.warn('⚠️ Invalid time string:', timeStr)
        return null
      }
      
      let cleanTime = timeStr.trim()
      
      // Handle AM/PM format
      const isPM = /PM/i.test(cleanTime)
      const isAM = /AM/i.test(cleanTime)
      
      // Extract just the time part (digits and colon)
      cleanTime = cleanTime.replace(/[^\d:]/g, '')
      
      if (!cleanTime.includes(':')) {
        // Handle cases like "9" -> "9:00"
        cleanTime = cleanTime + ':00'
      }
      
      const [hoursStr, minutesStr = '0'] = cleanTime.split(':')
      let hours = parseInt(hoursStr)
      const minutes = parseInt(minutesStr) || 0
      
      if (isNaN(hours) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.warn('⚠️ Invalid time components:', { hours, minutes, original: timeStr })
        return null
      }
      
      // Convert 12-hour to 24-hour format
      if (isPM && hours !== 12) {
        hours += 12
      } else if (isAM && hours === 12) {
        hours = 0
      }
      
      // Ensure hours are within valid range after AM/PM conversion
      if (hours > 23) hours = 23
      if (hours < 0) hours = 0
      
      return { hours, minutes }
    }
    
    const startTime = parseTime(workTimeFrom)
    const endTime = parseTime(workTimeTo)
    
    if (!startTime || !endTime) {
      console.error('❌ Failed to parse work times:', { workTimeFrom, workTimeTo })
      return slots
    }
    
    console.log('🕐 Parsed times:', { startTime, endTime })
    
    // Convert to minutes for easier calculation
    let currentMinutes = startTime.hours * 60 + startTime.minutes
    const endMinutes = endTime.hours * 60 + endTime.minutes
    
    console.log('📊 Time in minutes:', { currentMinutes, endMinutes })
    
    // Handle case where end time is next day (e.g., night shift)
    const actualEndMinutes = endMinutes <= currentMinutes ? endMinutes + 24 * 60 : endMinutes
    
    let slotCount = 0
    const maxSlots = 50 // Safety limit to prevent infinite loops
    
    while (currentMinutes + durationMinutes <= actualEndMinutes && slotCount < maxSlots) {
      const startHours = Math.floor(currentMinutes / 60) % 24
      const startMins = currentMinutes % 60
      
      const endSlotMinutes = currentMinutes + durationMinutes
      const endHours = Math.floor(endSlotMinutes / 60) % 24
      const endMins = endSlotMinutes % 60
      
      const formatTime = (hours: number, minutes: number): string => {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      }
      
      slots.push({
        start: formatTime(startHours, startMins),
        end: formatTime(endHours, endMins)
      })
      
      currentMinutes += durationMinutes
      slotCount++
    }
    
    if (slotCount >= maxSlots) {
      console.warn('⚠️ Hit maximum slot limit, possible infinite loop prevented')
    }
    
    console.log('✅ Generated slots:', slots)
    return slots
  }

  // Check if selected date is within dentist's working days
  const isWorkingDay = (date: Date, dentist: Dentist): boolean => {
    if (!dentist || !dentist.work_days_from || !dentist.work_days_to) {
      console.warn('⚠️ Invalid dentist working days data:', dentist)
      return false
    }
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const selectedDay = dayNames[date.getDay()]
    
    const workDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const fromIndex = workDays.indexOf(dentist.work_days_from)
    const toIndex = workDays.indexOf(dentist.work_days_to)
    const selectedIndex = workDays.indexOf(selectedDay)
    
    if (fromIndex === -1 || toIndex === -1 || selectedIndex === -1) {
      console.warn('⚠️ Invalid day names:', { 
        from: dentist.work_days_from, 
        to: dentist.work_days_to, 
        selected: selectedDay 
      })
      return true // Default to true if we can't parse the days
    }
    
    let isWorking: boolean
    if (fromIndex <= toIndex) {
      isWorking = selectedIndex >= fromIndex && selectedIndex <= toIndex
    } else {
      // Handle case where work days span across week (e.g., Saturday to Monday)
      isWorking = selectedIndex >= fromIndex || selectedIndex <= toIndex
    }
    
    console.log('📅 Working day check:', { 
      selectedDay, 
      workFrom: dentist.work_days_from, 
      workTo: dentist.work_days_to, 
      isWorking 
    })
    
    return isWorking
  }

  // Fetch patients and dentists on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setDebugInfo('Fetching patients and dentists...')
        const [patientsRes, dentistsRes] = await Promise.all([
          axios.get(`${backendURL}/patients`),
          axios.get(`${backendURL}/dentists`)
        ])
        setPatients(patientsRes.data)
        setDentists(dentistsRes.data)
        setDebugInfo(`Loaded ${patientsRes.data.length} patients and ${dentistsRes.data.length} dentists`)
        console.log('✅ Loaded data:', { patients: patientsRes.data.length, dentists: dentistsRes.data.length })
      } catch (error) {
        console.error('❌ Error fetching data:', error)
        setDebugInfo('Error loading data: ' + (error as Error).message)
      }
    }

    if (open) {
      fetchData()
    }
  }, [open, backendURL])

  // Fetch specific dentist details when dentist is selected
  useEffect(() => {
    const fetchDentistDetails = async () => {
      if (!formData.dentistId) {
        setSelectedDentist(null)
        setDebugInfo('')
        return
      }
      
      try {
        setDebugInfo('Loading dentist details...')
        console.log('🔍 Fetching dentist details for ID:', formData.dentistId)
        const response = await axios.get(`${backendURL}/dentists/${formData.dentistId}`)
        console.log('✅ Dentist details loaded:', response.data)
        setSelectedDentist(response.data)
        setDebugInfo(`Loaded dentist: Dr. ${response.data.name}`)
      } catch (error) {
        console.error('❌ Error fetching dentist details:', error)
        setSelectedDentist(null)
        setDebugInfo('Error loading dentist details: ' + (error as Error).message)
      }
    }
    
    fetchDentistDetails()
  }, [formData.dentistId, backendURL])

  // Generate time slots when dentist details are loaded or date changes
  useEffect(() => {
    const generateAllSlots = async () => {
      console.log('🔄 generateAllSlots triggered:', { 
        hasDentist: !!selectedDentist, 
        hasDate: !!dateString,
        dentistId: selectedDentist?.dentist_id,
        date: dateString
      })
      
      if (!selectedDentist || !dateString) {
        setTimeSlots([])
        setDebugInfo(!selectedDentist ? 'No dentist selected' : 'No date selected')
        return
      }
      
      const selectedDate = new Date(dateString)
      
      // Validate dentist schedule data
      if (!selectedDentist.work_time_from || !selectedDentist.work_time_to || !selectedDentist.appointment_duration) {
        console.error('❌ Missing dentist schedule data:', {
          work_time_from: selectedDentist.work_time_from,
          work_time_to: selectedDentist.work_time_to,
          appointment_duration: selectedDentist.appointment_duration
        })
        setTimeSlots([])
        setDebugInfo('Error: Dentist schedule data is incomplete')
        return
      }
      
      // Check if selected date is a working day
      if (!isWorkingDay(selectedDate, selectedDentist)) {
        setTimeSlots([])
        setDebugInfo(`${selectedDate.toLocaleDateString()} is not a working day`)
        return
      }
      
      setDebugInfo('Generating all time slots...')
      
      // Generate all possible time slots based on dentist's schedule
      const allSlots = generateTimeSlots(
        selectedDentist.work_time_from,
        selectedDentist.work_time_to,
        selectedDentist.appointment_duration
      )
      
      console.log('📋 All generated slots:', allSlots)
      
      if (allSlots.length === 0) {
        setTimeSlots([])
        setDebugInfo('No time slots could be generated from dentist schedule')
        return
      }
      
      // ---------------- Fetch already reserved intervals ----------------
      let takenIntervals: { start: string; end: string }[] = []
      try {
        const [appointmentsRes, blockedRes] = await Promise.all([
          axios.get(`${backendURL}/appointments/fordentist/${selectedDentist.dentist_id}`),
          axios.get(`${backendURL}/blocked-dates/fordentist/${selectedDentist.dentist_id}`)
        ])

        // Appointments on selected date
        appointmentsRes.data?.forEach((appt: any) => {
          const apptDate = new Date(appt.date).toISOString().split('T')[0]
          if (apptDate === dateString) {
            takenIntervals.push({ start: appt.time_from, end: appt.time_to })
          }
        })

        // Blocked slots on selected date
        blockedRes.data?.forEach((blk: any) => {
          if (blk.date === dateString) {
            if (blk.time_from && blk.time_to) {
              takenIntervals.push({ start: blk.time_from, end: blk.time_to })
            } else {
              // Whole day blocked
              takenIntervals.push({ start: '00:00', end: '23:59' })
            }
          }
        })
      } catch (err) {
        console.error('❌ Error fetching reserved intervals:', err)
      }

      const toMinutes = (t: string) => {
        const [h, m] = t.split(':').map((n: string) => parseInt(n))
        return h * 60 + (m || 0)
      }

      const isOverlap = (
        slotStart: string,
        slotEnd: string,
        rangeStart: string,
        rangeEnd: string
      ) => {
        return toMinutes(slotStart) < toMinutes(rangeEnd) && toMinutes(slotEnd) > toMinutes(rangeStart)
      }

      const availableSlots = allSlots.filter(
        (slot) => !takenIntervals.some((iv) => isOverlap(slot.start, slot.end, iv.start, iv.end))
      )

      if (availableSlots.length === 0) {
        setTimeSlots([])
        setDebugInfo('No available time slots for the selected date')
        return
      }

      setTimeSlots(availableSlots)
      setDebugInfo(`Showing ${availableSlots.length} available time slots`)
      console.log('✅ Available slots:', availableSlots)
    }
    
    generateAllSlots()
  }, [selectedDentist, dateString, backendURL])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.patientId || !formData.dentistId || !formData.timeSlot || !dateString) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      const [startTime, endTime] = formData.timeSlot.split(' - ')
      
      await axios.post(`${backendURL}/appointments`, {
        patient_id: formData.patientId,
        dentist_id: formData.dentistId,
        date: dateString,
        time_from: startTime,
        time_to: endTime,
        note: formData.note,
        fee: selectedDentist?.appointment_fee
      })
      
      onAppointmentCreated()
      onOpenChange(false)
      // Reset form
      setFormData({
        patientId: '',
        dentistId: '',
        timeSlot: '',
        note: ''
      })
      setDateString('')
      setSelectedDentist(null)
      setDebugInfo('')
    } catch (error: any) {
      console.error('Error creating appointment:', error)
      if (error.response) {
        // Handle specific error cases
        if (error.response.status === 400 || error.response.status === 409) {
          // 400 Bad Request or 409 Conflict - likely a scheduling conflict
          toast.error('Failed to add appointment. Check the date and time', {
            description: 'The selected time slot might be already taken or invalid.',
            duration: 5000,
          });
        } else {
          // Other server errors
          toast.error('Failed to add appointment. Please try again later.');
        }
      } else {
        // Network errors or other issues
        toast.error('Failed to connect to the server. Please check your connection.');
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Reset time slot when dentist changes
    if (field === 'dentistId') {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        timeSlot: ''
      }))
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateString(e.target.value)
    // Reset time slot when date changes
    setFormData(prev => ({
      ...prev,
      timeSlot: ''
    }))
  }

  // Get minimum date (today) in YYYY-MM-DD format
  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Appointment</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Debug Information - Remove this in production */}
            {debugInfo && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-4 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  🔍 Debug: {debugInfo}
                </div>
              </div>
            )}

            {/* Patient Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="patient" className="text-right">
                Patient <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.patientId}
                onValueChange={(value) => handleChange('patientId', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.patient_id} value={patient.patient_id}>
                      {patient.name} ({patient.patient_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dentist Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dentist" className="text-right">
                Dentist <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.dentistId}
                onValueChange={(value) => handleChange('dentistId', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a dentist" />
                </SelectTrigger>
                <SelectContent>
                  {dentists.map((dentist) => (
                    <SelectItem key={dentist.dentist_id} value={dentist.dentist_id}>
                      Dr. {dentist.name} - {dentist.service_types}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Show selected dentist's schedule info */}
            {selectedDentist && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-4 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  📋 Schedule: {selectedDentist.work_days_from} to {selectedDentist.work_days_to}, 
                  {selectedDentist.work_time_from} - {selectedDentist.work_time_to}, 
                  {selectedDentist.appointment_duration} slots
                </div>
              </div>
            )}

            {/* Date Picker */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={dateString}
                onChange={handleDateChange}
                min={getMinDate()}
                className="col-span-3"
                required
              />
            </div>

            {/* Show warning if selected date is not a working day */}
            {dateString && selectedDentist && !isWorkingDay(new Date(dateString), selectedDentist) && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-4 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                  ⚠️ Selected date is not a working day for this dentist. Working days: {selectedDentist.work_days_from} to {selectedDentist.work_days_to}
                </div>
              </div>
            )}

            {/* Time Slot Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="timeSlot" className="text-right">
                Time Slot <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.timeSlot}
                onValueChange={(value) => handleChange('timeSlot', value)}
                disabled={!formData.dentistId || !dateString || !selectedDentist}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={
                    !formData.dentistId 
                      ? 'Select a dentist first' 
                      : !dateString 
                        ? 'Select a date first' 
                        : !selectedDentist
                          ? 'Loading dentist details...'
                          : timeSlots.length === 0 
                            ? 'No available slots for selected date' 
                            : 'Select a time slot'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot, index) => (
                    <SelectItem key={index} value={`${slot.start} - ${slot.end}`}>
                      {slot.start} - {slot.end}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Show time slots count for debugging */}
            {selectedDentist && dateString && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-4 text-xs text-green-600 bg-green-50 p-2 rounded">
                  🕐 Total time slots: {timeSlots.length} (all slots shown)
                </div>
              </div>
            )}

            {/* Note */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="note" className="text-right mt-2">
                Note (Optional)
              </Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => handleChange('note', e.target.value)}
                className="col-span-3"
                placeholder="Add any additional notes here..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button className='bg-emerald-500 hover:bg-emerald-600 ' type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Appointment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}