"use client";

import { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AuthContext } from '@/context/auth-context';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, DollarSign, User, CreditCard, CheckCircle, BarChart, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// Interface for bank info
interface BankInfo {
  eid: number;
  account_holder: string;
  account_no: string;
  bank_name: string;
  branch?: string;
  account_type?: string;
}

// Interface for employee data
interface Employee {
  eid: number;
  name: string;
  email: string;
  job_title?: string;
  employment_status: string;
  salary: number;
  bank_info: BankInfo[];
}

// Interface for payroll data
interface Payroll {
  payroll_id: number;
  eid: number;
  net_salary: number;
  epf: boolean;
  etf: boolean;
  status: string;
  employee: Employee;
}

export default function PayrollPage() {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const { isLoggedIn, isLoadingAuth, user, apiClient } = useContext(AuthContext);
  const router = useRouter();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState<Payroll[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewPayrollDialogOpen, setViewPayrollDialogOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  
  // New payroll form data
  const [newPayroll, setNewPayroll] = useState({
    eid: 0,
    base_salary: 0,
    ot_amount: 0,
    bonus_amount: 0,
    gross_salary: 0,
    net_salary: 0,
    epf: true,
    etf: true,
    status: 'Not Processed'
  });
  
  // Employee data for payroll creation
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  
  // EPF/ETF rates (could be made configurable)
  const EPF_RATE = 0.08; // 8%
  const ETF_RATE = 0.03; // 3%
  
  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!isLoggedIn || !backendURL) {
        return;
      }
      
      setLoading(true);
      try {
        // Fetch payrolls with detailed information
        const payrollResponse = await apiClient.get(`/hr/payroll/payroll-details`);
        
        setPayrolls(payrollResponse.data || []);
        setFilteredPayrolls(payrollResponse.data || []);
      } catch (error) {
        console.error('Error fetching payroll data:', error);
        toast.error('Failed to load payroll data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [backendURL, isLoggedIn]);
  
  // Filter payrolls based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPayrolls(payrolls);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = payrolls.filter((payroll) => {
      return (
        payroll.employee.name.toLowerCase().includes(query) ||
        payroll.employee.email.toLowerCase().includes(query) ||
        (payroll.employee.job_title?.toLowerCase() || '').includes(query) ||
        payroll.status.toLowerCase().includes(query) ||
        String(payroll.eid).includes(query)
      );
    });
    
    setFilteredPayrolls(filtered);
  }, [searchQuery, payrolls]);

  useEffect(()=>{
    if(isLoadingAuth) return;
    if(!isLoggedIn){
      toast.error("Login Error", {description:"Please Login"});
      router.push("/");
    }
    else if(user.role != "admin"){
      toast.error("Access Denied", {description:"You do not have admin priviledges"});
      router.push("/");
    }
  },[isLoadingAuth]);
  
  // Process salary function
  const processSalary = async (payroll: Payroll) => {
    try {
      await apiClient.put(`/hr/payroll/${payroll.payroll_id}`, {
        net_salary: payroll.net_salary,
        epf: payroll.epf,
        etf: payroll.etf,
        status: 'Processed'
      });
      
      // Update local state
      const updatedPayrolls = payrolls.map(p => {
        if (p.payroll_id === payroll.payroll_id) {
          return { ...p, status: 'Processed' };
        }
        return p;
      });
      
      setPayrolls(updatedPayrolls);
      setFilteredPayrolls(updatedPayrolls.filter(p => 
        filteredPayrolls.some(fp => fp.payroll_id === p.payroll_id)
      ));
      
      toast.success(`Salary processed for ${payroll.employee.name}`);
    } catch (error) {
      console.error('Error processing salary:', error);
      toast.error('Failed to process salary');
    }
  };
  
  // Fetch employee details when ID is entered
  const fetchEmployeeDetails = async (employeeId: number) => {
    try {
      if (!employeeId) return;
      
      const response = await apiClient.get(`/hr/employees/${employeeId}`);
      
      if (response.data) {
        setSelectedEmployee(response.data);
        
        // Update the newPayroll with employee's base salary
        const baseSalary = response.data.salary || 0;
        setNewPayroll(prev => ({
          ...prev,
          eid: employeeId,
          base_salary: baseSalary,
          gross_salary: baseSalary,
          net_salary: calculateNetSalary(baseSalary, 0, 0, prev.epf, prev.etf)
        }));
        
        toast.success(`Employee ${response.data.name} found`);
      } else {
        setSelectedEmployee(null);
        toast.error('Employee not found');
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
      toast.error('Failed to fetch employee details');
      setSelectedEmployee(null);
    }
  };
  
  // Calculate net salary after EPF/ETF deductions
  const calculateNetSalary = (baseSalary: number, otAmount: number, bonusAmount: number, applyEpf: boolean, applyEtf: boolean) => {
    const grossSalary = baseSalary + otAmount + bonusAmount;
    let deductions = 0;
    
    if (applyEpf) {
      deductions += grossSalary * EPF_RATE;
    }
    
    if (applyEtf) {
      deductions += grossSalary * ETF_RATE;
    }
    
    return grossSalary - deductions;
  };
  
  // Calculate gross salary and update net salary when values change
  const updateSalaryCalculations = (otAmount: number, bonusAmount: number, applyEpf: boolean, applyEtf: boolean) => {
    const baseSalary = newPayroll.base_salary;
    const grossSalary = baseSalary + otAmount + bonusAmount;
    const netSalary = calculateNetSalary(baseSalary, otAmount, bonusAmount, applyEpf, applyEtf);
    
    setNewPayroll(prev => ({
      ...prev,
      ot_amount: otAmount,
      bonus_amount: bonusAmount,
      gross_salary: grossSalary,
      net_salary: netSalary,
      epf: applyEpf,
      etf: applyEtf
    }));
  };
  
  // Prepare payroll data for confirmation
  const preparePayrollConfirmation = () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee first');
      return;
    }
    
    // Recalculate values to ensure accuracy
    updateSalaryCalculations(
      newPayroll.ot_amount,
      newPayroll.bonus_amount,
      newPayroll.epf,
      newPayroll.etf
    );
    
    setConfirmationOpen(true);
  };
  
  // Add new payroll function - final submission after confirmation
  const addNewPayroll = async () => {
    try {
      if (!selectedEmployee || !newPayroll.eid) {
        toast.error('Please provide employee information');
        return;
      }
      
      // Create the payroll with calculated values
      const payrollData = {
        eid: newPayroll.eid,
        net_salary: newPayroll.net_salary,
        epf: newPayroll.epf,
        etf: newPayroll.etf,
        status: 'Not Processed'
      };
      
      await apiClient.post(`/hr/payroll`, payrollData);
      
      // Refresh data
      const payrollResponse = await apiClient.get(`/hr/payroll/payroll-details`);
    
      setPayrolls(payrollResponse.data || []);
      setFilteredPayrolls(payrollResponse.data || []);
      
      // Reset form and close dialogs
      setNewPayroll({
        eid: 0,
        base_salary: 0,
        ot_amount: 0,
        bonus_amount: 0,
        gross_salary: 0,
        net_salary: 0,
        epf: true,
        etf: true,
        status: 'Not Processed'
      });
      setSelectedEmployee(null);
      setConfirmationOpen(false);
      setAddDialogOpen(false);
      
      toast.success('Payroll record added successfully');
    } catch (error) {
      console.error('Error adding payroll record:', error);
      toast.error('Failed to add payroll record');
    }
  };
  
  // View payroll details
  const viewPayroll = (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setViewPayrollDialogOpen(true);
  };
  
  // Get bank account info as formatted string
  const getBankInfo = (payroll: Payroll) => {
    if (payroll.employee.bank_info && payroll.employee.bank_info.length > 0) {
      const bankInfo = payroll.employee.bank_info[0];
      return bankInfo.account_no;
    }
    return '-';
  };
  
  // Get bank name
  const getBankName = (payroll: Payroll) => {
    if (payroll.employee.bank_info && payroll.employee.bank_info.length > 0) {
      const bankInfo = payroll.employee.bank_info[0];
      return bankInfo.bank_name;
    }
    return '-';
  };

  // Calculate statistics for cards
  const totalEmployees = payrolls.length > 0 ? new Set(payrolls.map(p => p.eid)).size : 0;
  const totalMonthlySalary = payrolls.reduce((sum, payroll) => sum + payroll.net_salary, 0);
  const pendingPayrolls = payrolls.filter(p => p.status !== 'Processed').length;
  const processedPayrolls = payrolls.filter(p => p.status === 'Processed').length;
  const averageSalary = totalEmployees > 0 ? totalMonthlySalary / totalEmployees : 0;
  const highestSalary = payrolls.length > 0 ? Math.max(...payrolls.map(p => p.net_salary)) : 0;
  
  return (
    <div className="w-full">
      <div className="space-y-6 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Employees Salary Processing</h2>
          
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search employees..."
                className="w-64 pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button  className='bg-emerald-500 hover:bg-emerald-600 text-white' onClick={() => setAddDialogOpen(true)}>
              Add Payroll
            </Button>
          </div>
        </div>
        
        {/* Statistics Cards */}
        <Card className="hover:shadow-md transition-shadow p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-bold">Payroll Overview</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Employees Card */}
              <div className="flex justify-between items-center p-4 border rounded-md">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Total Employees:</h3>
                  <p className="text-2xl font-bold">{totalEmployees}</p>
                </div>
                <User className="h-8 w-8 text-blue-500" />
              </div>
              
              {/* Total Monthly Salary Card */}
              <div className="flex justify-between items-center p-4 border rounded-md">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Total Monthly Salary:</h3>
                  <p className="text-2xl font-bold">LKR {totalMonthlySalary.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
              
              {/* Pending Payrolls Card */}
              <div className="flex justify-between items-center p-4 border rounded-md">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Pending Payrolls:</h3>
                  <p className="text-2xl font-bold">{pendingPayrolls}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
              
              {/* Processed Payrolls Card */}
              <div className="flex justify-between items-center p-4 border rounded-md">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Processed Payrolls:</h3>
                  <p className="text-2xl font-bold">{processedPayrolls}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              
              {/* Average Salary Card */}
              <div className="flex justify-between items-center p-4 border rounded-md">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Average Salary:</h3>
                  <p className="text-2xl font-bold">LKR {averageSalary.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <BarChart className="h-8 w-8 text-blue-500" />
              </div>
              
              {/* Highest Salary Card */}
              <div className="flex justify-between items-center p-4 border rounded-md">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Highest Salary:</h3>
                  <p className="text-2xl font-bold">LKR {highestSalary.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Payroll Table */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-10">Loading payroll data...</div>
            ) : filteredPayrolls.length === 0 ? (
              <div className="text-center py-10">No payroll records found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-8 w-[150px]">Name</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead className="text-center">EPF</TableHead>
                      <TableHead className="text-center">ETF</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayrolls.map((payroll) => (
                      <TableRow key={payroll.payroll_id}>
                        <TableCell className="font-medium pl-6">{payroll.employee.name}</TableCell>
                        <TableCell>{payroll.eid}</TableCell>
                        <TableCell>{payroll.employee.email}</TableCell>
                        <TableCell>LKR {payroll.net_salary.toFixed(2)}</TableCell>
                        <TableCell>{getBankName(payroll)}</TableCell>
                        <TableCell className="text-center">
                          {payroll.epf ? 'Yes' : 'No'}
                        </TableCell>
                        <TableCell className="text-center">
                          {payroll.etf ? 'Yes' : 'No'}
                        </TableCell>
                        <TableCell className="text-center">
                          {payroll.status === 'Processed' ? (
                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                              Processed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                              Not Processed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {payroll.status !== 'Processed' ? (
                            <Button
                              onClick={() => processSalary(payroll)}
                              className="mr-2 bg-blue-500 hover:bg-blue-600"
                              size="sm"
                            >
                              Process Salary
                            </Button>
                          ) : (
                            <Button
                              onClick={() => viewPayroll(payroll)}
                              variant="outline"
                              size="sm"
                            >
                              View Payroll
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Add Payroll Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Payroll</DialogTitle>
            <DialogDescription>
              Create a new payroll record for an employee.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="eid" className="text-right">Employee ID</Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="eid"
                  type="number"
                  value={newPayroll.eid || ''}
                  onChange={(e) => setNewPayroll({...newPayroll, eid: parseInt(e.target.value)})}
                  className="flex-1"
                />
                <Button onClick={() => fetchEmployeeDetails(newPayroll.eid)} type="button" size="sm">
                  Find
                </Button>
              </div>
            </div>
            
            {selectedEmployee && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Employee</Label>
                  <div className="col-span-3 text-sm">
                    <p className="font-medium">{selectedEmployee.name}</p>
                    <p className="text-muted-foreground">{selectedEmployee.email}</p>
                    <p className="text-muted-foreground">Base Salary: LKR {selectedEmployee.salary?.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="ot_amount" className="text-right">OT Amount</Label>
                  <Input
                    id="ot_amount"
                    type="number"
                    placeholder="0"
                    value={newPayroll.ot_amount || ''}
                    onChange={(e) => updateSalaryCalculations(
                      parseFloat(e.target.value) || 0,
                      newPayroll.bonus_amount,
                      newPayroll.epf,
                      newPayroll.etf
                    )}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bonus_amount" className="text-right">Bonus Amount</Label>
                  <Input
                    id="bonus_amount"
                    type="number"
                    placeholder="0"
                    value={newPayroll.bonus_amount || ''}
                    onChange={(e) => updateSalaryCalculations(
                      newPayroll.ot_amount,
                      parseFloat(e.target.value) || 0,
                      newPayroll.epf,
                      newPayroll.etf
                    )}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">EPF</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="epf"
                      checked={newPayroll.epf}
                      onCheckedChange={(checked) => updateSalaryCalculations(
                        newPayroll.ot_amount,
                        newPayroll.bonus_amount,
                        checked === true,
                        newPayroll.etf
                      )}
                    />
                    <label htmlFor="epf" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Availability
                    </label>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">ETF</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="etf"
                      checked={newPayroll.etf}
                      onCheckedChange={(checked) => updateSalaryCalculations(
                        newPayroll.ot_amount,
                        newPayroll.bonus_amount,
                        newPayroll.epf,
                        checked === true
                      )}
                    />
                    <label htmlFor="etf" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Availability
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={preparePayrollConfirmation} disabled={!selectedEmployee}>Calculate & Preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Payroll Confirmation Dialog */}
      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payroll Details</DialogTitle>
            <DialogDescription>
              Please review the salary calculations before adding this payroll record.
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="border rounded-md p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Employee:</span>
                  <span>{selectedEmployee.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Base Salary:</span>
                  <span>LKR {newPayroll.base_salary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>OT Amount:</span>
                  <span>LKR {newPayroll.ot_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Bonus Amount:</span>
                  <span>LKR {newPayroll.bonus_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center font-medium">
                  <span>Gross Salary:</span>
                  <span>LKR {newPayroll.gross_salary.toLocaleString()}</span>
                </div>
                <hr className="my-2" />
                {newPayroll.epf && (
                  <div className="flex justify-between items-center text-red-500">
                    <span>EPF Deduction ({(EPF_RATE * 100).toFixed(0)}%):</span>
                    <span>- LKR {(newPayroll.gross_salary * EPF_RATE).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                {newPayroll.etf && (
                  <div className="flex justify-between items-center text-red-500">
                    <span>ETF Deduction ({(ETF_RATE * 100).toFixed(0)}%):</span>
                    <span>- LKR {(newPayroll.gross_salary * ETF_RATE).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <hr className="my-2" />
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Net Salary:</span>
                  <span>LKR {newPayroll.net_salary.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmationOpen(false)}>Edit</Button>
            <Button onClick={addNewPayroll}>Confirm & Add Payroll</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Payroll Dialog */}
      <Dialog open={viewPayrollDialogOpen} onOpenChange={setViewPayrollDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payroll Details</DialogTitle>
          </DialogHeader>
          {selectedPayroll && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 rounded-md border p-4">
                <User className="h-5 w-5 text-blue-600" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{selectedPayroll.employee.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedPayroll.employee.email}</p>
                </div>
                <div>
                  <Badge variant="outline">{selectedPayroll.employee.employment_status}</Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Employee ID</p>
                  <p className="text-sm font-medium">{selectedPayroll.eid}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Job Title</p>
                  <p className="text-sm font-medium">{selectedPayroll.employee.job_title || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 rounded-md border p-4">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Net Salary</p>
                  <p className="text-sm text-muted-foreground">LKR {selectedPayroll.net_salary.toFixed(2)}</p>
                </div>
              </div>
              
              {selectedPayroll.employee.bank_info && selectedPayroll.employee.bank_info.length > 0 && (
                <div className="flex items-center space-x-4 rounded-md border p-4">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{selectedPayroll.employee.bank_info[0].bank_name}</p>
                    <p className="text-sm text-muted-foreground">Account: {selectedPayroll.employee.bank_info[0].account_no}</p>
                    <p className="text-xs text-muted-foreground">{selectedPayroll.employee.bank_info[0].account_holder}</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">EPF</p>
                  <p className="text-sm font-medium">{selectedPayroll.epf ? 'Yes' : 'No'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">ETF</p>
                  <p className="text-sm font-medium">{selectedPayroll.etf ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 rounded-md border p-4">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Payment Status</p>
                  <p className="text-sm text-muted-foreground">{selectedPayroll.status}</p>
                </div>
                <div>
                  {selectedPayroll.status === 'Processed' ? (
                    <Badge className="bg-green-100 text-green-800">Processed</Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800">Not Processed</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}