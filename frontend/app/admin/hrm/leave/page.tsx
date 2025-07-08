"use client";
import { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Calendar, Clock, CheckCircle, X } from 'lucide-react';
import { AuthContext } from '@/context/auth-context';
import axios from 'axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

// Interfaces for leave data
interface LeaveRequest {
  id?: number;
  eid: number;
  employee_name: string;
  from_date: string;
  to_date: string;
  type: string;
  status: 'Approved' | 'Rejected' | 'Pending' | 'Cancelled';
  duration?: number;
  job_title?: string;
}

interface Employee {
  eid: number;
  name: string;
  job_title?: string;
}

interface LeaveSummary {
  annual: number;
  sick: number;
  casual: number;
  pending: number;
}

export default function LeavesManagementPage() {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const { accessToken, isLoggedIn, user } = useContext(AuthContext);
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveSummary, setLeaveSummary] = useState<LeaveSummary>({
    annual: 0,
    sick: 0,
    casual: 0,
    pending: 0
  });
  
  // Form state for new leave request
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLeaveRequest, setNewLeaveRequest] = useState({
    eid: 0,
    from_date: '',
    to_date: '',
    type: 'Annual',
    status: 'Approved' // Default to Approved for admin-added leaves
  });

  // Load data on component mount
  useEffect(() => {
    if (isLoggedIn && backendURL) {
      fetchData();
    }
  }, [isLoggedIn, backendURL]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all leave requests
      const leaveResponse = await axios.get(`${backendURL}/hr/leaves`);
      setLeaveRequests(leaveResponse.data || []);
      
      // Fetch all employees for the dropdown
      const employeesResponse = await axios.get(`${backendURL}/hr/employees`);
      setEmployees(employeesResponse.data || []);
      
      // Calculate leave summary
      const summary: LeaveSummary = {
        annual: 0,
        sick: 0,
        casual: 0,
        pending: 0
      };
      
      leaveResponse.data.forEach((leave: LeaveRequest) => {
        if (leave.status === 'Approved') {
          switch (leave.type) {
            case 'Annual':
              summary.annual += leave.duration || 0;
              break;
            case 'Sick':
              summary.sick += leave.duration || 0;
              break;
            case 'Casual':
              summary.casual += leave.duration || 0;
              break;
          }
        } else if (leave.status === 'Pending') {
          summary.pending += 1;
        }
      });
      
      setLeaveSummary(summary);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewLeaveRequest(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLeaveTypeChange = (value: string) => {
    setNewLeaveRequest(prev => ({
      ...prev,
      type: value
    }));
  };
  
  const handleEmployeeChange = (value: string) => {
    setNewLeaveRequest(prev => ({
      ...prev,
      eid: parseInt(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the employee is selected
    if (!newLeaveRequest.eid) {
      toast.error('Please select an employee');
      return;
    }
    
    try {
      // For admin, we'll directly set the status to Approved
      const leaveData = {
        ...newLeaveRequest,
        status: 'Approved' // Admin is directly adding approved leaves
      };
      
      await axios.post(`${backendURL}/hr/leaves`, leaveData);
      toast.success('Leave added successfully');
      setIsDialogOpen(false);
      
      // Reset the form
      setNewLeaveRequest({
        eid: 0,
        from_date: '',
        to_date: '',
        type: 'Annual',
        status: 'Approved'
      });
      
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error adding leave:', error);
      toast.error(error.response?.data?.message || 'Failed to add leave');
    }
  };

  const handleStatusChange = async (leave: LeaveRequest, newStatus: 'Approved' | 'Rejected') => {
    try {
      await axios.put(
        `${backendURL}/hr/leaves/${leave.eid}/${leave.from_date}/${leave.to_date}/status`,
        { status: newStatus }
      );
      toast.success(`Leave request ${newStatus.toLowerCase()} successfully`);
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error updating leave status:', error);
      toast.error(error.response?.data?.message || `Failed to ${newStatus.toLowerCase()} leave request`);
    }
  };

  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Leave Management</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          Add Leave
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Annual Leave Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-md font-medium">Annual Leave</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveSummary.annual}</div>
            <p className="text-xs text-muted-foreground">Days taken this year</p>
          </CardContent>
        </Card>

        {/* Sick Leave Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-md font-medium">Sick Leave</CardTitle>
              <FileText className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveSummary.sick}</div>
            <p className="text-xs text-muted-foreground">Days taken this year</p>
          </CardContent>
        </Card>

        {/* Casual Leave Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-md font-medium">Casual Leave</CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveSummary.casual}</div>
            <p className="text-xs text-muted-foreground">Days taken this year</p>
          </CardContent>
        </Card>

        {/* Pending Requests Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-md font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveSummary.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card className="hover:shadow-md transition-shadow mt-6">
        <CardHeader>
          <CardTitle className="text-xl">Leave Requests</CardTitle>
          <CardDescription>Manage employee leave requests</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading leave data...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>List of all employee leave requests</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        No leave requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaveRequests.map((leave, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {leave.employee_name}
                          {leave.job_title && <div className="text-xs text-muted-foreground">{leave.job_title}</div>}
                        </TableCell>
                        <TableCell>{leave.type}</TableCell>
                        <TableCell>{leave.from_date}</TableCell>
                        <TableCell>{leave.to_date}</TableCell>
                        <TableCell>
                          {leave.duration || calculateDuration(leave.from_date, leave.to_date)} days
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(leave.status)}>
                            {leave.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {leave.status === 'Pending' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => handleStatusChange(leave, 'Approved')}
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => handleStatusChange(leave, 'Rejected')}
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add Leave Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Employee Leave</DialogTitle>
            <DialogDescription>
              Add an approved leave for an employee.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* Employee Selection */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="employee" className="text-right">
                  Employee
                </Label>
                <Select
                  value={newLeaveRequest.eid ? newLeaveRequest.eid.toString() : ''}
                  onValueChange={handleEmployeeChange}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.eid} value={employee.eid.toString()}>
                        {employee.name} {employee.job_title ? `(${employee.job_title})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Leave Type Selection */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Leave Type
                </Label>
                <Select
                  value={newLeaveRequest.type}
                  onValueChange={handleLeaveTypeChange}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select Leave Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Annual">Annual Leave</SelectItem>
                    <SelectItem value="Sick">Sick Leave</SelectItem>
                    <SelectItem value="Casual">Casual Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="from_date" className="text-right">
                  From
                </Label>
                <Input
                  id="from_date"
                  name="from_date"
                  type="date"
                  className="col-span-3"
                  value={newLeaveRequest.from_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="to_date" className="text-right">
                  To
                </Label>
                <Input
                  id="to_date"
                  name="to_date"
                  type="date"
                  className="col-span-3"
                  value={newLeaveRequest.to_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Leave
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to calculate duration between two dates
function calculateDuration(fromDate: string, toDate: string): number {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  return diffDays;
}