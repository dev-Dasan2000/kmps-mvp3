'use client';

import React, { useState, useEffect, use, useContext } from 'react';
import { Search, Clock, Phone, Mail, MapPin, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import axios from 'axios';
import { AuthContext } from '@/context/auth-context';
import { toast } from 'sonner';


interface Dentist {
  dentist_id: string;
  name: string;
  profile_picture?: string;
  email: string;
  phone_number?: string;
  language?: string;
  service_types?: string;
  work_days_from?: string;
  work_days_to?: string;
  work_time_from?: string;
  work_time_to?: string;
  appointment_duration?: string;
  appointment_fee?: number;
}

interface DentistDirectoryProps {
  params: Promise<{
    receptionistID: string;
  }>;
}

export default function DentistDirectory() {

  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [filteredDentists, setFilteredDentists] = useState<Dentist[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();
  const { isLoadingAuth, isLoggedIn, user, apiClient } = useContext(AuthContext);


  useEffect(() => {
    const fetchDentists = async () => {
      try {
        const response = await apiClient.get(`/dentists`);
        console.log("Fetched dentists:", response.data);
        setDentists(response.data);
        setFilteredDentists(response.data);
      } catch (error) {
        console.error('Error fetching dentists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDentists();
  }, []);

  useEffect(() => {
    const filtered = dentists.filter(
      dentist =>
        dentist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dentist.service_types?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dentist.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDentists(filtered);
  }, [searchTerm, dentists]);


  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isLoggedIn) {
      toast.error("Session Expired", { description: "Please Login" });
      router.push("/");
    }
    else if (user.role != "receptionist") {
      toast.error("Access Denied", { description: "You do not have access to this user role" });
      router.push("/");
    }
  }, [isLoadingAuth]);

  const formatWorkingHours = (dentist: Dentist) => {
    if (!dentist.work_days_from || !dentist.work_time_from) return 'Not specified';

    const days = dentist.work_days_from === dentist.work_days_to
      ? dentist.work_days_from
      : `${dentist.work_days_from} - ${dentist.work_days_to}`;

    const time = `${dentist.work_time_from} - ${dentist.work_time_to}`;

    return `${days}, ${time}`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 md:hidden">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dentist Directory</h1>
            <p className="text-gray-600 mt-1"> Dentist details</p>
          </div>
        </div>



        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search dentists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Table View */}
        <div className="block md:hidden space-y-4">
          {filteredDentists.map((dentist) => (
            <Card key={dentist.dentist_id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={dentist.profile_picture ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${dentist.profile_picture}` : "/placeholder.svg"}
                        alt={dentist.name}
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'flex';
                          }
                        }}
                      />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 font-medium">
                        {getInitials(dentist.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{dentist.name}</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{dentist.email}</span>
                      </div>
                      {dentist.phone_number && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>{dentist.phone_number}</span>
                        </div>
                      )}
                      <div className="flex items-start text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-xs">{formatWorkingHours(dentist)}</span>
                      </div>
                      {dentist.service_types && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {dentist.service_types.split(',').map((service, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {service.trim()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-sm font-medium text-gray-900">
                          Rs {Number(dentist.appointment_fee).toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {dentist.appointment_duration} min
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop Table View */}

        <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-700 text-sm">Dentist</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700 text-sm">Specialty</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700 text-sm">Service Fee</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700 text-sm">Working Hours</th>

                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDentists.map((dentist) => (
                  <tr key={dentist.dentist_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="relative">
                          <Avatar className="h-10 w-10 ">
                            <AvatarImage
                              src={dentist.profile_picture ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${dentist.profile_picture}` : "/placeholder.svg"}
                              alt={dentist.name}
                              className="object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) {
                                  fallback.style.display = 'flex';
                                }
                              }}
                            />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-medium">
                              {getInitials(dentist.name)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {dentist.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {dentist.email}
                          </div>
                          {dentist.phone_number && (
                            <div className="text-sm text-gray-500">
                              {dentist.phone_number}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {dentist.service_types?.split(',').map((service, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {service.trim()}
                          </Badge>
                        ))}
                      </div>
                      {dentist.language && (
                        <div className="text-xs text-gray-500 mt-1">
                          Languages: {dentist.language}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        Rs {Number(dentist.appointment_fee).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatWorkingHours(dentist)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {dentist.appointment_duration} min appointments
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>


        {/* No Results */}
        {filteredDentists.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium">No dentists found</h3>
              <p className="text-sm">Try adjusting your search criteria</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}