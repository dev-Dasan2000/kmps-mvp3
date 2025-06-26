'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Badge } from '@/Components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs'
import { Switch } from '@/Components/ui/switch'
import { Search, Plus, Phone, Mail, Calendar, Clock, User, DollarSign, FileText, CheckCircle, CreditCard } from 'lucide-react'
import axios from 'axios'
import { AppointmentDialog } from '@/Components/AppointmentDialog'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'


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
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([])
  const [checkedInAppointments, setCheckedInAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('today')
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const fetchAppointments = async () => {
    try {
      const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

      const [todayRes, allRes, checkedInRes] = await Promise.all([
        axios.get(`${backendURL}/appointments/today`),
        axios.get(`${backendURL}/appointments`),
        axios.get(`${backendURL}/appointments/checkedin`)
      ]);

      const todayData = todayRes.data;
      const allData = allRes.data;
      const checkedInData = checkedInRes.data;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const validTodayAppointments = todayData.filter(
        (appointment: Appointment) => appointment.patient && appointment.dentist
      );
      setTodayAppointments(validTodayAppointments);

      const validCheckedInAppointments = checkedInData.filter(
        (appointment: Appointment) => appointment.patient && appointment.dentist
      );
      setCheckedInAppointments(validCheckedInAppointments);

      const upcoming = allData.filter((appointment: Appointment) => {
        if (!appointment.patient || !appointment.dentist) return false;

        const appointmentDate = new Date(appointment.date);
        appointmentDate.setHours(0, 0, 0, 0);
        return appointmentDate > today;
      });

      setAllAppointments(upcoming);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    }
  };

  // Load appointments
  useEffect(() => {
    fetchAppointments();
  }, []);
  
  // Handle appointment creation success
  const handleAppointmentCreated = () => {
    setIsDialogOpen(false);
    fetchAppointments();
  };

  // Handle payment status toggle
  const handlePaymentToggle = async (appointmentId: number, currentStatus: string) => {
    if (currentStatus === 'paid') {
      return;
    }

    try {
      // Update payment status to paid
      await axios.put(`${backendURL}/appointments/${appointmentId}`, {
        payment_status: 'paid'
      });

      const now = new Date();
      const payment_date = now.toISOString().split('T')[0];
      const payment_time = now.toTimeString().split(':').slice(0, 2).join(':');

      await axios.post(
        `${backendURL}/payment-history`,
        {
          appointment_id: appointmentId,
          payment_date: payment_date,
          payment_time: payment_time,
          reference_number: "<reference number here>"
        }
      )

      // Update local state
      const updateAppointmentPayment = (appointments: Appointment[]) =>
        appointments.map(appointment =>
          appointment.appointment_id === appointmentId
            ? { ...appointment, payment_status: 'paid' }
            : appointment
        );

      setTodayAppointments(prev => updateAppointmentPayment(prev));
      setAllAppointments(prev => updateAppointmentPayment(prev));
      setCheckedInAppointments(prev => updateAppointmentPayment(prev));

    } catch (error) {
      console.error("Failed to update payment status:", error);
      // You might want to show a toast notification here
    }
  };

  const handleCheckIn = async (appointmentID: number) => {
    try {
      const response = await axios.put(
        `${backendURL}/appointments/${appointmentID}`,
        {
          status: "checkedin"
        }
      );
      if (response.status != 202) {
        throw new Error("Error Updating Status");
      }

      const updateAppointmentStatus = (appointments: Appointment[]) =>
        appointments.map(appointment =>
          appointment.appointment_id === appointmentID
            ? { ...appointment, status: 'checkedin' }
            : appointment
        );

      setTodayAppointments(prev => updateAppointmentStatus(prev));
      setAllAppointments(prev => updateAppointmentStatus(prev));
      setCheckedInAppointments(prev => updateAppointmentStatus(prev));

    }
    catch (err: any) {
     toast.error(err.message);
    }
  }

  // Filter appointments based on search and tab
  useEffect(() => {
    let source: Appointment[] = []

    switch (activeTab) {
      case 'today':
        source = todayAppointments
        break
      case 'upcoming':
        source = allAppointments
        break
      case 'checked-in':
        source = checkedInAppointments
        break
      default:
        source = []
    }

    if (searchTerm) {
      source = source.filter(appointment =>
        (appointment.patient?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (appointment.dentist?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (appointment.note || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredAppointments(source)
  }, [activeTab, searchTerm, todayAppointments, allAppointments, checkedInAppointments])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'checkedin':
        return 'bg-purple-100 text-purple-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'not-paid':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:hidden">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600 mt-1">Manage patient appointments</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* Search */}
          <div className="relative w-full md:w-4/5">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button 
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Appointment
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="checked-in">Checked In</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {/* Desktop View */}
            <div className="hidden lg:block">
              {filteredAppointments.length > 0 && (

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {activeTab === 'today' && 'Today\'s Appointments'}
                      {activeTab === 'upcoming' && 'Upcoming Appointments'}
                      {activeTab === 'checked-in' && 'Checked In Patients'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-green-50 border-b border-gray-200">
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Patient</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Dentist</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Note</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Date & Time</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Payment</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAppointments.map((appointment) => (
                            <tr key={appointment.appointment_id} className="border-b hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <div>
                                  <div className="font-medium text-gray-900">{appointment.patient?.name}</div>
                                  <div className="text-sm text-gray-500 flex items-center gap-2">
                                    <Mail className="w-3 h-3" />
                                    {appointment.patient?.email}
                                  </div>
                                  <div className="text-sm text-gray-500 flex items-center gap-2">
                                    <Phone className="w-3 h-3" />
                                    {appointment.patient?.phone_number}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div>
                                  <div className="font-medium text-gray-900">{appointment.dentist?.name}</div>
                                  <div className="text-sm text-gray-500">{appointment.dentist?.email}</div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-sm text-gray-600 max-w-xs">
                                  {appointment.note}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div>
                                  <div className="font-medium text-gray-900">{formatDate(appointment.date)}</div>
                                  <div className="text-sm text-gray-500">
                                    {formatTime(appointment.time_from)} - {formatTime(appointment.time_to)}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="space-y-2">
                                  <Badge className={getPaymentStatusColor(appointment.payment_status)}>
                                    {appointment.payment_status}
                                  </Badge>
                                  <div className="flex items-center space-x-2">
                                    <CreditCard className="w-4 h-4 text-gray-500" />
                                    <Switch
                                      checked={appointment.payment_status === 'paid'}
                                      onCheckedChange={() =>
                                        handlePaymentToggle(appointment.appointment_id, appointment.payment_status)
                                      }
                                      disabled={appointment.payment_status === 'paid' || appointment.status === 'cancelled'}
                                      className="data-[state=checked]:bg-green-500"
                                    />
                                    <span className="text-xs text-gray-500">
                                      {appointment.status === 'cancelled'
                                        ? 'Payment Disabled'
                                        : appointment.payment_status === 'paid'
                                          ? 'Paid'
                                          : 'Mark as Paid'}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-4">
                                {appointment.status === 'cancelled' ? (
                                  <span className="text-red-500 text-sm font-medium">Cancelled</span>
                                ) : appointment.status === 'checkedin' ? (
                                  <CheckCircle className="text-green-600 w-5 h-5" />
                                ) : (
                                  <Button
                                    size="sm"
                                    className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
                                    onClick={() => handleCheckIn(appointment.appointment_id)}
                                  >
                                    Check In
                                  </Button>
                                )}
                              </td>

                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Mobile View */}
            <div className="lg:hidden space-y-4">
              {filteredAppointments.map((appointment) => (
                <Card key={appointment.appointment_id} className="w-full">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Patient Info */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">{appointment.patient?.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <Mail className="w-3 h-3" />
                            {appointment.patient?.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="w-3 h-3" />
                            {appointment.patient?.phone_number}
                          </div>
                        </div>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </div>

                      {/* Dentist Info */}
                      <div className="border-t pt-3">
                        <div className="text-sm text-gray-600 mb-1">
                          <strong>Dentist:</strong> {appointment.dentist?.name}
                        </div>
                        <div className="text-sm text-gray-500">{appointment.dentist?.email}</div>
                      </div>

                      {/* Appointment Details */}
                      <div className="border-t pt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>{formatDate(appointment.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{formatTime(appointment.time_from)} - {formatTime(appointment.time_to)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span>${appointment.fee}</span>
                          <Badge className={getPaymentStatusColor(appointment.payment_status)}>
                            {appointment.payment_status}
                          </Badge>
                        </div>
                        {appointment.note && (
                          <div className="flex items-start gap-2 text-sm">
                            <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                            <span className="text-gray-600">{appointment.note}</span>
                          </div>
                        )}
                      </div>

                      {/* Payment Toggle */}
                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">Payment Status</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={appointment.payment_status === 'paid'}
                              onCheckedChange={() => handlePaymentToggle(appointment.appointment_id, appointment.payment_status)}
                              disabled={appointment.payment_status === 'paid'}
                              className="data-[state=checked]:bg-green-500"
                            />
                            <span className="text-xs text-gray-500">
                              {appointment.payment_status === 'paid' ? 'Paid' : 'Mark as Paid'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="border-t pt-3">
                        {appointment.status === 'checkedin' ? (
                          <div className="flex justify-center">
                            <CheckCircle className="text-green-600 w-6 h-6" />
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-1 border-yellow-200"
                            onClick={() => handleCheckIn(appointment.appointment_id)}
                          >
                            Check In
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredAppointments.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm
                      ? `No appointments match "${searchTerm}"`
                      : `No appointments for ${activeTab === 'today' ? 'today' : activeTab}`
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

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