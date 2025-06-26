"use client";
import React, { useState, useMemo, useEffect, useContext } from 'react';
import { Search, Plus, Calendar, Clock, User, Stethoscope, FileText, DollarSign, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { AuthContext } from '@/context/auth-context';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AppointmentDialog } from '@/Components/AppointmentDialog'

// Updated types based on the new data structure
interface Patient {
  patient_id: string;
  name: string;
  email: string;
  profile_picture: string;
}

interface Dentist {
  dentist_id: string;
  name: string;
  email: string;
  profile_picture: string;
}

interface Appointment {
  appointment_id: number;
  patient_id?: string;
  dentist_id?: string;
  date: string;
  time_from: string;
  time_to: string;
  fee: string;
  note: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_status: 'not-paid' | 'paid';
  patient?: Patient;
  dentist?: Dentist;
}

interface ApiError {
  message: string;
  status?: number;
}

const AppointmentsDashboard = () => {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();

  const { isLoadingAuth, isLoggedIn, user } = useContext(AuthContext);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Fetch appointments from backend
  const fetchAppointments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${backendURL}/appointments`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data) {
        setAppointments(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching appointments:', err);

      let errorMessage = 'Failed to fetch appointments';

      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - please check your connection';
      } else if (err.response) {
        // Server responded with error status
        switch (err.response.status) {
          case 404:
            errorMessage = 'Appointments endpoint not found';
            break;
          case 500:
            errorMessage = 'Internal server error';
            break;
          case 503:
            errorMessage = 'Service unavailable';
            break;
          default:
            errorMessage = `Server error: ${err.response.status}`;
        }
      } else if (err.request) {
        errorMessage = 'Cannot connect to server - please check if the backend is running';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };

  const handleAppointmentCreated = () => {
    setIsDialogOpen(false);
    fetchAppointments();
  };

  // Load appointments on component mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (!isLoadingAuth) {
      if (!isLoggedIn) {
        toast.error("Session Error", {
          description: "Your session is expired, please login again"
        });
        router.push("/");
      }
      else if (user.role != "admin") {
        toast.error("Access Error", {
          description: "You do not have access, redirecting..."
        });
        router.push("/");
      }
    }
  }, [isLoadingAuth]);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Filter appointments based on search and status
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      const patientName = appointment.patient?.name?.toLowerCase() || '';
      const dentistName = appointment.dentist?.name?.toLowerCase() || '';
      const note = appointment.note?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch =
        patientName.includes(searchLower) ||
        dentistName.includes(searchLower) ||
        note.includes(searchLower) ||
        appointment.date.includes(searchLower);

      const matchesStatus = selectedStatus === 'all' || appointment.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, selectedStatus, appointments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'not-paid': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle image loading errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    const fallback = target.nextElementSibling as HTMLElement;
    if (fallback) {
      fallback.classList.remove('hidden');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mt-7 md:mt-0 text-gray-900">Appointments</h1>
              <p className="text-gray-600 mt-1">
                View Appointments database entries
                {appointments.length > 0 && (
                  <span className="ml-2 text-sm font-medium">({appointments.length} total)</span>
                )}
              </p>
            </div>


            <Button
              className="bg-emerald-500 hover:bg-emerald-600 text-white w-auto rounded-lg flex items-center gap-2 transition-colors"
              disabled={isLoading}
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus size={20} />
              Add Appointment
            </Button>

          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAppointments}
                disabled={isLoading}
                className="text-red-700 border-red-200 hover:bg-red-100"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && isInitialLoad && (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <RefreshCw size={32} className="text-gray-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading appointments...</h3>
            <p className="text-gray-500">Please wait while we fetch your data</p>
          </div>
        )}

        {/* Search and Filter Bar */}
        {!isInitialLoad && (
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-gray-600 outline-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        )}

        {/* Desktop Table View */}
        {!isInitialLoad && appointments.length > 0 && (
          <div className="hidden lg:block bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Patient</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Dentist</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Date & Time</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Note</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Fee (Rs)</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment.appointment_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={appointment.patient?.profile_picture || ''}
                            alt={appointment.patient?.name || 'Patient'}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={handleImageError}
                          />
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hidden">
                            <User size={16} className="text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{appointment.patient?.name || 'Unknown Patient'}</div>
                            <div className="text-sm text-gray-500">{appointment.patient?.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={appointment.dentist?.profile_picture || ''}
                            alt={appointment.dentist?.name || 'Dentist'}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={handleImageError}
                          />
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center hidden">
                            <Stethoscope size={16} className="text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{appointment.dentist?.name || 'Unknown Dentist'}</div>
                            <div className="text-sm text-gray-500">{appointment.dentist?.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm flex items-center gap-2 text-gray-900">
                          <Calendar size={16} className="text-gray-400" />
                          <span className="font-medium">{formatDate(appointment.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Clock size={14} className="text-gray-400" />
                          <span>{appointment.time_from}</span>
                          <span>-</span>
                          <span>{appointment.time_to}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-900">{appointment.note || 'No note'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{appointment.fee}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(appointment.payment_status)}`}>
                          {appointment.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mobile/Tablet Card View */}
        {!isInitialLoad && appointments.length > 0 && (
          <div className="lg:hidden space-y-4">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.appointment_id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Patient Info */}
                    <div className="flex items-center gap-3">
                      <img
                        src={appointment.patient?.profile_picture || ''}
                        alt={appointment.patient?.name || 'Patient'}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={handleImageError}
                      />
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center hidden">
                        <User size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{appointment.patient?.name || 'Unknown Patient'}</div>
                        <div className="text-sm text-gray-500">{appointment.patient?.email || 'No email'}</div>
                      </div>
                    </div>

                    {/* Dentist Info */}
                    <div className="flex items-center gap-3">
                      <img
                        src={appointment.dentist?.profile_picture || ''}
                        alt={appointment.dentist?.name || 'Dentist'}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={handleImageError}
                      />
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center hidden">
                        <Stethoscope size={20} className="text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{appointment.dentist?.name || 'Unknown Dentist'}</div>
                        <div className="text-sm text-gray-500">{appointment.dentist?.email || 'No email'}</div>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="font-medium">{formatDate(appointment.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        <span>{appointment.time_from} - {appointment.time_to}</span>
                      </div>
                    </div>

                    {/* Note */}
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-400" />
                      <span className="text-gray-900">{appointment.note || 'No note'}</span>
                    </div>

                    {/* Fee */}
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-gray-400" />
                      <span className="font-semibold text-lg text-gray-900">${appointment.fee}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 items-start sm:items-end">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)} w-fit`}>
                      {appointment.status}
                    </span>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(appointment.payment_status)} w-fit`}>
                      {appointment.payment_status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isInitialLoad && appointments.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-500 mb-6">
              No appointments are available in the database yet.
            </p>
            <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors mx-auto">
              <Plus size={20} />
              Add First Appointment
            </Button>
          </div>
        )}

        {/* No Results State */}
        {!isInitialLoad && appointments.length > 0 && filteredAppointments.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Search size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No matching appointments</h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search or filter criteria.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('all');
              }}
              className="px-6 py-2 rounded-lg"
            >
              Clear Filters
            </Button>
          </div>
        )}

        <AppointmentDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onAppointmentCreated={handleAppointmentCreated}
        />
      </div>
    </div>
  );
};

export default AppointmentsDashboard;