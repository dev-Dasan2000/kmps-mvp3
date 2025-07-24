"use client";

import { useState, useEffect, useContext } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { AuthContext } from "@/context/auth-context";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface ChangePasswordDialogProps {
  userType: 'receptionist' | 'dentist' | 'patient' | 'radiologist' | 'lab' | 'admin';
  trigger?: React.ReactNode;
}

export function ChangePasswordDialog({ userType, trigger }: ChangePasswordDialogProps) {
  const router = useRouter();
  const { user, accessToken, setUser, setAccessToken } = useAuth();
  const { apiClient } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [isCurrentPasswordValid, setIsCurrentPasswordValid] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [passwordMatchError, setPasswordMatchError] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Check password match in real-time
  useEffect(() => {
    if (formData.newPassword && formData.confirmPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setPasswordMatchError("Passwords do not match");
      } else {
        setPasswordMatchError("");
      }
    } else {
      setPasswordMatchError("");
    }
  }, [formData.newPassword, formData.confirmPassword]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Reset validation when current password changes
    if (name === "currentPassword") {
      setIsCurrentPasswordValid(false);
      setCurrentPasswordError("");
    }
  };

  const resetForm = () => {
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setIsCurrentPasswordValid(false);
    setCurrentPasswordError("");
    setPasswordMatchError("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const verifyCurrentPassword = async () => {
    if (!formData.currentPassword) {
      setCurrentPasswordError("Current password is required");
      return false;
    }

    setIsVerifyingPassword(true);
    try {
      const response = await apiClient.post(`/auth/login`, {
        id: user?.id,
        password: formData.currentPassword,
      });

      if (!response.data.successful) {
        setCurrentPasswordError("Current password is incorrect");
        setIsCurrentPasswordValid(false);
        return false;
      }

      setCurrentPasswordError("");
      setIsCurrentPasswordValid(true);
      return true;
    } catch (error) {
      setCurrentPasswordError("Failed to verify password");
      setIsCurrentPasswordValid(false);
      return false;
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Delete refresh token
      await apiClient.delete(`/auth/delete_token`, {
        withCredentials: true,
      });

      // Clear auth context
      setUser(null);
      setAccessToken("");

      // Show final message and redirect
      toast.success("Please log in with your new password", {
        duration: 5000 // Show for 5 seconds
      });

      // Force a complete page reload to clear all state
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isCurrentPasswordValid) {
      setCurrentPasswordError("Please verify your current password first");
      return;
    }

    if (passwordMatchError) {
      toast.error("Please make sure your new passwords match");
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      // Update password
      const endpoint = `/${userType}s/change-password/${user?.id}`;

      // First, verify current password one last time
      const verifyResponse = await apiClient.post(`/auth/login`, {
        id: user?.id,
        password: formData.currentPassword,
      },
        {
          headers: {
            "Content-Type": "application/json",
          }
        }
      );

      if (!verifyResponse.data.successful) {
        throw new Error("Current password verification failed. Please try again.");
      }

      // Then update the password
      const response = await apiClient.put(endpoint, {
        password: formData.newPassword.trim(),
      },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          }
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error || "Failed to change password");
      }

      toast.success("Password changed successfully. Please wait...");
      setIsOpen(false);
      resetForm();

      setTimeout(() => {
        toast.success("Logging out...");
        setTimeout(() => {
          handleLogout();
        }, 1000);
      }, 2000);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change password");
      console.error("Password change error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = isCurrentPasswordValid &&
    formData.newPassword.length >= 8 &&
    formData.newPassword === formData.confirmPassword;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            Change Password
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Password</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading || isVerifyingPassword || isCurrentPasswordValid}
                    placeholder="Enter your current password"
                    className={currentPasswordError ? "border-red-500 pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={isLoading || isVerifyingPassword || isCurrentPasswordValid}
                  >
                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {!isCurrentPasswordValid && (
                  <Button
                    type="button"
                    onClick={verifyCurrentPassword}
                    disabled={isLoading || isVerifyingPassword || !formData.currentPassword}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    {isVerifyingPassword ? "Verifying..." : "Verify"}
                  </Button>
                )}
              </div>
              {currentPasswordError && (
                <p className="text-sm text-red-500">{currentPasswordError}</p>
              )}
              {isCurrentPasswordValid && (
                <p className="text-sm text-emerald-500">Current password verified</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">New Password</label>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                required
                disabled={isLoading || !isCurrentPasswordValid}
                placeholder="Enter new password (min. 8 characters)"
                minLength={8}
                className={`${formData.newPassword && formData.newPassword.length < 8 ? "border-red-500" : ""} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isLoading || !isCurrentPasswordValid}
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.newPassword && formData.newPassword.length < 8 && (
              <p className="text-sm text-red-500">Password must be at least 8 characters long</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm New Password</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                disabled={isLoading || !isCurrentPasswordValid}
                placeholder="Confirm new password"
                minLength={8}
                className={`${passwordMatchError ? "border-red-500" : formData.confirmPassword && !passwordMatchError ? "border-emerald-500" : ""} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isLoading || !isCurrentPasswordValid}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {passwordMatchError && (
              <p className="text-sm text-red-500">{passwordMatchError}</p>
            )}
            {formData.confirmPassword && !passwordMatchError && (
              <p className="text-sm text-emerald-500">Passwords match</p>
            )}
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="text-sm font-medium mb-2">Password Requirements:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className={`flex items-center gap-2 ${formData.newPassword.length >= 8 ? "text-emerald-600" : ""}`}>
                • Minimum 8 characters
              </li>
              <li className={`flex items-center gap-2 ${formData.newPassword === formData.confirmPassword && formData.newPassword ? "text-emerald-600" : ""}`}>
                • Passwords must match
              </li>
            </ul>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                resetForm();
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 