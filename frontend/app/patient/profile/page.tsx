"use client";

import React, { useEffect, useState, useContext } from 'react';
import { User, Mail, Phone, Lock, Shield, Camera, X } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '@/context/auth-context';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ClientData {
  email: string;
  name: string;
  phone_number: string;
  profile_picture: string | null;
}

const ProfilePage = () => {
  const { user, isLoadingAuth } = useContext(AuthContext);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const [editedData, setEditedData] = useState({
    firstName: '',
    lastName: '',
    phone_number: '',
    newProfilePicture: null as File | null,
    newProfilePicturePreview: '' as string
  });
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAuth && user?.email) {
      fetchClientData();
    }
  }, [isLoadingAuth, user?.email]);
  
  const fetchClientData = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/clients/client/${user?.email}`
      );
  
      setClientData(response.data);
  
      const [firstName, ...lastNameParts] = response.data.name.split(" ");
      setEditedData({
        firstName,
        lastName: lastNameParts.join(" "),
        phone_number: response.data.phone_number,
        newProfilePicture: null,
        newProfilePicturePreview: ''
      });
    } catch (error: any) {
      toast.error("Failed to fetch profile data", {
        description: error.response?.data?.error || "An error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (clientData) {
      const [firstName, ...lastNameParts] = clientData.name.split(" ");
      setEditedData({
        firstName,
        lastName: lastNameParts.join(" "),
        phone_number: clientData.phone_number,
        newProfilePicture: null,
        newProfilePicturePreview: ''
      });
    }
    setIsEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File is too large", {
          description: "Please select an image under 5MB"
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error("Invalid file type", {
          description: "Please select an image file"
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedData(prev => ({
          ...prev,
          newProfilePicture: file,
          newProfilePicturePreview: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setEditedData(prev => ({
      ...prev,
      newProfilePicture: null,
      newProfilePicturePreview: ''
    }));
  };

  const handleSave = async () => {
    if (!clientData || !user?.email) return;

    try {
      let profilePicturePath = clientData.profile_picture;

      // If there's a new profile picture, upload it first
      if (editedData.newProfilePicture) {
        const formData = new FormData();
        formData.append('image', editedData.newProfilePicture);

        const uploadResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/photos`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (uploadResponse.data.url) {
          profilePicturePath = uploadResponse.data.url;
        }
      }

      // Update client information
      const response = await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/clients`, {
        email: user.email,
        name: `${editedData.firstName} ${editedData.lastName}`.trim(),
        phone_number: editedData.phone_number,
        profile_picture: profilePicturePath
      });

      setClientData(response.data);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error("Failed to update profile", {
        description: error.response?.data?.error || "An error occurred"
      });
    }
  };

  const handleChangePassword = () => {
    if (clientData?.email) {
      router.push(`/changepassword?email=${encodeURIComponent(clientData.email)}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">No profile data found</div>
      </div>
    );
  }

  // Split the full name into first and last name for display
  const [firstName, ...lastNameParts] = clientData.name.split(" ");
  const lastName = lastNameParts.join(" ");

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-white px-6 py-8 sm:px-8">
            <div className="text-center">
              {/* Profile Avatar */}
              <div className="relative mx-auto h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gray-100 flex items-center justify-center mb-4 overflow-hidden group">
                {(editedData.newProfilePicturePreview || clientData.profile_picture) ? (
                  <img 
                    src={editedData.newProfilePicturePreview || `${process.env.NEXT_PUBLIC_BACKEND_URL}${clientData.profile_picture}`}
                    alt={clientData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                )}
                
                {isEditing && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <label htmlFor="profile-picture" className="cursor-pointer p-2 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100">
                      <Camera className="h-5 w-5 text-gray-700" />
                    </label>
                    <input
                      type="file"
                      id="profile-picture"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {isEditing && editedData.newProfilePicturePreview && (
                <button
                  onClick={handleRemoveImage}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center justify-center mx-auto space-x-1"
                >
                  <X className="h-4 w-4" />
                  <span>Remove new image</span>
                </button>
              )}
              
              {/* Name and Email */}
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">
                {clientData.name}
              </h1>
              <p className="text-sm sm:text-base text-gray-500">
                {clientData.email}
              </p>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="border-t border-gray-200 px-6 py-6 sm:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
              {!isEditing ? (
                <Button 
                  onClick={handleEdit}
                  variant="outline"
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Edit Profile
                </Button>
              ) : (
                <div className="space-x-2">
                  <Button 
                    onClick={handleSave}
                    variant="default"
                    className="text-sm bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    Save
                  </Button>
                  <Button 
                    onClick={handleCancel}
                    variant="outline"
                    className="text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={isEditing ? editedData.firstName : firstName}
                    onChange={(e) => setEditedData({ ...editedData, firstName: e.target.value })}
                    readOnly={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      isEditing ? 'bg-white' : 'bg-gray-50'
                    } text-gray-900 text-sm sm:text-base ${
                      isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                    }`}
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={isEditing ? editedData.lastName : lastName}
                    onChange={(e) => setEditedData({ ...editedData, lastName: e.target.value })}
                    readOnly={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      isEditing ? 'bg-white' : 'bg-gray-50'
                    } text-gray-900 text-sm sm:text-base ${
                      isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={clientData.email}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={isEditing ? editedData.phone_number : clientData.phone_number}
                    onChange={(e) => setEditedData({ ...editedData, phone_number: e.target.value })}
                    readOnly={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      isEditing ? 'bg-white' : 'bg-gray-50'
                    } text-gray-900 text-sm sm:text-base ${
                      isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="border-t border-gray-200 px-6 py-6 sm:px-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Password</h2>
              <button 
                onClick={handleChangePassword}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                Change Password
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <Lock className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <div className="text-gray-400 text-sm sm:text-base tracking-wider">
                  ••••••••••••••••••••••••••••••••
                </div>
              </div>
            </div>
          </div>

          {/* Security Questions Section */}
          <div className="border-t border-gray-200 px-6 py-6 sm:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-medium text-gray-900">Security Questions</h2>
              </div>
              <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                Change Security Questions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;