'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axios from 'axios';

//backend url
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

interface BankInfo {
  account_holder: string;
  account_no: string;
  bank_name: string;
  branch: string;
  account_type: string;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string;
}

interface Employee {
  eid: number;
  name: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  province: string;
  zip_code: string;
  job_title: string;
  employment_status: string;
  salary: string;
  bank_info: BankInfo[];
  emergency_contact: EmergencyContact[];
}

interface AddStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  employeeData?: Employee;
  isEditing?: boolean;
}

const defaultBankInfo = {
  account_holder: '',
  account_no: '',
  bank_name: '',
  branch: '',
  account_type: ''
};

const defaultEmergencyContact = {
  name: '',
  relationship: '',
  phone: '',
  email: ''
};

const defaultFormData = {
  name: '',
  dob: '',
  gender: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  province: '',
  zip_code: '',
  job_title: '',
  employment_status: '',
  salary: '',
  bank_info: [defaultBankInfo],
  emergency_contact: [defaultEmergencyContact]
};

export function AddStaffDialog({ 
  open, 
  onOpenChange, 
  onSuccess, 
  employeeData, 
  isEditing = false 
}: AddStaffDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);

  // Populate form data when editing
  useEffect(() => {
    if (isEditing && employeeData) {
      setFormData({
        ...employeeData,
        salary: employeeData.salary.toString(),
        dob: new Date(employeeData.dob).toISOString().split('T')[0],
        // Ensure bank_info and emergency_contact always have one entry
        bank_info: employeeData.bank_info.length > 0 
          ? employeeData.bank_info 
          : [defaultBankInfo],
        emergency_contact: employeeData.emergency_contact.length > 0 
          ? employeeData.emergency_contact 
          : [defaultEmergencyContact]
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [isEditing, employeeData, open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBankInfoChange = (index: number, field: keyof BankInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      bank_info: prev.bank_info.map((info, i) => 
        i === index ? { ...info, [field]: value } : info
      )
    }));
  };

  const handleEmergencyContactChange = (index: number, field: keyof EmergencyContact, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergency_contact: prev.emergency_contact.map((contact, i) => 
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing && employeeData) {
        // Update existing employee
        const employeeResponse = await axios.put(`${backendUrl}/employees/${employeeData.eid}`, {
          ...formData,
          salary: Number(formData.salary),
          bank_info: formData.bank_info,
          emergency_contact: formData.emergency_contact
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });

        if (employeeResponse.status === 200) {
          toast.success('Employee updated successfully');
          onSuccess();
          onOpenChange(false);
        } else {
          throw new Error('Failed to update employee');
        }
      } else {
        // Create new employee
        await axios.post(`${backendUrl}/hr/employees`, {
          ...formData,
          salary: Number(formData.salary)
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });
        toast.success('Employee added successfully');
        onSuccess();
        onOpenChange(false);
        setFormData(defaultFormData);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          toast.error('Employee not found');
        } else {
          toast.error(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} employee`);
        }
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditing ? 'Edit Staff Member' : 'Add New Staff Member'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium" htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium" htmlFor="dob">Date of Birth *</Label>
                <Input
                  id="dob"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium" htmlFor="gender">Gender *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleSelectChange('gender', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-medium" htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium" htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium" htmlFor="employment_status">Employment Status *</Label>
                <Select
                  value={formData.employment_status}
                  onValueChange={(value) => handleSelectChange('employment_status', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full time">Full Time</SelectItem>
                    <SelectItem value="part time">Part Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-medium" htmlFor="job_title">Job Title *</Label>
                <Input
                  id="job_title"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium" htmlFor="salary">Salary *</Label>
                <Input
                  id="salary"
                  name="salary"
                  type="number"
                  value={formData.salary}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium" htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium" htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium" htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium" htmlFor="province">Province</Label>
                <Input
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium" htmlFor="zip_code">ZIP Code</Label>
                <Input
                  id="zip_code"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Bank Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Bank Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded">
              <div className="space-y-2">
                <Label className="font-medium">Account Holder</Label>
                <Input
                  value={formData.bank_info[0].account_holder}
                  onChange={(e) => handleBankInfoChange(0, 'account_holder', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Account Number</Label>
                <Input
                  value={formData.bank_info[0].account_no}
                  onChange={(e) => handleBankInfoChange(0, 'account_no', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Bank Name</Label>
                <Input
                  value={formData.bank_info[0].bank_name}
                  onChange={(e) => handleBankInfoChange(0, 'bank_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Branch</Label>
                <Input
                  value={formData.bank_info[0].branch}
                  onChange={(e) => handleBankInfoChange(0, 'branch', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Account Type</Label>
                <Input
                  value={formData.bank_info[0].account_type}
                  onChange={(e) => handleBankInfoChange(0, 'account_type', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded">
              <div className="space-y-2">
                <Label className="font-medium">Name</Label>
                <Input
                  value={formData.emergency_contact[0].name}
                  onChange={(e) => handleEmergencyContactChange(0, 'name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Relationship</Label>
                <Input
                  value={formData.emergency_contact[0].relationship}
                  onChange={(e) => handleEmergencyContactChange(0, 'relationship', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Phone</Label>
                <Input
                  value={formData.emergency_contact[0].phone}
                  onChange={(e) => handleEmergencyContactChange(0, 'phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Email</Label>
                <Input
                  value={formData.emergency_contact[0].email}
                  onChange={(e) => handleEmergencyContactChange(0, 'email', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              disabled={loading}
            >
              {loading ? 'Loading...' : isEditing ? 'Save Changes' : 'Add Staff Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}