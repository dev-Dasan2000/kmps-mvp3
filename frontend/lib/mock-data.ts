import type { Dentist, Appointment, Room, RoomAssignment } from "@/types/dentist"

export const mockDentists: Dentist[] = [
  {
    dentist_id: "dr_001",
    password: "hashed_password_1",
    name: "Dr. Strange",
    profile_picture: "/placeholder.svg?height=40&width=40",
    email: "dr.strange@dental.com",
    phone_number: "+1-555-0101",
    language: "English, Spanish",
    service_types: "General Dentistry, Orthodontics, Root Canal",
    work_days_from: "Monday",
    work_days_to: "Friday",
    work_time_from: "09:00",
    work_time_to: "17:00",
    appointment_duration: "30",
    appointment_fee: 150.0,
  },
  {
    dentist_id: "dr_002",
    password: "hashed_password_2",
    name: "Dr. House",
    profile_picture: "/placeholder.svg?height=40&width=40",
    email: "dr.house@dental.com",
    phone_number: "+1-555-0102",
    language: "English, French",
    service_types: "Oral Surgery, Implants, Cosmetic Dentistry",
    work_days_from: "Tuesday",
    work_days_to: "Saturday",
    work_time_from: "08:00",
    work_time_to: "16:00",
    appointment_duration: "45",
    appointment_fee: 200.0,
  },
  {
    dentist_id: "dr_003",
    password: "hashed_password_3",
    name: "Dr. Watson",
    profile_picture: "/placeholder.svg?height=40&width=40",
    email: "dr.watson@dental.com",
    phone_number: "+1-555-0103",
    language: "English, German",
    service_types: "Pediatric Dentistry, Preventive Care",
    work_days_from: "Wednesday",
    work_days_to: "Sunday",
    work_time_from: "10:00",
    work_time_to: "18:00",
    appointment_duration: "30",
    appointment_fee: 120.0,
  },
  {
    dentist_id: "dr_004",
    password: "hashed_password_4",
    name: "Dr. Smith",
    profile_picture: "/placeholder.svg?height=40&width=40",
    email: "dr.smith@dental.com",
    phone_number: "+1-555-0104",
    language: "English, Italian",
    service_types: "Endodontics, Periodontics",
    work_days_from: "Monday",
    work_days_to: "Thursday",
    work_time_from: "08:30",
    work_time_to: "16:30",
    appointment_duration: "60",
    appointment_fee: 250.0,
  },
  {
    dentist_id: "dr_005",
    password: "hashed_password_5",
    name: "Dr. Hazel",
    profile_picture: "/placeholder.svg?height=40&width=40",
    email: "dr.hazel@dental.com",
    phone_number: "+1-555-0105",
    language: "English",
    service_types: "Cosmetic Dentistry, Whitening",
    work_days_from: "Monday",
    work_days_to: "Friday",
    work_time_from: "09:00",
    work_time_to: "17:00",
    appointment_duration: "30",
    appointment_fee: 180.0,
  },
  {
    dentist_id: "dr_006",
    password: "hashed_password_6",
    name: "Dr. Gray",
    profile_picture: "/placeholder.svg?height=40&width=40",
    email: "dr.gray@dental.com",
    phone_number: "+1-555-0106",
    language: "English, Portuguese",
    service_types: "Oral Surgery, Extractions",
    work_days_from: "Tuesday",
    work_days_to: "Saturday",
    work_time_from: "08:00",
    work_time_to: "16:00",
    appointment_duration: "45",
    appointment_fee: 220.0,
  },
]

export const mockRooms: Room[] = [
  { room_id: "room_001", description: "Room 1" },
  { room_id: "room_002", description: "Room 2" },
  { room_id: "room_003", description: "Room 3" },
]

export const mockAppointments: Appointment[] = [
  // June 9, 2025 appointments
  {
    id: "apt_001",
    dentist_id: "dr_003",
    patient_name: "John Doe",
    service: "Right upper molar needs filling",
    date: "2025-06-09",
    time: "09:00",
    duration: "30 mins",
    status: "booked",
    room_id: "room_001",
  },
  {
    id: "apt_002",
    dentist_id: "dr_001",
    patient_name: "John Doe",
    service: "Right upper molar needs filling",
    date: "2025-06-09",
    time: "09:30",
    duration: "30 mins",
    status: "booked",
    room_id: "room_002",
  },

  // June 10, 2025 appointments
  {
    id: "apt_003",
    dentist_id: "dr_001",
    patient_name: "John Doe",
    service: "Right upper molar needs filling",
    date: "2025-06-10",
    time: "09:00",
    duration: "30 mins",
    status: "booked",
    room_id: "room_001",
  },
  {
    id: "apt_004",
    dentist_id: "dr_002",
    patient_name: "John Doe",
    service: "Right upper molar needs filling",
    date: "2025-06-10",
    time: "09:30",
    duration: "30 mins",
    status: "booked",
    room_id: "room_002",
  },
  {
    id: "apt_005",
    dentist_id: "dr_003",
    patient_name: "John Doe",
    service: "Right upper molar needs filling",
    date: "2025-06-10",
    time: "10:00",
    duration: "30 mins",
    status: "booked",
    room_id: "room_003",
  },

  // June 11, 2025 appointments
  {
    id: "apt_006",
    dentist_id: "dr_005",
    patient_name: "John Doe",
    service: "Right upper molar needs filling",
    date: "2025-06-11",
    time: "09:00",
    duration: "30 mins",
    status: "booked",
    room_id: "room_001",
  },
  {
    id: "apt_007",
    dentist_id: "dr_006",
    patient_name: "John Doe",
    service: "Right upper molar needs filling",
    date: "2025-06-11",
    time: "09:30",
    duration: "30 mins",
    status: "booked",
    room_id: "room_002",
  },

  // June 12, 2025 appointments
  {
    id: "apt_008",
    dentist_id: "dr_006",
    patient_name: "John Doe",
    service: "Right upper molar needs filling",
    date: "2025-06-12",
    time: "09:00",
    duration: "30 mins",
    status: "booked",
    room_id: "room_001",
  },
  {
    id: "apt_009",
    dentist_id: "dr_001",
    patient_name: "John Doe",
    service: "Right upper molar needs filling",
    date: "2025-06-12",
    time: "09:30",
    duration: "30 mins",
    status: "booked",
    room_id: "room_002",
  },

  // June 13, 2025 appointments
  {
    id: "apt_010",
    dentist_id: "dr_003",
    patient_name: "John Doe",
    service: "Right upper molar needs filling",
    date: "2025-06-13",
    time: "09:00",
    duration: "30 mins",
    status: "booked",
    room_id: "room_001",
  },
  {
    id: "apt_011",
    dentist_id: "dr_001",
    patient_name: "John Doe",
    service: "Right upper molar needs filling",
    date: "2025-06-13",
    time: "09:30",
    duration: "30 mins",
    status: "booked",
    room_id: "room_002",
  },
]

export const mockRoomAssignments: RoomAssignment[] = [
  {
    room_id: "room_001",
    dentist_id: "dr_001",
    date: "2025-06-10",
    time_from: "09:00",
    time_to: "17:00",
  },
  {
    room_id: "room_002",
    dentist_id: "dr_002",
    date: "2025-06-10",
    time_from: "08:00",
    time_to: "16:00",
  },
  {
    room_id: "room_003",
    dentist_id: "dr_003",
    date: "2025-06-10",
    time_from: "10:00",
    time_to: "18:00",
  },
]

// Helper function to get day index from day name
const getDayIndex = (dayName: string): number => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  return days.indexOf(dayName)
}

// Helper function to check if dentist works on a specific day
export const isDentistWorkingDay = (dentist: Dentist, dayIndex: number): boolean => {
  if (!dentist.work_days_from || !dentist.work_days_to) return true

  const startDay = getDayIndex(dentist.work_days_from)
  const endDay = getDayIndex(dentist.work_days_to)

  if (startDay <= endDay) {
    return dayIndex >= startDay && dayIndex <= endDay
  } else {
    // Handle cases like Friday to Monday
    return dayIndex >= startDay || dayIndex <= endDay
  }
}

// Generate time slots for a specific dentist
export const generateDentistTimeSlots = (dentist: Dentist): string[] => {
  const slots: string[] = []

  if (!dentist.work_time_from || !dentist.work_time_to || !dentist.appointment_duration) {
    return slots
  }

  const [startHour, startMinute] = dentist.work_time_from.split(":").map(Number)
  const [endHour, endMinute] = dentist.work_time_to.split(":").map(Number)
  const duration = Number.parseInt(dentist.appointment_duration)

  let currentTime = startHour * 60 + startMinute // Convert to minutes
  const endTime = endHour * 60 + endMinute

  while (currentTime < endTime) {
    const hours = Math.floor(currentTime / 60)
    const minutes = currentTime % 60
    const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    slots.push(timeString)
    currentTime += duration
  }

  return slots
}

// Get all unique time slots across all dentists for display
export const getAllTimeSlots = (dentists: Dentist[]): string[] => {
  const allSlots = new Set<string>()

  dentists.forEach((dentist) => {
    const dentistSlots = generateDentistTimeSlots(dentist)
    dentistSlots.forEach((slot) => allSlots.add(slot))
  })

  return Array.from(allSlots).sort()
}

// Get doctor color for consistent styling
export const getDoctorColor = (dentistId: string): string => {
  const colors: { [key: string]: string } = {
    dr_001: "bg-blue-100 border-blue-200 text-blue-800", // Dr. Strange
    dr_002: "bg-purple-100 border-purple-200 text-purple-800", // Dr. House
    dr_003: "bg-green-100 border-green-200 text-green-800", // Dr. Watson
    dr_004: "bg-orange-100 border-orange-200 text-orange-800", // Dr. Smith
    dr_005: "bg-pink-100 border-pink-200 text-pink-800", // Dr. Hazel
    dr_006: "bg-indigo-100 border-indigo-200 text-indigo-800", // Dr. Gray
  }
  return colors[dentistId] || "bg-gray-100 border-gray-200 text-gray-800"
}
