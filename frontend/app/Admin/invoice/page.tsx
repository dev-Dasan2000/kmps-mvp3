'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Plus, Edit, Trash2, Download, Eye, Search, DollarSign, FileText, Users, Calendar as CalendarIcon, Phone, Mail, MapPin, X } from 'lucide-react';

// Types based on your database schema
interface Patient {
  patient_id: string;
  hospital_patient_id: string | null;
  password: string;
  name: string;
  profile_picture: string;
  email: string;
  phone_number: string;
  address: string;
  nic: string;
  blood_group: string;
  date_of_birth: string;
  gender: string;
}

interface Dentist {
  dentist_id: string;
  name: string;
  email: string;
  phone_number: string;
  specialization: string;
}

interface InvoiceService {
  service_id: number;
  service_name: string;
  amount: number;
}

interface Invoice {
  invoice_id: number;
  patient_id: string;
  dentist_id: string | null;
  payment_type: string;
  tax_rate: number;
  lab_cost: number;
  discount: number;
  date: string;
  total_amount: number;
  note: string;
  patients: Patient;
  dentists: Dentist | null;
  services: InvoiceService[];
}

interface InvoiceFormData {
  patient_id: string;
  dentist_id: string | null;
  payment_type: string;
  tax_rate: number;
  lab_cost: number;
  discount: number;
  date: string;
  note: string;
  services: number[];
}

interface InvoiceManagementProps {
  userRole: 'admin' | 'dentist' | 'receptionist';
}

const InvoiceManagementPage: React.FC<InvoiceManagementProps> = ({ userRole = 'admin' }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [availableServices, setAvailableServices] = useState<InvoiceService[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewInvoiceDialogOpen, setViewInvoiceDialogOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [formData, setFormData] = useState<InvoiceFormData>({
    patient_id: '',
    dentist_id: null,
    payment_type: '',
    tax_rate: 0,
    lab_cost: 0,
    discount: 0,
    date: new Date().toISOString().split('T')[0],
    note: '',
    services: []
  });

  const paymentTypes = ['cash', 'card', 'online', 'bank_transfer'];

  // Mock data - Replace with actual API calls
  useEffect(() => {
    const mockInvoices: Invoice[] = [
      {
        invoice_id: 1,
        patient_id: "P001",
        dentist_id: "D001",
        payment_type: "cash",
        tax_rate: 5,
        lab_cost: 50,
        discount: 25,
        date: "2025-07-07T00:00:00.000Z",
        total_amount: 400,
        note: "Regular checkup and cleaning",
        patients: {
          patient_id: "P001",
          hospital_patient_id: null,
          password: "$2b$10$vZJggBTq4M4HFUnrPZV19efH2DSDGtYqtR31/IZ/Yjigu7Ytc8MyW",
          name: "D Gayashan",
          profile_picture: "/uploads/photos/1750699828497-mazda-removebg-preview.png",
          email: "ashborn541@gmail.com",
          phone_number: "077123456878",
          address: "No.710",
          nic: "20000331002",
          blood_group: "o+",
          date_of_birth: "2001-01-16",
          gender: "Male"
        },
        dentists: {
          dentist_id: "D001",
          name: "Dr. Sarah Johnson",
          email: "sarah.johnson@clinic.com",
          phone_number: "077123456789",
          specialization: "General Dentistry"
        },
        services: [
          { service_id: 1, service_name: 'General Consultation', amount: 150 },
          { service_id: 2, service_name: 'Dental Cleaning', amount: 120 },
          { service_id: 7, service_name: 'Dental X-Ray', amount: 75 }
        ]
      }
    ];

    const mockServices: InvoiceService[] = [
      { service_id: 1, service_name: 'General Consultation', amount: 150 },
      { service_id: 2, service_name: 'Dental Cleaning', amount: 120 },
      { service_id: 3, service_name: 'Tooth Extraction', amount: 200 },
      { service_id: 4, service_name: 'Dental Filling', amount: 180 },
      { service_id: 5, service_name: 'Root Canal Treatment', amount: 800 },
      { service_id: 6, service_name: 'Dental Crown', amount: 600 },
      { service_id: 7, service_name: 'Dental X-Ray', amount: 75 },
      { service_id: 8, service_name: 'Teeth Whitening', amount: 300 }
    ];

    const mockPatients: Patient[] = [
      {
        patient_id: "P001",
        hospital_patient_id: null,
        password: "$2b$10$vZJggBTq4M4HFUnrPZV19efH2DSDGtYqtR31/IZ/Yjigu7Ytc8MyW",
        name: "D Gayashan",
        profile_picture: "/uploads/photos/1750699828497-mazda-removebg-preview.png",
        email: "ashborn541@gmail.com",
        phone_number: "077123456878",
        address: "No.710",
        nic: "20000331002",
        blood_group: "o+",
        date_of_birth: "2001-01-16",
        gender: "Male"
      }
    ];

    const mockDentists: Dentist[] = [
      {
        dentist_id: "D001",
        name: "Dr. Sarah Johnson",
        email: "sarah.johnson@clinic.com",
        phone_number: "077123456789",
        specialization: "General Dentistry"
      },
      {
        dentist_id: "D002",
        name: "Dr. Michael Chen",
        email: "michael.chen@clinic.com",
        phone_number: "077123456790",
        specialization: "Orthodontics"
      }
    ];

    setInvoices(mockInvoices);
    setAvailableServices(mockServices);
    setPatients(mockPatients);
    setDentists(mockDentists);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Set the date in the form data when the date state changes
    if (date) {
      setFormData(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
    }
  }, [date]);

  const getStatusColor = (paymentType: string) => {
    switch (paymentType) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'card': return 'bg-blue-100 text-blue-800';
      case 'online': return 'bg-purple-100 text-purple-800';
      case 'bank_transfer': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateSubtotal = () => {
    return formData.services.reduce((total, serviceId) => {
      const service = availableServices.find(s => s.service_id === serviceId);
      return total + (service?.amount || 0);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const afterDiscount = subtotal - formData.discount + formData.lab_cost;
    const tax = afterDiscount * formData.tax_rate / 100;
    return afterDiscount + tax;
  };

  const handleServiceToggle = (serviceId: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(id => id !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newInvoice: Invoice = {
      invoice_id: invoices.length + 1,
      patient_id: formData.patient_id,
      dentist_id: formData.dentist_id,
      payment_type: formData.payment_type,
      tax_rate: formData.tax_rate,
      lab_cost: formData.lab_cost,
      discount: formData.discount,
      date: formData.date,
      total_amount: calculateTotal(),
      note: formData.note,
      patients: patients.find(p => p.patient_id === formData.patient_id)!,
      dentists: formData.dentist_id ? dentists.find(d => d.dentist_id === formData.dentist_id) || null : null,
      services: availableServices.filter(s => formData.services.includes(s.service_id))
    };

    // Here you would make API call to create invoice
    setInvoices([...invoices, newInvoice]);
    setIsCreatingInvoice(false);
    
    // Reset form
    setFormData({
      patient_id: '',
      dentist_id: null,
      payment_type: '',
      tax_rate: 0,
      lab_cost: 0,
      discount: 0,
      date: new Date().toISOString().split('T')[0],
      note: '',
      services: []
    });
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewInvoiceDialogOpen(true);
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.patients.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoice_id.toString().includes(searchTerm.toLowerCase()) ||
    (invoice.dentists?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Role-based permissions
  const canCreate = true;
  const canEdit = userRole === 'admin' || userRole === 'dentist';
  const canDelete = userRole === 'admin';
  const canApplyDiscounts = userRole === 'admin' || userRole === 'receptionist';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
  const pendingInvoices = invoices.filter(invoice => invoice.payment_type === 'pending').length;

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
            <h1 className="text-2xl sm:text-3xl mt-7 md:mt-0 font-bold text-gray-900">Invoice & Billing Management</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {userRole === 'admin' && 'Full access to all invoicing features'}
              {userRole === 'dentist' && 'Create and manage invoices for your patients'}
              {userRole === 'receptionist' && 'Create invoices and manage payments'}
            </p>
          </div>
          {canCreate && (
            <Button
              onClick={() => setIsCreatingInvoice(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Plus size={20} />
                  Create Invoice
                </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search invoices by patient, ID, dentist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-transparent"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-200">
            <div className="grid grid-cols-[80px_minmax(120px,1fr)_minmax(140px,1fr)_100px_120px_100px_100px] gap-4 text-sm font-medium text-gray-700">
              <div className="flex items-center">ID</div>
              <div className="flex items-center">Patient</div>
              <div className="flex items-center">Dentist</div>
              <div className="flex items-center">Amount</div>
              <div className="flex items-center">Payment</div>
              <div className="flex items-center">Date</div>
              <div className="flex items-center justify-end pr-4">Action</div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.invoice_id} className="px-6 py-4 hover:bg-gray-50">
                <div className="grid grid-cols-[80px_minmax(120px,1fr)_minmax(140px,1fr)_100px_120px_100px_100px] gap-4 items-center">
                  <div className="text-sm text-gray-900">#{invoice.invoice_id}</div>
                  <div className="text-sm font-medium text-gray-900">{invoice.patients.name}</div>
                  <div className="text-sm text-gray-600">{invoice.dentists?.name || 'N/A'}</div>
                  <div className="text-sm font-medium text-gray-900">${invoice.total_amount.toFixed(2)}</div>
                  <div>
                    <Badge className={`${getStatusColor(invoice.payment_type)} flex items-center gap-1`}>
                      {invoice.payment_type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-900">{formatDate(invoice.date)}</div>
                  <div className="flex items-center justify-end gap-1 min-w-[120px]">
                    <Button
                      variant="ghost"
                      className="p-1 h-8 w-8"
                      title="View Invoice"
                      onClick={() => handleViewInvoice(invoice)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-8 w-8"
                        title="Edit Invoice"
                      >
                        <Edit size={16} />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-8 w-8 hover:text-red-600"
                        title="Delete Invoice"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-8 w-8"
                      title="Download Invoice"
                    >
                      <Download size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filteredInvoices.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">
                No invoices found matching your search criteria.
              </div>
            )}
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredInvoices.map((invoice) => (
            <div key={invoice.invoice_id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">#{invoice.invoice_id}</h3>
                  <p className="text-sm text-gray-500">{invoice.patients.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${getStatusColor(invoice.payment_type)} flex items-center gap-1`}>
                    {invoice.payment_type.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 h-8 w-8"
                      title="View Invoice"
                      onClick={() => handleViewInvoice(invoice)}
                    >
                      <Eye size={16} />
                    </Button>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 h-8 w-8"
                        title="Edit Invoice"
                      >
                        <Edit size={16} />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 h-8 w-8 hover:text-red-600"
                        title="Delete Invoice"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarIcon size={16} />
                  <span>{formatDate(invoice.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={16} />
                  <span>{invoice.dentists?.name || 'No Dentist Assigned'}</span>
                </div>
                {invoice.note && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <FileText size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{invoice.note}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                    <DollarSign size={16} />
                    <span>${invoice.total_amount.toFixed(2)}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs flex items-center gap-1 h-8"
                  >
                    <Download size={14} />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {filteredInvoices.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No invoices found matching your search criteria.
            </div>
          )}
        </div>

        {/* Invoice Form Dialog */}
        <Dialog open={isCreatingInvoice} onOpenChange={setIsCreatingInvoice}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-emerald-700">Create New Invoice</DialogTitle>
                </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              {/* Client Information Section */}
              <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Users size={18} className="text-emerald-600" />
                    Client Information
                  </h4>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="patient_id" className="font-medium">Patient *</Label>
                      <Select onValueChange={(value) => setFormData(prev => ({ ...prev, patient_id: value }))}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((patient) => (
                            <SelectItem key={patient.patient_id} value={patient.patient_id}>
                              {patient.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dentist_id" className="font-medium">Dentist</Label>
                      <Select onValueChange={(value) => setFormData(prev => ({ ...prev, dentist_id: value }))}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select dentist (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {dentists.map((dentist) => (
                            <SelectItem key={dentist.dentist_id} value={dentist.dentist_id}>
                              {dentist.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                    </div>
                  </div>

              {/* Services Section */}
              <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <FileText size={18} className="text-emerald-600" />
                    Services *
                  </h4>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4">
                      {availableServices.map((service) => (
                      <div key={service.service_id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md">
                          <input
                            type="checkbox"
                            id={`service-${service.service_id}`}
                            checked={formData.services.includes(service.service_id)}
                            onChange={() => handleServiceToggle(service.service_id)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                          />
                        <label htmlFor={`service-${service.service_id}`} className="text-sm flex-1 cursor-pointer">
                          <div className="font-medium">{service.service_name}</div>
                          <div className="text-emerald-600 text-xs">${service.amount.toFixed(2)}</div>
                          </label>
                        </div>
                      ))}
                    {availableServices.length === 0 && (
                      <div className="col-span-2 text-center py-4 text-gray-500">
                        No services available
                      </div>
                    )}
                  </div>
                    </div>
                  </div>

              {/* Financial Details Section */}
              <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <DollarSign size={18} className="text-emerald-600" />
                    Financial Details
                  </h4>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="lab_cost" className="font-medium">Lab Cost</Label>
                      <div className="relative">
                        <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                      <Input
                        id="lab_cost"
                        type="number"
                        step="0.01"
                        value={formData.lab_cost}
                        onChange={(e) => setFormData(prev => ({ ...prev, lab_cost: parseFloat(e.target.value) || 0 }))}
                          className="pl-8"
                      />
                      </div>
                    </div>
                    {canApplyDiscounts && (
                      <div className="space-y-2">
                        <Label htmlFor="discount" className="font-medium">Discount</Label>
                        <div className="relative">
                          <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                        <Input
                          id="discount"
                          type="number"
                          step="0.01"
                          value={formData.discount}
                          onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                            className="pl-8"
                        />
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="tax_rate" className="font-medium">Tax Rate (%)</Label>
                      <Input
                        id="tax_rate"
                        type="number"
                        step="0.01"
                        value={formData.tax_rate}
                        onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-60 ">
                    <div className="space-y-2">
                      <Label htmlFor="payment_type" className="font-medium">Payment Type</Label>
                      <Select onValueChange={(value) => setFormData(prev => ({ ...prev, payment_type: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment type" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.replace('_', ' ').toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 mt-1">
                      <Label htmlFor="date" className="font-medium">Date</Label>
                      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className=" mt-2.5 justify-start text-left font-normal"
                            onClick={() => setCalendarOpen(true)}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, 'PPP') : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-[280px] p-0" 
                          align="start"
                          side="bottom"
                          sideOffset={4}
                        >
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(newDate) => {
                              setDate(newDate);
                              setFormData(prev => ({
                                ...prev,
                                date: newDate ? newDate.toISOString().split('T')[0] : prev.date
                              }));
                              setCalendarOpen(false);
                            }}
                            initialFocus
                            className="rounded-md border"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    </div>
                  </div>
                    </div>
                  </div>

              {/* Notes Section */}
              <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <FileText size={18} className="text-emerald-600" />
                    Notes
                  </h4>
                </div>
                <div className="p-5">
                    <Textarea
                      id="note"
                      value={formData.note}
                      onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                      rows={3}
                    placeholder="Add any additional notes or comments here..."
                    className="resize-none"
                  />
                </div>
              </div>

              {/* Invoice Summary */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-5">
                <h4 className="font-semibold mb-3 text-gray-900">Invoice Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lab Cost:</span>
                    <span className="font-medium">${formData.lab_cost.toFixed(2)}</span>
                  </div>
                      <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium text-red-600">-${formData.discount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                    <span className="text-gray-600">Tax ({formData.tax_rate}%):</span>
                    <span className="font-medium">${(((calculateSubtotal() + formData.lab_cost - formData.discount) * formData.tax_rate) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-emerald-200 mt-2">
                    <span className="font-semibold text-lg">Total Amount:</span>
                    <span className="font-bold text-lg text-emerald-600">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreatingInvoice(false)}
                  className="w-full sm:w-auto px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto px-6"
                >
                  {isLoading ? 'Creating...' : 'Create Invoice'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Invoice Detail View Dialog */}
        <Dialog open={viewInvoiceDialogOpen} onOpenChange={setViewInvoiceDialogOpen}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl sm:text-2xl font-bold text-emerald-700">
                  Invoice #{selectedInvoice?.invoice_id}
                </DialogTitle>
               
              </div>
            </DialogHeader>
            
            {selectedInvoice && (
              <div className="space-y-8 py-4">
                {/* Invoice Header */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">Invoice Details</h3>
                      <p className="text-sm text-gray-600">Date: {formatDate(selectedInvoice.date)}</p>
                    </div>
                    <div>
                      <Badge className={`${getStatusColor(selectedInvoice.payment_type)} text-sm px-4 py-1.5`}>
                        {selectedInvoice.payment_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Patient & Dentist Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Patient Info */}
                  <div className="bg-white border rounded-lg p-5 shadow-sm">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-4">
                      <Users size={18} className="text-emerald-600" />
                      Patient Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{selectedInvoice.patients.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={15} className="text-gray-500" />
                        <span className="text-sm">{selectedInvoice.patients.phone_number}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={15} className="text-gray-500" />
                        <span className="text-sm">{selectedInvoice.patients.email}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin size={15} className="text-gray-500 mt-0.5" />
                        <span className="text-sm">{selectedInvoice.patients.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dentist Info */}
                  <div className="bg-white border rounded-lg p-5 shadow-sm">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-4">
                      <Users size={18} className="text-emerald-600" />
                      Dentist Information
                    </h4>
                    {selectedInvoice.dentists ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{selectedInvoice.dentists.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={15} className="text-gray-500" />
                          <span className="text-sm">{selectedInvoice.dentists.phone_number}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={15} className="text-gray-500 flex-shrink-0 block" />
                          <span className="text-sm">{selectedInvoice.dentists.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText size={15} className="text-gray-500" />
                          <span className="text-sm">{selectedInvoice.dentists.specialization}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No dentist assigned</p>
                    )}
                  </div>
        </div>

                {/* Services */}
                <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <FileText size={18} className="text-emerald-600" />
                      Services
                    </h4>
            </div>
            <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Service
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                  </tr>
                </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedInvoice.services.map((service) => (
                          <tr key={service.service_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{service.service_name}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">${service.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                        {selectedInvoice.services.length === 0 && (
                          <tr>
                            <td colSpan={2} className="px-6 py-4 text-sm text-gray-500 text-center">No services found</td>
                          </tr>
                        )}
                </tbody>
              </table>
            </div>
                </div>

                {/* Invoice Summary */}
                <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <DollarSign size={18} className="text-emerald-600" />
                      Invoice Summary
                    </h4>
                  </div>
                  <div className="p-5">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">
                          ${selectedInvoice.services.reduce((sum, service) => sum + service.amount, 0).toFixed(2)}
                        </span>
                      </div>
                      {selectedInvoice.lab_cost > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Lab Cost:</span>
                          <span className="font-medium">${selectedInvoice.lab_cost.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedInvoice.discount > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Discount:</span>
                          <span className="font-medium text-red-600">-${selectedInvoice.discount.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedInvoice.tax_rate > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Tax ({selectedInvoice.tax_rate}%):</span>
                          <span className="font-medium">
                            ${((selectedInvoice.total_amount * selectedInvoice.tax_rate) / (100 + selectedInvoice.tax_rate)).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-3 border-t border-gray-200 mt-3">
                        <span className="font-semibold text-lg">Total Amount:</span>
                        <span className="font-bold text-lg text-emerald-600">${selectedInvoice.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedInvoice.note && (
                  <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <FileText size={18} className="text-emerald-600" />
                        Notes
                      </h4>
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-gray-600">{selectedInvoice.note}</p>
                    </div>
                  </div>
                )}

                <DialogFooter className="pt-2">
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:justify-end">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 px-5"
                      onClick={() => setViewInvoiceDialogOpen(false)}
                    >
                      Close
                    </Button>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2 px-5"
                    >
                      <Download size={16} />
                      Download Invoice
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default InvoiceManagementPage;