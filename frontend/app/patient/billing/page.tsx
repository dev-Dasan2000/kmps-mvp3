"use client";
import React, { useState, useEffect, useContext } from 'react';
import { Search, Calendar, DollarSign, User, Clock, Plus, CreditCard, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import axios from 'axios';
import { AuthContext } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Types based on the database schema
interface Patient {
  patient_id: string;
  name: string;
  email: string;
  phone_number: string;
  profile_picture?: string;
}

interface Dentist {
  dentist_id: string;
  name: string;
  email: string;
  phone_number: string;
  profile_picture?: string;
}

interface Appointment {
  appointment_id: number;
  patient_id?: string;
  dentist_id?: string;
  date: string;
  time_from: string;
  time_to: string;
  fee: number;
  status: string;
  payment_status: string;
  note?: string;
  patient?: Patient;
  dentist?: Dentist;
}

interface PaymentHistory {
  appointment_id: number;
  payment_date: string;
  payment_time: string;
  reference_number: string;
}

interface PaymentRecord {
  appointment_id: number;
  payment_date: string;
  payment_time: string;
  reference_number: string;
  appointment: Appointment;
}

const PaymentsInterface: React.FC = () => {

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const router = useRouter()

  const { isLoadingAuth, isLoggedIn, user } = useContext(AuthContext);

  const [searchTerm, setSearchTerm] = useState('');
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // New state for make payment dialog
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [unpaidAppointments, setUnpaidAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<string>('');
  const [loadingUnpaidAppointments, setLoadingUnpaidAppointments] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("<reference_number>");

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const response = await axios.get(`${backendURL}/payment-history/patient/${user.id}`);

      if (response.status === 500) {
        throw new Error("Internal Server Error");
      }

      // The response data should already match the PaymentRecord[] format
      const formatted: PaymentRecord[] = response.data.map((item: any) => ({
        appointment_id: item.appointment_id,
        payment_date: item.payment_date,
        payment_time: item.payment_time,
        reference_number: item.reference_number,
        appointment: {
          appointment_id: item.appointment.appointment_id,
          patient_id: item.appointment.patient_id,
          dentist_id: item.appointment.dentist_id,
          date: item.appointment.date,
          time_from: item.appointment.time_from,
          time_to: item.appointment.time_to,
          fee: parseFloat(item.appointment.fee ?? 0),
          status: item.appointment.status,
          payment_status: item.appointment.payment_status,
          patient: item.appointment.patient,
          dentist: item.appointment.dentist
        }
      }));

      setPayments(formatted);
      setFilteredPayments(formatted);
    } catch (err: any) {
      toast.error("Error", {
        description: "Failed to fetch payments"
      });
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchUnpaidAppointments = async () => {
    setLoadingUnpaidAppointments(true);
    try {
      const response = await axios.get(`${backendURL}/appointments/forpatient/${user.id}`);

      if (response.status === 500) {
        throw new Error("Internal Server Error");
      }

      // Filter appointments with payment_status of 'not-paid'
      const unpaid = response.data.filter((appointment: any) =>
        appointment.payment_status === 'not-paid' &&
        appointment.status !== "cancelled"
      );

      const formatted: Appointment[] = unpaid.map((item: any) => ({
        appointment_id: item.appointment_id,
        patient_id: item.patient_id,
        dentist_id: item.dentist_id,
        date: item.date,
        time_from: item.time_from,
        time_to: item.time_to,
        fee: parseFloat(item.fee ?? 0),
        status: item.status,
        payment_status: item.payment_status,
        note: item.note,
        patient: item.patient,
        dentist: item.dentist
      }));

      setUnpaidAppointments(formatted);
    } catch (err: any) {
      toast.error("Error", {
        description: "Failed to fetch unpaid appointments"
      });
    } finally {
      setLoadingUnpaidAppointments(false);
    }
  };

  const handleMakePayment = async (appointment_id: number) => {
    if (!selectedAppointment) {
      toast.error("Error", {
        description: "Please select an appointment to pay for"
      });
      return;
    }

    setProcessingPayment(true);
    try {
      const response = await axios.put(
        `${backendURL}/appointments/${appointment_id}`,
        {
          payment_status: "paid"
        }
      );
      const response2 = await axios.post(
        `${backendURL}/payment-history`,
        {
          appointment_id: appointment_id,
          reference_number: referenceNumber
        }
      );

      if (response.status != 202) {
        throw new Error("Error Updating Payment Status");
      }

      if (response2.status != 201) {
        throw new Error("Error Creating Payment History Entry");
      }

      toast.success("Payment Successful", {
        description: "Your payment has been processed successfully"
      });

      setIsPaymentDialogOpen(false);
      setSelectedAppointment('');
      fetchPayments();

    } catch (err: any) {
      toast.error("Payment Failed", {
        description: err.message
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  useEffect(() => {
    const filtered = payments.filter(payment =>
      payment.appointment.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.appointment.dentist?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference_number.includes(searchTerm)
    );
    setFilteredPayments(filtered);
  }, [searchTerm, payments]);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isLoggedIn) {
      toast.error("Session Error", {
        description: "Your session is expired, please login again"
      });
      router.push("/");
      return;
    }
    else if (user.role != "patient") {
      toast.error("Access Error", {
        description: "You do not have access, redirecting..."
      });
      router.push("/");
      return;
    }
    fetchPayments();
  }, [isLoadingAuth]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const selectedAppointmentData = unpaidAppointments.find(
    app => app.appointment_id.toString() === selectedAppointment
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 overflow-auto">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold  md:mt-0 text-gray-900 mb-2">Payments</h1>
            <p className="text-gray-600">View Payments database entries</p>
          </div>

          {/* Make Payment Button */}
          <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="mt-7 w-full md:w-auto md:mt-2 bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={fetchUnpaidAppointments}
              >
                <Plus className="h-4 w-4 mr-2" />
                Make Payment
              </Button>
            </DialogTrigger>
            <DialogContent className=" max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Make Payment</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Appointment Selection */}
                <div>
                  <h3 className="text-lg items-center flex md:justify-start justify-center font-medium mb-4">Select Appointment to Pay</h3>

                  {loadingUnpaidAppointments ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                  ) : unpaidAppointments.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No unpaid appointments</h3>
                        <p className="text-gray-500">All your appointments are paid for.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <RadioGroup value={selectedAppointment} onValueChange={setSelectedAppointment}>
                      <div className="space-y-3">
                        {unpaidAppointments.map((appointment) => (
                          <div key={appointment.appointment_id} className="flex items-center space-x-3">
                            <RadioGroupItem value={appointment.appointment_id.toString()} id={`appointment-${appointment.appointment_id}`} />
                            <Label
                              htmlFor={`appointment-${appointment.appointment_id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <Card className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={appointment.dentist?.profile_picture} />
                                      <AvatarFallback className="bg-green-100 text-green-600">
                                        {getInitials(appointment.dentist?.name || "")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-gray-900">{appointment.dentist?.name}</div>
                                      <div className="text-sm text-gray-500">
                                        {formatDate(appointment.date)} • {formatTime(appointment.time_from)} - {formatTime(appointment.time_to)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-lg text-gray-900">Rs {appointment.fee}</div>
                                    <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                                      {appointment.status}
                                    </Badge>
                                  </div>
                                </div>
                              </Card>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  )}
                </div>

                {/* Payment Gateway Section */}
                {selectedAppointment && selectedAppointmentData && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-4">Payment Details</h3>

                      {/* Payment Summary */}
                      <Card className="mb-4">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">Appointment with {selectedAppointmentData.dentist?.name}</span>
                            <span className="font-medium">Rs {selectedAppointmentData.fee}</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">Service Fee</span>
                            <span className="font-medium">Rs 0.00</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between items-center font-bold text-lg">
                            <span>Total Amount</span>
                            <span>Rs {selectedAppointmentData.fee}</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Payment Gateway Placeholder */}
                      <Card className="border-2 border-dashed border-gray-300">
                        <CardContent className="p-6 text-center">
                          <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <h4 className="font-medium text-gray-900 mb-2">Payment Gateway Integration</h4>
                          <p className="text-gray-500 text-sm mb-4">
                            This is where you would integrate with your payment gateway
                            (Stripe, PayPal, local payment providers, etc.)
                          </p>
                          <Button
                            onClick={() => { handleMakePayment(selectedAppointmentData.appointment_id) }}
                            disabled={processingPayment}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {processingPayment ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Pay Rs {selectedAppointmentData.fee}
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg   focus:border-transparent"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-lg shadow-sm border overflow-hidden">
          {filteredPayments.length > 0 && (
            <div className="overflow-x-auto">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-4 font-medium text-gray-700">Patient</th>
                      <th className="text-left px-6 py-4 font-medium text-gray-700">Dentist</th>
                      <th className="text-left px-6 py-4 font-medium text-gray-700">Fee (Rs)</th>
                      <th className="text-left px-6 py-4 font-medium text-gray-700">Date & Time</th>
                      <th className="text-left px-6 py-4 font-medium text-gray-700">Reference no</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr key={payment.appointment_id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={payment.appointment.patient?.profile_picture} />
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {getInitials(payment.appointment.patient?.name || "")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-900">{payment.appointment.patient?.name}</div>
                              <div className="text-sm text-gray-500">{payment.appointment.patient?.email}</div>
                              <div className="text-sm text-gray-500">{payment.appointment.patient?.phone_number}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={payment.appointment.dentist?.profile_picture} />
                              <AvatarFallback className="bg-green-100 text-green-600">
                                {getInitials(payment.appointment.dentist?.name || "")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-900">{payment.appointment.dentist?.name}</div>
                              <div className="text-sm text-gray-500">{payment.appointment.dentist?.email}</div>
                              <div className="text-sm text-gray-500">{payment.appointment.dentist?.phone_number}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-1">
                            <span className="font-semibold text-gray-900">{payment.appointment.fee}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(payment.payment_date)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatTime(payment.payment_time)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="font-mono text-xs">
                            {payment.reference_number}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredPayments.map((payment) => (
            <Card key={payment.appointment_id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={payment.appointment.patient?.profile_picture} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getInitials(payment.appointment.patient?.name || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{payment.appointment.patient?.name}</CardTitle>
                      <CardDescription className="text-sm">{payment.appointment.patient?.email}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-500">Rs</span>
                    <span className="font-bold text-lg text-gray-900">{payment.appointment.fee}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={payment.appointment.dentist?.profile_picture} />
                    <AvatarFallback className="bg-green-100 text-green-600">
                      {getInitials(payment.appointment.dentist?.name || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-gray-900">{payment.appointment.dentist?.name}</div>
                    <div className="text-sm text-gray-500">{payment.appointment.dentist?.email}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">{formatDate(payment.payment_date)}</div>
                      <div className="text-xs text-gray-500">Date</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">
                        {formatTime(payment.payment_time)}
                      </div>
                      <div className="text-xs text-gray-500">Time</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-500 mb-1">Reference Number</div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {payment.reference_number}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredPayments.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-500">Try adjusting your search criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PaymentsInterface;