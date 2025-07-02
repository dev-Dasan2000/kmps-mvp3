"use client";
import React, { useState, useEffect, useContext } from 'react';
import { Search, Calendar, DollarSign, User, Clock } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  payment_status?: string;
}

interface PaymentHistory {
  appointment_id?: number;
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

  const router = useRouter()

  const {isLoadingAuth, isLoggedIn, user} = useContext(AuthContext);

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
        patient: item.appointment.patient,
        dentist: item.appointment.dentist
      }));

      setPayments(formatted);
      setFilteredPayments(formatted);
    } catch (err: any) {
      toast.error("Error", {
        description: err.message
      });
    } finally {
      setLoadingPayments(false);
    }
  };


  useEffect(() => {
    const filtered = payments.filter(payment =>
      payment.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.dentist?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.payment.reference_number.includes(searchTerm)
    );
    setFilteredPayments(filtered);
  }, [searchTerm, payments]);

  useEffect(()=>{
    fetchPayments();
  },[]);

  useEffect(()=>{
    if(!isLoadingAuth){
      if(!isLoggedIn){
        toast.error("Session Error", {
          description: "Your session is expired, please login again"
        });
        router.push("/");
      }
      else if(user.role != "admin"){
        toast.error("Access Error", {
          description: "You do not have access, redirecting..."
        });
        router.push("/");
      }
    }
  },[isLoadingAuth]);

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
    if(!name) return "";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 overflow-auto">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mt-7 md:mt-0 text-gray-900 mb-2">Payments</h1>
          <p className="text-gray-600">View Payments database entries</p>
        </div>

        {/* Search Bar */}
         <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search payment records..."
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
                    <tr key={payment.appointment.appointment_id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {payment.patient ? (
                          <div className="flex items-center space-x-3">
                            <div className="relative w-10 h-10">
                              {payment.patient?.profile_picture ? (
                                <>
                                  <Image
                                    src={`${backendURL}${payment.patient.profile_picture}`}
                                    alt={payment.patient.name}
                                    width={40}
                                    height={40}
                                    className="rounded-full border border-gray-200 object-cover w-full h-full"
                                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const fallback = target.nextElementSibling as HTMLElement;
                                      if (fallback) {
                                        fallback.style.display = 'flex';
                                      }
                                    }}
                                  />
                                  <div 
                                    className="hidden items-center justify-center w-full h-full rounded-full border border-gray-200 bg-blue-100 text-blue-600 text-sm font-medium"
                                  >
                                    {getInitials(payment.patient.name)}
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full rounded-full border border-gray-200 bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                                  {getInitials(payment.patient.name)}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{payment.patient.name}</div>
                              <div className="text-sm text-gray-500">{payment.patient.email}</div>
                              <div className="text-sm text-gray-500">{payment.patient.phone_number}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-red-500 italic">Patient deleted from system</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {payment.dentist ? (
                          <div className="flex items-center space-x-3">
                            <div className="relative w-10 h-10">
                              {payment.dentist?.profile_picture ? (
                                <>
                                  <Image
                                    src={`${backendURL}${payment.dentist.profile_picture}`}
                                    alt={payment.dentist.name}
                                    width={40}
                                    height={40}
                                    className="rounded-full border border-gray-200 object-cover w-full h-full"
                                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const fallback = target.nextElementSibling as HTMLElement;
                                      if (fallback) {
                                        fallback.style.display = 'flex';
                                      }
                                    }}
                                  />
                                  <div 
                                    className="hidden items-center justify-center w-full h-full rounded-full border border-gray-200 bg-green-100 text-green-600 text-sm font-medium"
                                  >
                                    {getInitials(payment.dentist.name)}
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full rounded-full border border-gray-200 bg-green-100 flex items-center justify-center text-green-600 text-sm font-medium">
                                  {getInitials(payment.dentist.name)}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{payment.dentist.name}</div>
                              <div className="text-sm text-gray-500">{payment.dentist.email}</div>
                              <div className="text-sm text-gray-500">{payment.dentist.phone_number}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-red-500 italic">Dentist deleted from system</div>
                        )}
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
          )}
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredPayments.map((payment) => (
            <Card key={payment.appointment.appointment_id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  {payment.patient ? (
                  <div className="flex items-center space-x-3">
                    <div className="relative w-12 h-12">
                      {payment.patient?.profile_picture ? (
                        <>
                          <Image
                            src={`${backendURL}${payment.patient.profile_picture}`}
                            alt={payment.patient.name}
                            width={48}
                            height={48}
                            className="rounded-full border border-gray-200 object-cover w-full h-full"
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) {
                                fallback.style.display = 'flex';
                              }
                            }}
                          />
                          <div 
                            className="hidden items-center justify-center w-full h-full rounded-full border border-gray-200 bg-blue-100 text-blue-600 text-base font-medium"
                          >
                            {getInitials(payment.patient.name)}
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full rounded-full border border-gray-200 bg-blue-100 flex items-center justify-center text-blue-600 text-base font-medium">
                          {getInitials(payment.patient.name)}
                        </div>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{payment.patient.name}</CardTitle>
                      <CardDescription className="text-sm">{payment.patient.email}</CardDescription>
                    </div>
                  </div>
                  ) : (
                    <div className="text-red-500 italic">Patient deleted from system</div>
                  )}
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-500">Rs</span>
                    <span className="font-bold text-lg text-gray-900">{payment.appointment.fee}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {payment.dentist ? (
                  <div className="flex items-center space-x-3   bg-gray-50 rounded-lg">
                    <div className="relative w-10 h-10">
                      {payment.dentist?.profile_picture ? (
                        <>
                          <Image
                            src={`${backendURL}${payment.dentist.profile_picture}`}
                            alt={payment.dentist.name}
                            width={40}
                            height={40}
                            className="rounded-full border border-gray-200 object-cover w-full h-full"
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) {
                                fallback.style.display = 'flex';
                              }
                            }}
                          />
                          <div 
                            className="hidden items-center justify-center w-full h-full rounded-full border border-gray-200 bg-green-100 text-green-600 text-sm font-medium"
                          >
                            {getInitials(payment.dentist.name)}
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full rounded-full border border-gray-200 bg-green-100 flex items-center justify-center text-green-600 text-sm font-medium">
                          {getInitials(payment.dentist.name)}
                        </div>
                      )}
                    </div>
                    <div >
                      <div className="font-medium text-gray-900">{payment.dentist.name}</div>
                      <div className="text-sm text-gray-500">{payment.dentist.email}</div>
                    </div>
                  </div>
                ) : (
                  <div className=" bg-gray-50 rounded-lg text-red-500 italic">
                    Dentist deleted from system
                  </div>
                )}

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