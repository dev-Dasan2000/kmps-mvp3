'use client';

import { useContext, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Trash2, Edit, X } from "lucide-react";
import { AddStaffDialog } from '@/components/AddStaffDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { AuthContext } from '@/context/auth-context';

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
  employment_status: 'full time' | 'part time';
  salary: string;
  bank_info: BankInfo[];
  emergency_contact: EmergencyContact[];
}

interface StaffDirectoryProps {
  employees: Employee[];
  onEmployeeAdded: () => void;
}

export function StaffDirectory({ employees, onEmployeeAdded }: StaffDirectoryProps) {
  const {apiClient} = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<number | null>(null);
  const router = useRouter();

  const filteredStaff = employees.filter(staff => 
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.eid.toString().includes(searchQuery.toLowerCase()) ||
    staff.job_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = async (id: number) => {
    const employee = employees.find(emp => emp.eid === id);
    if (employee) {
      setSelectedEmployee(employee);
      setIsEditDialogOpen(true);
    }
  };

  const handleDelete = async (id: number) => {
    setEmployeeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;

    setIsLoading(true);
    try {
      const response = await apiClient.delete(`/hr/employees/${employeeToDelete}`, {
        withCredentials: true
      });

      if (response.status === 200) {
        toast.success('Employee deleted successfully');
        onEmployeeAdded(); // Refresh the employee list
      } else {
        throw new Error('Failed to delete employee');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          toast.error('Employee not found');
        } else {
          toast.error(error.response?.data?.message || 'Failed to delete employee');
        }
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const handleUpdateEmployee = async (employeeData: Partial<Employee>) => {
  if (!selectedEmployee) return;

  setIsLoading(true);
  try {
    const response = await apiClient.put(`/employees/${selectedEmployee.eid}`, employeeData);

    toast.success('Employee updated successfully');
    setIsEditDialogOpen(false);
    onEmployeeAdded();
  } catch (error: any) {
    if (error.response?.status === 404) {
      toast.error('Employee not found');
    } else {
      toast.error(error.message || 'Failed to update employee');
    }
  } finally {
    setIsLoading(false);
  }
};

  const ScheduleBadge = ({ status }: { status: string }) => (
    <span className={`px-2 py-1 rounded-full ${
      status === 'full time' ? 'bg-green-100 text-green-800' :
      status === 'part time' ? 'bg-blue-100 text-blue-800' :
      'bg-gray-100 text-gray-800'
    }`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Directory</CardTitle>
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search staff..." 
              className="pl-8 pr-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button 
            className='bg-emerald-500 hover:bg-emerald-600 text-white' 
            onClick={() => setIsAddDialogOpen(true)}
          >
            Add Staff
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-medium">Employee ID</th>
                <th className="text-left py-4 px-4 font-medium">Name</th>
                <th className="text-left py-4 px-4 font-medium">Role</th>
                <th className="text-left py-4 px-4 font-medium">Schedule</th>
                <th className="text-left py-4 px-4 font-medium">Contact</th>
                <th className="text-left py-4 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((staff) => (
                <tr key={staff.eid} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-4">{staff.eid}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${staff.name}`} />
                        <AvatarFallback>{staff.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      {staff.name}
                    </div>
                  </td>
                  <td className="py-4 px-4">{staff.job_title}</td>
                  <td className="py-4 px-4">
                    <ScheduleBadge status={staff.employment_status}  />
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm">
                      <div>{staff.email}</div>
                      <div className="text-gray-500">{staff.phone}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(staff.eid)}
                        disabled={isLoading}
                      >
                        <Edit className="text-blue-600" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(staff.eid)}
                        disabled={isLoading}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View - Cards */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {filteredStaff.map((staff) => (
            <Card key={staff.eid} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${staff.name}`} />
                    <AvatarFallback>{staff.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{staff.name}</h3>
                      <ScheduleBadge status={staff.employment_status} />
                    </div>
                    <div className="mt-1 text-sm text-gray-500">{staff.job_title}</div>
                    <div className="mt-1 text-xs text-gray-400">ID: EMP{staff.eid.toString().padStart(4, '0')}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      <div>{staff.email}</div>
                      <div>{staff.phone}</div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEdit(staff.eid)}
                        disabled={isLoading}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(staff.eid)}
                        disabled={isLoading}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <AddStaffDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={onEmployeeAdded}
        />

        {selectedEmployee && (
          <AddStaffDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSuccess={() => {
              onEmployeeAdded();
              setSelectedEmployee(null);
            }}
            employeeData={selectedEmployee}
            isEditing={true}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) {
              setEmployeeToDelete(null);
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">Confirm Employee Deletion</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-700">Are you sure you want to delete this employee? This action cannot be undone.</p>
            </div>
            <DialogFooter className="flex space-x-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                className="px-4"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4"
              >
                Delete Employee
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}    