"use client";
import React, { useState, useEffect } from 'react';
import { Search, Calendar, DollarSign, User, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import axios from 'axios';
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
  patient_id: string;
  dentist_id: string;
  date: string;
  time_from: string;
  time_to: string;
  fee: number;
  status: string;
  payment_status: string;
}

interface PaymentHistory {
  appointment_id: number;
  payment_date: string;
  payment_time: string;
  reference_number: string;
}

interface PaymentRecord {
  appointment: Appointment;
  patient: Patient;
  dentist: Dentist;
  payment: PaymentHistory;
}



const PaymentsInterface: React.FC = () => {

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [searchTerm, setSearchTerm] = useState('');
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const response = await axios.get(`${backendURL}/payment-history`);

      if (response.status === 500) {
        throw new Error("Internal Server Error");
      }

      // Transform raw response to match PaymentRecord[]
      const formatted: PaymentRecord[] = response.data.map((item: any) => ({
        payment: {
          appointment_id: item.appointment_id,
          payment_date: item.payment_date,
          payment_time: item.payment_time,
          reference_number: item.reference_number
        },
        appointment: {
          appointment_id: item.appointment.appointment_id,
          patient_id: item.appointment.patient_id,
          dentist_id: item.appointment.dentist_id,
          date: item.appointment.date,
          time_from: item.appointment.time_from,
          time_to: item.appointment.time_to,
          fee: parseFloat(item.appointment.fee ?? 0),
          status: item.appointment.status,
          payment_status: item.appointment.payment_status
        },
        patient: item.appointment?.patient,
        dentist: item.appointment?.dentist
      }));

      setPayments(formatted);
      setFilteredPayments(formatted);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingPayments(false);
    }
  };


  useEffect(() => {
    const filtered = payments.filter(payment =>
      payment.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.dentist?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.payment.reference_number.includes(searchTerm)
    );
    setFilteredPayments(filtered);
  }, [searchTerm, payments]);

  useEffect(()=>{
    fetchPayments();
  },[]);

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

  return (
    <div className="min-h-screen bg-gray-50  p-4 md:p-6 lg:p-8 overflow-auto">
      <div className="mx-auto max-w-7xl">
       {/* Header */}
         <div className="mb-8 md:hidden">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600 mt-1">See payment history</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" size={20} />
            <input
              type="text"
              placeholder="Search payment records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-1 border border-gray-300 rounded-lg focus:-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-lg shadow-sm border overflow-hidden">
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
                    <tr key={payment.appointment.appointment_id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={payment.patient?.profile_picture} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {getInitials(payment.patient?.name|| "deleted patient")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900">{payment.patient?.name || "deleted patient" }</div>
                            <div className="text-sm text-gray-500">{payment.patient?.email || "N/A"}</div>
                            <div className="text-sm text-gray-500">{payment.patient?.phone_number || "N/A"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={payment.dentist?.profile_picture || "deleted dentist"} />
                            <AvatarFallback className="bg-green-100 text-green-600">
                              {getInitials(payment.dentist?.name || "deleted dentist")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900">{payment.dentist?.name || "deleted dentist"}</div>
                            <div className="text-sm text-gray-500">{payment.dentist?.email || "N/A"}</div>
                            <div className="text-sm text-gray-500">{payment.dentist?.phone_number || "N/A"}</div>
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
                            {formatDate(payment.payment.payment_date)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatTime(payment.payment.payment_time)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="font-mono text-xs">
                          {payment.payment.reference_number}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredPayments.map((payment) => (
            <Card key={payment.appointment.appointment_id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={payment.patient?.profile_picture} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getInitials(payment?.patient?.name || "deleted patient")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{payment.patient?.name || "deleted patient"}</CardTitle>
                      <CardDescription className="text-sm">{payment.patient?.email || "N/A"}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-500">Rs</span>
                    <span className="font-bold text-lg text-gray-900">{payment.appointment?.fee}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={payment.dentist?.profile_picture} />
                    <AvatarFallback className="bg-green-100 text-green-600">
                      {getInitials(payment.dentist?.name || "deleted dentist")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-gray-900">{payment.dentist?.name || "deleted dentist"}</div>
                    <div className="text-sm text-gray-500">{payment.dentist?.email || "N/A"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">{formatDate(payment.payment.payment_date)}</div>
                      <div className="text-xs text-gray-500">Date</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">
                        {formatTime(payment.payment.payment_time)}
                      </div>
                      <div className="text-xs text-gray-500">Time</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-500 mb-1">Reference Number</div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {payment.payment.reference_number}
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