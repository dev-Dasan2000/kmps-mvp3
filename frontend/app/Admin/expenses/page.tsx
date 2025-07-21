'use client';

import React, { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Upload, Download, Eye, Edit, Trash2, Plus, Search, User, FileText, Clock, CheckCircle, XCircle, Check, Loader } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AuthContext } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import axios from 'axios';

interface Expense {
  expence_id: number;
  date: string;
  title: string;
  description: string;
  amount: number;
  receipt_url: string | null;
  dentists: Dentist;
  status: string;
}

interface Dentist {
  dentist_id: string;
  name: string;
}

interface ExpenseFormData {
  date: string;
  title: string;
  description: string;
  amount: string;
  receipt_url: string | null;
  dentist_id: string;
  status: string;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock size={14} />;
    case 'approved':
      return <CheckCircle size={14} />;
    case 'rejected':
      return <XCircle size={14} />;
    default:
      return <Clock size={14} />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isLoadingDentists, setIsLoadingDentists] = useState(false);
  const [isLoadingExpense, setIsLoadingExpenses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>({
    date: '',
    title: '',
    description: '',
    amount: '',
    receipt_url: null,
    dentist_id: '',
    status: 'pending'
  });

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();
  const { isLoadingAuth, isLoggedIn, user, apiClient } = useContext(AuthContext);

  useEffect(() => {
    fetchExpenses();
    fetchDentists();
  }, []);

  useEffect(() => {
    if (expenses && dentists) {
      setIsLoading(false);
    }
  }, [dentists, expenses])

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

  const fetchDentists = async () => {
    setIsLoadingDentists(true);
    try {
      const res = await apiClient.get(
        `/dentists`
      );
      if (res.status == 500) {
        throw new Error("Error fetching dentists");
      }
      setDentists(res.data);
    } catch (error: any) {
      toast.error(error.message);
    }
    finally {
      setIsLoadingDentists(false);
    }
  };

  const fetchExpenses = async () => {
    setIsLoadingExpenses(true);
    try {
      const res = await apiClient.get(
        `/expense`
      );
      if (res.status == 500) {
        throw new Error("Error fetching expense");
      }
      setExpenses(res.data);
    } catch (error: any) {
      toast.error(error.message);
    }
    finally {
      setIsLoadingExpenses(false);
    }
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    resetForm();
    setIsAddingExpense(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      date: new Date(expense.date).toISOString().split('T')[0],
      title: expense.title,
      description: expense.description || '',
      amount: expense.amount.toString(),
      receipt_url: expense.receipt_url,
      dentist_id: expense.dentists.dentist_id,
      status: expense.status
    });
    setIsAddingExpense(true);
  };

  const resetForm = () => {
    setFormData({
      date: '',
      title: '',
      description: '',
      amount: '',
      receipt_url: null,
      dentist_id: '',
      status: 'pending'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let uploadedUrl = ''
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post(`/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });
  
      uploadedUrl = res.data.url;
      handleInputChange('receipt_url', uploadedUrl);
    }
    try {
      const expenseData = {
        date: new Date(formData.date).toISOString(),
        title: formData.title,
        description: formData.description,
        amount: parseFloat(formData.amount),
        receipt_url: uploadedUrl,
        dentist_id: formData.dentist_id,
        status: formData.status
      };

      if (editingExpense) {
        const res = await apiClient.put(
          `/expense/${editingExpense.expence_id}`,
          {
            ...expenseData,
          }
        );
        if (res.status != 202) {
          throw new Error("Error Updating Expense Record");
        }
        const updatedExpense: Expense = {
          ...editingExpense,
          ...expenseData
        };

        setExpenses(expenses.map(expense =>
          expense.expence_id === editingExpense.expence_id ? updatedExpense : expense
        ));
      } else {
        const res = await apiClient.post(
          `/expense`,
          {
            date: expenseData.date,
            title: expenseData.title,
            description: expenseData.description,
            amount: expenseData.amount,
            receipt_url: expenseData.receipt_url,
            dentist_id: expenseData.dentist_id,
            status: "approved",
            reciept_url:expenseData.receipt_url
          },
          {
            withCredentials: true,
            headers: {
              "content-type": "application/json"
            }
          }
        );
        if (res.status != 201) {
          throw new Error("Error Creating New Expense");
        }
        const newExpense: Expense = {
          expence_id: res.data.expence_id,
          date: expenseData.date,
          title: expenseData.title,
          description: expenseData.description,
          amount: expenseData.amount,
          receipt_url: expenseData.receipt_url,
          dentists: {
            dentist_id: expenseData.dentist_id,
            name: dentists.find((dent) => dent.dentist_id == expenseData.dentist_id)?.name || "N/A"
          },
          status: "approved"
        };

        setExpenses([...expenses, newExpense]);
        toast.success("Expense added successfully");
      }

      resetForm();
      setIsAddingExpense(false);
      setEditingExpense(null);
    } catch (error: any) {
      console.error('Error saving expense:', error);
      toast.error("Error", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ExpenseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const acceptExpense = async (expence_id: number) => {
    setIsAccepting(true);
    try {
      const res = await apiClient.put(
        `/expense/${expence_id}`,
        {
          status: "approved"
        },
        {
          withCredentials: true,
          headers: {
            "content-type": "application/json"
          }
        }
      )

      setExpenses(expenses.map(expense =>
        expense.expence_id === expence_id
          ? { ...expense, status: 'approved' }
          : expense
      ));
      toast.success("Expense approved successfully");
    } catch (error) {
      console.error('Error accepting expense:', error);
      toast.error("Failed to approve expense");
    }
    finally {
      setIsAccepting(false);
    }
  };

  // Filter expenses based on search term
  const filteredExpenses = expenses.filter(expense =>
    expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.dentists?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.amount.toString().includes(searchTerm) ||
    expense.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-gray-50 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl mt-7 md:mt-0 font-bold text-gray-900">Expense Management</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage dental clinic expenses and receipts</p>
          </div>
          <Button
            onClick={handleAddExpense}
            className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus size={20} />
            Add Expense
          </Button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search expenses by title, description, dentist, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-transparent"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-200">
            <div className="grid grid-cols-[80px_minmax(120px,1fr)_minmax(140px,1fr)_minmax(140px,1fr)_100px_120px_100px] gap-4 text-sm font-medium text-gray-700">
              <div className="flex items-center">ID</div>
              <div className="flex items-center">Date</div>
              <div className="flex items-center">Title</div>
              <div className="flex items-center">Dentist</div>
              <div className="flex items-center">Amount</div>
              <div className="flex items-center">Status</div>
              <div className="flex items-center justify-end pr-4">Action</div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredExpenses.map((expense) => (
              <div key={expense.expence_id} className="px-6 py-4 hover:bg-gray-50">
                <div className="grid grid-cols-[80px_minmax(120px,1fr)_minmax(140px,1fr)_minmax(140px,1fr)_100px_120px_100px] gap-4 items-center">
                  <div className="text-sm text-gray-900">#{expense.expence_id}</div>
                  <div className="text-sm text-gray-900">{formatDate(expense.date)}</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{expense.title}</div>
                    {expense.description && (
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {expense.description}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Dr. {expense.dentists?.name}</div>
                  <div className="text-sm font-medium text-gray-900">Rs. {expense.amount.toFixed(2)}</div>
                  <div>
                    <Badge className={`${getStatusColor(expense.status)} flex items-center gap-1`}>
                      {getStatusIcon(expense.status)}
                      {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                    </Badge>
                  </div>
                  {/* Desktop Table View - Action Column Section */}
                  <div className="flex items-center justify-end gap-1 min-w-[120px]">

                    {/* Receipt Download Button - Shows when receipt exists, invisible placeholder when not */}
                    {expense.receipt_url ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-8 w-8 hover:text-blue-600"
                        title="Download Receipt"
                        onClick={() => window.open(`${expense.receipt_url}`, '_blank')}
                      >
                        <Download size={16} />
                      </Button>
                    ) : (
                      <div className="p-1 h-8 w-8"></div>
                    )}
                    {expense.status != "approved" && <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditExpense(expense)}
                      className="p-1 h-8 w-8"
                      title="Edit Expense"
                    >
                      <Edit size={16} className="text-blue-600" />
                    </Button>}
                    
                    {/* Accept Button - Shows for pending, invisible placeholder for others */}
                    {expense.status === 'pending' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => acceptExpense(expense.expence_id)}
                        className="p-1 h-8 w-8 hover:text-green-600"
                        title="Accept Expense"
                      >
                        <Check size={16} />
                      </Button>
                    ) : (
                      <div className="p-1 h-8 w-8"></div>
                    )}


                  </div>
                </div>
              </div>
            ))}
            {filteredExpenses.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">
                No expenses found matching your search criteria.
              </div>
            )}
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredExpenses.map((expense) => (
            <div key={expense.expence_id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{expense.title}</h3>
                  <p className="text-sm text-gray-500">#{expense.expence_id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${getStatusColor(expense.status)} flex items-center gap-1`}>
                    {getStatusIcon(expense.status)}
                    {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {expense.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => acceptExpense(expense.expence_id)}
                        className="p-2 h-8 w-8 hover:text-green-600"
                        title="Accept Expense"
                      >
                        <Check size={16} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditExpense(expense)}
                      className="p-2 h-8 w-8"
                      title="Edit Expense"
                    >
                      <Edit size={16} className='text-blue-600' />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={16} />
                  <span>{formatDate(expense.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User size={16} />
                  <span>{expense.dentists?.name}</span>
                </div>
                {expense.description && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <FileText size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{expense.description}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                    <DollarSign size={16} />
                    <span>Rs. {expense.amount.toFixed(2)}</span>
                  </div>
                  {expense.receipt_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs flex items-center gap-1 h-8"
                    >
                      <Download size={14} />
                      Receipt
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredExpenses.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No expenses found matching your search criteria.
            </div>
          )}
        </div>

        {/* Expense Form Dialog */}
        <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dentist_id" className="text-sm font-medium">Dentist *</Label>
                  <Select
                    value={formData.dentist_id}
                    onValueChange={(value) => handleInputChange('dentist_id', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select dentist" />
                    </SelectTrigger>
                    <SelectContent>
                      {dentists.map((dentist) => (
                        <SelectItem key={dentist.dentist_id} value={dentist.dentist_id}>
                          {dentist?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                {/*<div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>*/}
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt" className="text-sm font-medium">Receipt Upload</Label>
                <Input
                  id="receipt"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, JPG, PNG
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingExpense(false);
                    resetForm();
                    setEditingExpense(null);
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
                >
                  {isSubmitting ? 'Saving...' : editingExpense ? 'Update Expense' : 'Add Expense'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}