"use client";
import React, { useContext, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Edit3, Save, X, Phone, Mail, MapPin, Stethoscope, Building2 } from 'lucide-react';
import { AuthContext } from '@/context/auth-context'
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import axios from 'axios';

interface LabProfile {
  lab_id: string;
  name: string;
  password: string;
  contact_person: string;
  contact_number: string;
  email: string;
  address: string;
  specialties: string;
}

const LabProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingEdit, setIsRequestingEdit] = useState(false);
  const { user, isLoadingAuth, isLoggedIn } = useContext(AuthContext);
  const [originalData, setOriginalData] = useState<LabProfile>({
    lab_id: '',
    name: '',
    password: '',
    contact_person: '',
    contact_number: '',
    email: '',
    address: '',
    specialties: ''
  });
  const [formData, setFormData] = useState<LabProfile>({
    lab_id: '',
    name: '',
    password: '',
    contact_person: '',
    contact_number: '',
    email: '',
    address: '',
    specialties: ''
  });

  const router = useRouter();
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const fetchLab = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${backendURL}/labs/${user.id}`
      );
      setOriginalData(response.data);
      setFormData({ ...response.data, password: "" });
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setIsLoading(false);
    }
  }

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsRequestingEdit(true);
    try {
      const response = await axios.put(
        `${backendURL}/labs/${user.id}`,
        {
          formData
        },
        {
          withCredentials: true,
          headers: {
            "content-type": "application/json"
          }
        }
      );
      if (response.status != 202) {
        throw new Error("Error updating");
      }
      setOriginalData(formData);
      toast.success("Profile Edited Successfully");
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setIsRequestingEdit(false);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof LabProfile, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isLoggedIn) {
      toast.error("Please Log In");
      router.push("/");
      return;
    }
    if (user.role != "lab") {
      toast.error("Access Denied");
      router.push("/");
    }
    fetchLab();
  }, [isLoadingAuth])

  const specialtiesArray = formData?.specialties.split(',').map(s => s.trim());

  return (
    <div className="min-h-screen bg-gray-50 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
        {/* Profile Card */}
        {isLoading? <p>Loading...</p> : (<Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 md:w-20 md:h-20">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-semibold">
                    {getInitials(formData?.name || "")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl md:text-2xl">{formData?.name}</CardTitle>
                  <p className="text-gray-600 text-sm md:text-base">Lab ID: {formData?.lab_id}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button className='bg-emerald-500 hover:bg-emerald-600 text-white hover:text-white' onClick={handleEdit} variant="outline" size="sm">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button className='bg-emerald-500 hover:bg-emerald-600 text-white hover:text-white' onClick={handleSave} size="sm" disabled={isRequestingEdit}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Basic Information
                </h3>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Laboratory Name
                    </Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={formData?.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{formData?.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contact_person" className="text-sm font-medium text-gray-700">
                      Contact Person
                    </Label>
                    {isEditing ? (
                      <Input
                        id="contact_person"
                        value={formData?.contact_person}
                        onChange={(e) => handleInputChange('contact_person', e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{formData?.contact_person}</p>
                    )}
                  </div>

                  {isEditing && (
                    <div>
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData?.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="contact_number" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    {isEditing ? (
                      <Input
                        id="contact_number"
                        value={formData?.contact_number}
                        onChange={(e) => handleInputChange('contact_number', e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{formData?.contact_number}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={formData?.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{formData?.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address
                    </Label>
                    {isEditing ? (
                      <Textarea
                        id="address"
                        value={formData?.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="mt-1 min-h-[80px]"
                        rows={3}
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{formData?.address}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Specialties */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                Specialties
              </h3>

              {isEditing ? (
                <div>
                  <Label htmlFor="specialties" className="text-sm font-medium text-gray-700">
                    Specialties (comma-separated)
                  </Label>
                  <Textarea
                    id="specialties"
                    value={formData?.specialties}
                    onChange={(e) => handleInputChange('specialties', e.target.value)}
                    className="mt-1 min-h-[100px]"
                    rows={4}
                    placeholder="Enter specialties separated by commas"
                  />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {specialtiesArray?.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
};

export default LabProfilePage;