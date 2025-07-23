'use client';

import { useState, useEffect, useContext } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { AuthContext } from '@/context/auth-context';

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

interface StaffMember {
  id: string | number;
  name: string;
  email: string;
  phone_number: string;
  role: 'dentist' | 'receptionist' | 'radiologist';
}

interface AvailableStaff {
  dentists: Array<Omit<StaffMember, 'role'>>;
  receptionists: Array<Omit<StaffMember, 'role'>>;
  radiologists: Array<Omit<StaffMember, 'role'>>;
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
  bank_info: defaultBankInfo,
  emergency_contact: defaultEmergencyContact
};

export function AddStaffDialog({
  open,
  onOpenChange,
  onSuccess,
  employeeData,
  isEditing = false
}: AddStaffDialogProps) {
  const { apiClient } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [availableStaff, setAvailableStaff] = useState<AvailableStaff>({
    dentists: [],
    receptionists: [],
    radiologists: []
  });
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  // Fetch available staff when dialog opens for adding new employee
  useEffect(() => {
    if (open && !isEditing) {
      fetchAvailableStaff();
    }
  }, [open, isEditing]);

  // Populate form data when editing
  useEffect(() => {
    if (isEditing && employeeData) {
      setFormData({
        ...employeeData,
        salary: employeeData.salary.toString(),
        dob: new Date(employeeData.dob).toISOString().split('T')[0],
        bank_info: employeeData.bank_info && employeeData.bank_info.length > 0
          ? employeeData.bank_info[0]
          : defaultBankInfo,
        emergency_contact: employeeData.emergency_contact && employeeData.emergency_contact.length > 0
          ? employeeData.emergency_contact[0]
          : defaultEmergencyContact
      });
    } else {
      setFormData(defaultFormData);
      setSelectedStaff(null);
    }
  }, [isEditing, employeeData, open]);


  // Fetch available staff members who are not yet registered as employees
  const fetchAvailableStaff = async () => {
    setLoadingStaff(true);
    try {
      console.log('Fetching staff from:', `/hr/employees/new`);
      const response = await apiClient.get(`/hr/employees/new`, {
        withCredentials: true
      });

      console.log('Raw API response:', response.data);

      // Process the staff data to normalize the ID field
      const processStaffList = (staffList: any[], idField: string) => {
        return (staffList || []).map(staff => ({
          ...staff,
          id: staff[idField] // Map role-specific ID to generic id field
        }));
      };

      const processedData = {
        dentists: processStaffList(response.data.dentists, 'dentist_id'),
        receptionists: processStaffList(response.data.receptionists, 'receptionist_id'),
        radiologists: processStaffList(response.data.radiologists, 'radiologist_id')
      };

      console.log('Processed staff data:', processedData);
      console.log('Dentists count:', processedData.dentists.length);
      console.log('Receptionists count:', processedData.receptionists.length);
      console.log('Radiologists count:', processedData.radiologists.length);

      setAvailableStaff(processedData);
    } catch (error) {
      console.error('Error fetching available staff:', error);
      toast.error('Failed to load staff members');
    } finally {
      setLoadingStaff(false);
    }
  };

  // Handle staff member selection
  const handleStaffSelect = (staff: StaffMember) => {
    console.log('Selecting staff:', staff);

    // Create a completely new form data object
    const newFormData = {
      ...defaultFormData,  // Start with default values
      name: staff.name,
      email: staff.email,
      phone: staff.phone_number || '', // Ensure we don't pass undefined
      job_title: staff.role.charAt(0).toUpperCase() + staff.role.slice(1),
      // Preserve bank info and emergency contact from existing form data
      bank_info: formData.bank_info,
      emergency_contact: formData.emergency_contact
    };

    console.log('New form data:', newFormData);
    setSelectedStaff(staff);
    setFormData(newFormData);
  };

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

  const handleBankInfoChange = (field: keyof BankInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      bank_info: {
        ...prev.bank_info,
        [field]: value,
      }
    }));
  };

  const handleEmergencyContactChange = (field: keyof EmergencyContact, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergency_contact: {
        ...prev.emergency_contact,
        [field]: value
      }
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing && employeeData) {
        // Update existing employee
        const employeeResponse = await apiClient.put(`/hr/employees/${employeeData.eid}`, {
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
        await apiClient.post(`/hr/employees/`, {
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
            <div className="space-y-4">
              {/* Staff Selection Dropdown */}
              {!isEditing && (
                <div className="space-y-2">
                  <Label className="font-medium" htmlFor="staff-select">Select Staff Member *</Label>
                  {loadingStaff ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2">Loading staff members...</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <Select
                        value={selectedStaff ? `${selectedStaff.role}_${selectedStaff.id}` : ''}
                        onValueChange={(value) => {
                          if (!value) {
                            console.log('Clearing selection');
                            setSelectedStaff(null);
                            setFormData(prev => ({
                              ...prev,
                              name: '',
                              email: '',
                              phone: '',
                              job_title: ''
                            }));
                            return;
                          }

                          const [role, id] = value.split('_') as [string, string];
                          const staffList = availableStaff[`${role}s` as keyof AvailableStaff] as Array<{ id: string | number, name: string, email: string, phone_number: string }>;
                          const staff = staffList.find(s => String(s.id) === id);

                          if (staff) {
                            // Create a new staff member object with the correct role
                            const selectedStaffMember: StaffMember = {
                              id: staff.id,
                              name: staff.name,
                              email: staff.email,
                              phone_number: staff.phone_number,
                              role: role as 'dentist' | 'receptionist' | 'radiologist'
                            };

                            console.log('Selected staff member:', selectedStaffMember);
                            handleStaffSelect(selectedStaffMember);
                          } else {
                            console.error('Staff not found in list');
                          }
                        }}
                        disabled={loading || loadingStaff}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a staff member" />
                        </SelectTrigger>
                        <SelectContent className="max-h-96 overflow-y-auto">
                          {availableStaff.dentists.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 sticky top-0 bg-white dark:bg-gray-900 z-10">Dentists</div>
                              {availableStaff.dentists
                                .filter(dentist => dentist.id !== undefined && dentist.id !== null)
                                .map((dentist, index) => {
                                  const key = `dentist_${dentist.id || index}`;
                                  return (
                                    <SelectItem key={key} value={key} className="flex flex-col items-start py-2">
                                      <span className="block truncate max-w-full">{dentist.name}</span>
                                    </SelectItem>
                                  );
                                })}
                            </>
                          )}
                          {availableStaff.receptionists.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 sticky top-0 bg-white dark:bg-gray-900 z-10">Receptionists</div>
                              {availableStaff.receptionists
                                .filter(receptionist => receptionist.id !== undefined && receptionist.id !== null)
                                .map((receptionist, index) => {
                                  const key = `receptionist_${receptionist.id || index}`;
                                  return (
                                    <SelectItem key={key} value={key} className="flex flex-col items-start py-2">
                                      <span className="block truncate max-w-full">{receptionist.name}</span>
                                    </SelectItem>
                                  );
                                })}
                            </>
                          )}
                          {availableStaff.radiologists.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 sticky top-0 bg-white dark:bg-gray-900 z-10">Radiologists</div>
                              {availableStaff.radiologists
                                .filter(radiologist => radiologist.id !== undefined && radiologist.id !== null)
                                .map((radiologist, index) => {
                                  const key = `radiologist_${radiologist.id || index}`;
                                  return (
                                    <SelectItem key={key} value={key} className="flex flex-col items-start py-2">
                                      <span className="block truncate max-w-full">{radiologist.name}</span>
                                    </SelectItem>
                                  );
                                })}
                            </>
                          )}
                          {availableStaff.dentists.length === 0 && availableStaff.receptionists.length === 0 && availableStaff.radiologists.length === 0 && (
                            <div className="px-2 py-1.5 text-sm text-gray-500">No staff members available</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label className="font-medium" htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={loading || (!!selectedStaff && !isEditing)}
                    readOnly={!!selectedStaff && !isEditing}
                    className="w-full"
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
                    disabled={loading || (!!selectedStaff && !isEditing)}
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
                    disabled={loading || (!!selectedStaff && !isEditing)}
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
                  <Select
                    value={formData.job_title}
                    onValueChange={(value) => handleSelectChange('job_title', value)}
                    required
                  >
                    <SelectTrigger id="job_title">
                      <SelectValue placeholder="Select job title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dentist">Dentist</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="radiologist">Radiologist</SelectItem>
                    </SelectContent>
                  </Select>
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
                  value={formData.bank_info.account_holder}
                  onChange={(e) => handleBankInfoChange('account_holder', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Account Number</Label>
                <Input
                  value={formData.bank_info.account_no}
                  onChange={(e) => handleBankInfoChange('account_no', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Bank Name</Label>
                <Input
                  value={formData.bank_info.bank_name}
                  onChange={(e) => handleBankInfoChange('bank_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Branch</Label>
                <Input
                  value={formData.bank_info.branch}
                  onChange={(e) => handleBankInfoChange('branch', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Account Type</Label>
                <Input
                  value={formData.bank_info.account_type}
                  onChange={(e) => handleBankInfoChange('account_type', e.target.value)}
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
                  value={formData.emergency_contact.name}
                  onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Relationship</Label>
                <Input
                  value={formData.emergency_contact.relationship}
                  onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Phone</Label>
                <Input
                  value={formData.emergency_contact.phone}
                  onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Email</Label>
                <Input
                  value={formData.emergency_contact.email}
                  onChange={(e) => handleEmergencyContactChange('email', e.target.value)}
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
            /*onClick={}*/
            >
              {loading ? 'Loading...' : isEditing ? 'Save Changes' : 'Add Staff Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}