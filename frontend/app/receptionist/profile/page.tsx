"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ChangePasswordDialog } from "@/Components/ChangePasswordDialog";

interface ReceptionistProfile {
  receptionist_id: string;
  name: string;
  email: string;
  phone_number: string | null;
}

export default function ReceptionistProfile() {
  const { user, accessToken, isLoadingAuth } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ReceptionistProfile | null>(null);
  const [formData, setFormData] = useState<Partial<ReceptionistProfile>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user?.id || !accessToken) {
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/receptionists/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        setProfile(data);
        setFormData(data);
      } catch (error) {
        console.error("Profile fetch error:", error);
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    if (!isLoadingAuth) {
      fetchProfile();
    }
  }, [user?.id, accessToken, isLoadingAuth]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const startEditing = () => {
    // Ensure formData is in sync with profile before editing
    if (profile) {
      setFormData({
        name: profile.name,
        phone_number: profile.phone_number
      });
    }
    setIsEditing(true);
  };

  const cancelEditing = () => {
    // Reset form data to profile data
    if (profile) {
      setFormData({
        name: profile.name,
        phone_number: profile.phone_number
      });
    }
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Only send the fields that can be updated
      const updateData = {
        name: formData.name,
        phone_number: formData.phone_number
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/receptionists/${user?.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }
      
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setFormData(updatedProfile);
      setIsEditing(false);
      toast.success("Profile updated successfully");
     
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    }
  };

  // Show loading state while auth is being checked
  if (isLoadingAuth || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show message if user is not authenticated
  if (!user?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Please log in to view your profile</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Failed to load profile. Please try again later.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Move form fields into a div when not editing */}
          {!isEditing ? (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">ID</label>
                  <Input
                    value={profile.receptionist_id}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    value={profile.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={profile.name}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    value={profile.phone_number || ""}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <ChangePasswordDialog userType="receptionist" />
                  <Button
                    type="button"
                    onClick={startEditing}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    Edit Profile
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">ID</label>
                <Input
                  value={profile.receptionist_id}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={profile.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  name="phone_number"
                  value={formData.phone_number || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEditing}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 