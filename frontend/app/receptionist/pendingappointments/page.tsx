'use client'

import { useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Phone, Mail, Calendar, Clock, User } from 'lucide-react'
import { AuthContext } from '@/context/auth-context'
import axios from 'axios';
import { toast } from 'sonner';


interface Patient {
  patient_id: string
  name: string
  email: string
  phone_number: string
  hospital_patient_id: string
}

interface Dentist {
  dentist_id: string
  name: string
  email: string
  phone_number: string
  appointment_fee: number
}

interface Appointment {
  appointment_id: number
  patient_id: string
  dentist_id: string
  date: string
  time_from: string
  time_to: string
  fee: number
  note: string
  status: string
  payment_status: string
  patient: Patient
  dentist: Dentist
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [receptionistId, setReceptionistId] = useState<string>('123')
  const [loading, setLoading] = useState(true);

  const { user, isLoadingAuth, isLoggedIn } = useContext(AuthContext);

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const router = useRouter();

  const fetchPendingAppointments = async () => {
    try {
      const response = await axios.get(`${backendURL}/appointments/pending`);

      // Filter out appointments where patient or dentist is null/undefined
      const validAppointments = response.data.filter(
        (appointment: Appointment) => appointment.patient && appointment.dentist
      );

      setAppointments(validAppointments);
      setFilteredAppointments(validAppointments);
    } catch (error) {
      console.error('Error fetching pending appointments:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleAcceptance = async (appointment_id: number) => {
    try {
      const response = await axios.put(
        `${backendURL}/appointments/${appointment_id}`,
        {
          status: "confirmed"
        }
      );
      if (response.status != 202) {
        throw new Error("Error Updating Status");
      }
      fetchPendingAppointments();
    }
    catch (err: any) {

    }
  }

  // Load appointments
  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isLoggedIn) {
      toast.error("You are not logged in");
      router.push("/");
      return;
    }
    else if (user.role != "receptionist") {
      toast.error("Access Denied");
      router.push("/");
      return;
    }
    fetchPendingAppointments();
  }, [isLoadingAuth])

  // Filter appointments based on search
  useEffect(() => {
    let filtered = appointments

    if (searchTerm) {
      filtered = filtered.filter(appointment =>
        (appointment.patient?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (appointment.dentist?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (appointment.note || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAppointments(filtered)
  }, [appointments, searchTerm])

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 md:hidden">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Pending Appointments</h1>
            <p className="text-gray-600 mt-1">Manage pending appointments</p>
          </div>
        </div>
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search appointments"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-gray-200"
          />
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredAppointments.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-medium text-gray-700 text-sm">Patient</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-700 text-sm">Dentist</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-700 text-sm">Note</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-700 text-sm">Date & Time</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-700 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appointment, index) => (
                    <tr
                      key={appointment.appointment_id}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        }`}
                    >
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {appointment.patient.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {appointment.patient.email}
                          </div>
                          <div className="text-xs text-gray-500">
                            {appointment.patient.phone_number}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {appointment.dentist.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {appointment.dentist.email}
                          </div>
                          <div className="text-xs text-gray-500">
                            {appointment.dentist.phone_number}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-600 max-w-xs">
                          {appointment.note || 'No note'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <div className="text-sm text-gray-900">
                            {formatDate(appointment.date)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatTime(appointment.time_from)} - {formatTime(appointment.time_to)}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs px-3 py-1 h-auto border-green-200 text-green-700 hover:bg-green-50"
                          onClick={() => { handleAcceptance(appointment.appointment_id) }}
                        >
                          Accept
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {filteredAppointments.map((appointment) => (
            <Card key={appointment.appointment_id} className="bg-white shadow-sm border border-gray-200">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Patient Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900">{appointment.patient.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <Mail className="w-3 h-3" />
                        {appointment.patient.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Phone className="w-3 h-3" />
                        {appointment.patient.phone_number}
                      </div>
                    </div>
                  </div>

                  {/* Dentist Info */}
                  <div className="border-t pt-3">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      Dentist: {appointment.dentist.name}
                    </div>
                    <div className="text-sm text-gray-500 mb-1">{appointment.dentist.email}</div>
                    <div className="text-sm text-gray-500">{appointment.dentist.phone_number}</div>
                  </div>

                  {/* Note */}
                  <div className="border-t pt-3">
                    <div className="text-sm font-medium text-gray-900 mb-1">Note:</div>
                    <div className="text-sm text-gray-600">{appointment.note}</div>
                  </div>

                  {/* Date & Time */}
                  <div className="border-t pt-3">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>{formatDate(appointment.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{formatTime(appointment.time_from)} - {formatTime(appointment.time_to)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="border-t pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-green-200 text-green-700 hover:bg-green-50"
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredAppointments.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-600">
              {searchTerm
                ? `No appointments match "${searchTerm}"`
                : 'No appointments available'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}