'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Download, Eye, Search, DollarSign, FileText, Users, Calendar } from 'lucide-react';

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
        dentist_id: null,
        payment_type: "cash",
        tax_rate: 0,
        lab_cost: 0,
        discount: 0,
        date: "2025-07-07T00:00:00.000Z",
        total_amount: 400,
        note: "1423534",
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
        dentists: null,
        services: []
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
    return new Date(dateString).toLocaleDateString();
  };

  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
  const pendingInvoices = invoices.filter(invoice => invoice.payment_type === 'pending').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoice & Billing Management</h1>
            <p className="text-gray-600 mt-1">
              {userRole === 'admin' && 'Full access to all invoicing features'}
              {userRole === 'dentist' && 'Create and manage invoices for your patients'}
              {userRole === 'receptionist' && 'Create invoices and manage payments'}
            </p>
          </div>
          {canCreate && (
            <Dialog open={isCreatingInvoice} onOpenChange={setIsCreatingInvoice}>
              <DialogTrigger asChild>
                <Button className="w-full lg:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Invoice</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="patient_id">Patient *</Label>
                      <Select onValueChange={(value) => setFormData(prev => ({ ...prev, patient_id: value }))}>
                        <SelectTrigger>
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
                    <div>
                      <Label htmlFor="dentist_id">Dentist</Label>
                      <Select onValueChange={(value) => setFormData(prev => ({ ...prev, dentist_id: value }))}>
                        <SelectTrigger>
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

                  <div>
                    <Label>Services *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border rounded p-2">
                      {availableServices.map((service) => (
                        <div key={service.service_id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`service-${service.service_id}`}
                            checked={formData.services.includes(service.service_id)}
                            onChange={() => handleServiceToggle(service.service_id)}
                            className="rounded"
                          />
                          <label htmlFor={`service-${service.service_id}`} className="text-sm">
                            {service.service_name} (${service.amount})
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lab_cost">Lab Cost</Label>
                      <Input
                        id="lab_cost"
                        type="number"
                        step="0.01"
                        value={formData.lab_cost}
                        onChange={(e) => setFormData(prev => ({ ...prev, lab_cost: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    {canApplyDiscounts && (
                      <div>
                        <Label htmlFor="discount">Discount</Label>
                        <Input
                          id="discount"
                          type="number"
                          step="0.01"
                          value={formData.discount}
                          onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                      <Input
                        id="tax_rate"
                        type="number"
                        step="0.01"
                        value={formData.tax_rate}
                        onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment_type">Payment Type</Label>
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
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="note">Notes</Label>
                    <Textarea
                      id="note"
                      value={formData.note}
                      onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Invoice Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${calculateSubtotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lab Cost:</span>
                        <span>${formData.lab_cost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>-${formData.discount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax ({formData.tax_rate}%):</span>
                        <span>${(((calculateSubtotal() + formData.lab_cost - formData.discount) * formData.tax_rate) / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-1">
                        <span>Total Amount:</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreatingInvoice(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Invoice</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                  <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Patients</p>
                  <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{invoices.filter(i => new Date(i.date).getMonth() === new Date().getMonth()).length}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Invoices</CardTitle>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Invoice ID</th>
                    <th className="text-left p-2 font-medium">Patient</th>
                    <th className="text-left p-2 font-medium">Dentist</th>
                    <th className="text-left p-2 font-medium">Amount</th>
                    <th className="text-left p-2 font-medium">Payment</th>
                    <th className="text-left p-2 font-medium">Date</th>
                    <th className="text-left p-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.invoice_id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">#{invoice.invoice_id}</td>
                      <td className="p-2">{invoice.patients.name}</td>
                      <td className="p-2">{invoice.dentists?.name || 'N/A'}</td>
                      <td className="p-2">${invoice.total_amount.toFixed(2)}</td>
                      <td className="p-2">
                        <Badge className={getStatusColor(invoice.payment_type)}>
                          {invoice.payment_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-2">{formatDate(invoice.date)}</td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canEdit && (
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceManagementPage;