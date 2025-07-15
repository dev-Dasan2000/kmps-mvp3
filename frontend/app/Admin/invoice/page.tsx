'use client';

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { AuthContext } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

// Types based on your database schema
interface Patient {
  patient_id: string;
  phone_number: string;
  hospital_patient_id: string | null;
  password: string;
  name: string;
  profile_picture: string;
  email: string;
  address: string;
}

interface Dentist {
  dentist_id: string;
  name: string;
  phone_number: string;
  email: string;
  specialization: string
}

interface InvoiceService {
  service_id: number;
  service_name: string;
  amount: number;
  description?: string;
}

interface InvoiceServiceAssign {
  invoice_id: number;
  service_id: number;
  services: InvoiceService; // This property name needs to match what the backend returns
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
  services: InvoiceServiceAssign[];
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
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const router = useRouter();

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

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const {isLoadingAuth, isLoggedIn, user} = useContext(AuthContext);

  const paymentTypes = ['cash', 'card', 'online', 'bank_transfer'];

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all invoices with patient and dentist details
        const invoicesRes = await axios.get(`${backendUrl}/invoices`);
        const invoicesData = invoicesRes.data;

        // Fetch all services
        const servicesRes = await axios.get(`${backendUrl}/invoice-services`);
        const servicesData = servicesRes.data;

        // Fetch all patients
        const patientsRes = await axios.get(`${backendUrl}/patients`);
        const patientsData = patientsRes.data;

        // Fetch all dentists
        const dentistsRes = await axios.get(`${backendUrl}/dentists`);
        const dentistsData = dentistsRes.data;

        setInvoices(invoicesData);
        setAvailableServices(servicesData);
        setPatients(patientsData);
        setDentists(dentistsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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
    const selectedServices = availableServices.filter(service => formData.services.includes(service.service_id));
    return selectedServices.reduce((total, service) => total + service.amount, 0);
  };

  // Helper function to safely get service data from the nested structure
  const getServiceData = (serviceAssign: InvoiceServiceAssign): InvoiceService | null => {
    if (!serviceAssign) return null;
    return serviceAssign.services || null;
  };

  // Helper function to calculate subtotal for an invoice
  const calculateInvoiceSubtotal = (invoice: Invoice): number => {
    if (!invoice || !invoice.services || invoice.services.length === 0) {
      return 0;
    }

    return invoice.services.reduce((sum, serviceAssign) => {
      const service = getServiceData(serviceAssign);
      return sum + (service && typeof service.amount === 'number' ? service.amount : 0);
    }, 0);
  };

  // Helper function to calculate tax amount for invoice view
  const calculateTaxAmount = (invoice: Invoice): string => {
    if (!invoice || typeof invoice.total_amount !== 'number' || typeof invoice.tax_rate !== 'number') {
      return '0.00';
    }

    // Calculate tax either from total or from subtotal based on available data
    if (invoice.total_amount) {
      // Back-calculate the tax from total amount
      const taxAmount = (invoice.total_amount * invoice.tax_rate) / (100 + invoice.tax_rate);
      return taxAmount.toFixed(2);
    } else {
      // Calculate from services if available
      const subtotal = calculateInvoiceSubtotal(invoice);
      return ((subtotal - invoice.discount + invoice.lab_cost) * invoice.tax_rate / 100).toFixed(2);
    }
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
    setIsLoading(true);

    try {
      // First create the invoice
      const invoiceData = {
        patient_id: formData.patient_id,
        dentist_id: formData.dentist_id,
        payment_type: formData.payment_type,
        tax_rate: formData.tax_rate,
        lab_cost: formData.lab_cost,
        discount: formData.discount,
        date: formData.date,
        total_amount: calculateTotal(),
        note: formData.note
      };

      const invoiceResponse = await axios.post(`${backendUrl}/invoices`, invoiceData);
      const newInvoice = invoiceResponse.data;

      // Then assign services to the invoice
      const serviceAssignPromises = formData.services.map(serviceId => {
        return axios.post(`${backendUrl}/invoice-service-assign`, {
          invoice_id: newInvoice.invoice_id,
          service_id: serviceId
        });
      });

      await Promise.all(serviceAssignPromises);

      // Refresh invoices data to include the new invoice
      const invoicesRes = await axios.get(`${backendUrl}/invoices`);
      setInvoices(invoicesRes.data);

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
    } catch (error) {
      console.error('Error creating invoice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    try {
      setIsLoading(true);

      // Fetch the services directly from the invoice-service-assign endpoint
      const response = await axios.get(`${backendUrl}/invoice-service-assign/${invoice.invoice_id}`);

      // Create a copy of the invoice with updated services
      const invoiceWithServices = {
        ...invoice,
        // Map the response to match our expected structure
        services: response.data.map(item => ({
          ...item,
          services: item.service // Map the service property to services to match our interface
        }))
      };

      console.log('Fetched invoice services:', response.data);
      console.log('Updated invoice with services:', invoiceWithServices);

      setSelectedInvoice(invoiceWithServices);
      setViewInvoiceDialogOpen(true);
    } catch (error) {
      console.error('Error fetching invoice services:', error);
      // Still show the invoice even if there's an error fetching services
      setSelectedInvoice(invoice);
      setViewInvoiceDialogOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditInvoice = async (invoice: Invoice) => {
    try {
      setIsLoading(true);

      // Fetch the services directly from the invoice-service-assign endpoint
      const response = await axios.get(`${backendUrl}/invoice-service-assign/${invoice.invoice_id}`);
      console.log('Fetched service assignments for edit:', response.data);

      // Extract service IDs from the response
      const services = response.data.map(item => item.service_id);
      console.log('Extracted service IDs for edit:', services);

      // Create a copy of the invoice with updated services
      const invoiceWithServices = {
        ...invoice,
        services: response.data.map(item => ({
          ...item,
          services: item.service // Map the service property to services to match our interface
        }))
      };

      setFormData({
        patient_id: invoice.patient_id,
        dentist_id: invoice.dentist_id,
        payment_type: invoice.payment_type,
        tax_rate: invoice.tax_rate,
        lab_cost: invoice.lab_cost,
        discount: invoice.discount,
        date: invoice.date.toString().split('T')[0],
        note: invoice.note || '',
        services
      });

      setSelectedInvoice(invoiceWithServices);
      setIsEditingInvoice(true);
    } catch (error) {
      console.error('Error fetching invoice services for edit:', error);
      // Still show the edit form even if there's an error fetching services
      const services = invoice.services?.map(serviceAssign => serviceAssign.service_id) || [];

      setFormData({
        patient_id: invoice.patient_id,
        dentist_id: invoice.dentist_id,
        payment_type: invoice.payment_type,
        tax_rate: invoice.tax_rate,
        lab_cost: invoice.lab_cost,
        discount: invoice.discount,
        date: invoice.date.toString().split('T')[0],
        note: invoice.note || '',
        services
      });

      setSelectedInvoice(invoice);
      setIsEditingInvoice(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setIsLoading(true);

    try {
      // Update the invoice
      const invoiceData = {
        patient_id: formData.patient_id,
        dentist_id: formData.dentist_id,
        payment_type: formData.payment_type,
        tax_rate: formData.tax_rate,
        lab_cost: formData.lab_cost,
        discount: formData.discount,
        date: formData.date,
        total_amount: calculateTotal(),
        note: formData.note
      };

      await axios.put(`${backendUrl}/invoices/${selectedInvoice.invoice_id}`, invoiceData);

      // First delete all existing service assignments
      // We need to manually keep track of existing services since they might be removed
      for (const existingService of selectedInvoice.services) {
        await axios.delete(`${backendUrl}/invoice-service-assign`, {
          data: {
            invoice_id: selectedInvoice.invoice_id,
            service_id: existingService.service_id
          }
        });
      }

      // Then re-assign services to the invoice
      const serviceAssignPromises = formData.services.map(serviceId => {
        return axios.post(`${backendUrl}/invoice-service-assign`, {
          invoice_id: selectedInvoice.invoice_id,
          service_id: serviceId
        });
      });

      await Promise.all(serviceAssignPromises);

      // Refresh invoices data to include the updated invoice
      const invoicesRes = await axios.get(`${backendUrl}/invoices`);
      setInvoices(invoicesRes.data);

      setIsEditingInvoice(false);

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

      setSelectedInvoice(null);
    } catch (error) {
      console.error('Error updating invoice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      setIsLoading(true);

      try {
        await axios.delete(`${backendUrl}/invoices/${invoiceId}`);

        // Remove the deleted invoice from the state
        setInvoices(invoices.filter(invoice => invoice.invoice_id !== invoiceId));
      } catch (error) {
        console.error('Error deleting invoice:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.patients.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoice_id.toString().includes(searchTerm.toLowerCase()) ||
    (invoice.dentists?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = async (invoice_id: number) => {
    try {
      // First, get the invoice
      const invoice = invoices.find((inv) => inv.invoice_id === invoice_id);
      if (!invoice) return;
      
      // Fetch the services directly from the API to ensure we have the latest data
      const response = await axios.get(`${backendUrl}/invoice-service-assign/${invoice_id}`);
      
      const servicesWithDetails = response.data.map(item => ({
        ...item,
        // Access the service property which contains the service details
        service: item.service
      }));
      
      const doc = new jsPDF();

      // Header
      doc.setFontSize(18);
      doc.text('Invoice', 14, 20);

      doc.setFontSize(12);
      doc.text(`Invoice ID: ${invoice.invoice_id}`, 14, 30);
      doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 14, 36);
      doc.text(`Patient: ${invoice.patients.name}`, 14, 42);
      doc.text(`Dentist: ${invoice.dentists?.name || 'N/A'}`, 14, 48);
      doc.text(`Payment Type: ${invoice.payment_type}`, 14, 54);
      doc.text(`Tax Rate: ${invoice.tax_rate}%`, 14, 60);
      doc.text(`Lab Cost: Rs. ${invoice.lab_cost.toFixed(2)}`, 14, 66);
      doc.text(`Discount: Rs. ${invoice.discount.toFixed(2)}`, 14, 72);
      doc.text(`Note: ${invoice.note || '-'}`, 14, 78);

      // Services Table
      const serviceRows = servicesWithDetails.map((item, i) => {
        // Access the service details through the service property
        const service = item.service;
        const serviceName = service?.service_name || 'Unknown Service';
        const description = service?.description || '-';
        let amount = 'Rs. 0.00';
        
        // Safely handle amount if it exists and is a number
        if (service?.amount !== undefined && service?.amount !== null) {
          amount = `Rs. ${service.amount.toFixed(2)}`;
        }
        
        return [i + 1, serviceName, description, amount];
      });

      autoTable(doc, {
        head: [['#', 'Service', 'Description', 'Amount']],
        body: serviceRows,
        startY: 90,
      });

      // Total Section
      const finalY = (doc as any).lastAutoTable.finalY || 100;
      doc.setFontSize(12);
      doc.text(`Total Amount: Rs. ${invoice.total_amount.toFixed(2)}`, 14, finalY + 10);

      // Save the PDF
      doc.save(`Invoice_${invoice.invoice_id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

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
                  <div className="text-sm font-medium text-gray-900">Rs. {invoice.total_amount.toFixed(2)}</div>
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
                        onClick={() => handleEditInvoice(invoice)}
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
                        onClick={() => handleDeleteInvoice(invoice.invoice_id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-8 w-8"
                      title="Download Invoice"
                      onClick={() => { handleDownload(invoice.invoice_id) }}
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
                        onClick={() => handleEditInvoice(invoice)}
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
                        onClick={() => handleDeleteInvoice(invoice.invoice_id)}
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
                    <span>Rs. {invoice.total_amount.toFixed(2)}</span>
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
                          <div className="text-emerald-600 text-xs">Rs. {service.amount.toFixed(2)}</div>
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
                    <span className="font-medium">Rs. {calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lab Cost:</span>
                    <span className="font-medium">Rs. {formData.lab_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium text-red-600">-Rs. {formData.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax ({formData.tax_rate}%):</span>
                    <span className="font-medium">Rs. {(((calculateSubtotal() + formData.lab_cost - formData.discount) * formData.tax_rate) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-emerald-200 mt-2">
                    <span className="font-semibold text-lg">Total Amount:</span>
                    <span className="font-bold text-lg text-emerald-600">Rs. {calculateTotal().toFixed(2)}</span>
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

        {/* Edit Invoice Dialog */}
        <Dialog open={isEditingInvoice} onOpenChange={setIsEditingInvoice}>
          <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-emerald-700">Edit Invoice #{selectedInvoice?.invoice_id}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpdateInvoice} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="patient_id" className="font-medium">Patient</Label>
                    <Select
                      value={formData.patient_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, patient_id: value }))}
                      disabled={isLoading}
                    >
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

                  <div className="space-y-2">
                    <Label htmlFor="dentist_id" className="font-medium">Dentist</Label>
                    <Select
                      value={formData.dentist_id || 'none'}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, dentist_id: value === 'none' ? null : value }))}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select dentist" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {dentists.map((dentist) => (
                          <SelectItem key={dentist.dentist_id} value={dentist.dentist_id}>
                            {dentist.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_services" className="font-medium">Services</Label>
                    <div className="border rounded-md p-3 space-y-2 max-h-60 overflow-y-auto">
                      {availableServices.map((services) => (
                        <div key={services.service_id} className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`service-${services.service_id}`}
                              checked={formData.services.includes(services.service_id)}
                              onChange={() => handleServiceToggle(services.service_id)}
                              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                              disabled={isLoading}
                            />
                            <label htmlFor={`service-${services.service_id}`} className="text-sm">
                              {services.service_name}
                            </label>
                          </div>
                          <span className="text-sm font-medium">Rs. {services.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_note" className="font-medium">Note</Label>
                    <Textarea
                      id="edit_note"
                      value={formData.note}
                      onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                      rows={3}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="edit_lab_cost" className="font-medium">Lab Cost</Label>
                    <div className="relative">
                      <Input
                        id="edit_lab_cost"
                        type="number"
                        step="0.01"
                        value={formData.lab_cost}
                        onChange={(e) => setFormData(prev => ({ ...prev, lab_cost: parseFloat(e.target.value) || 0 }))}
                        className="pl-8"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_discount" className="font-medium">Discount</Label>
                    <div className="relative">
                      <Input
                        id="edit_discount"
                        type="number"
                        step="0.01"
                        value={formData.discount}
                        onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                        className="pl-8"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_tax_rate" className="font-medium">Tax Rate (%)</Label>
                    <Input
                      id="edit_tax_rate"
                      type="number"
                      step="0.01"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_payment_type" className="font-medium">Payment Type</Label>
                    <Select
                      value={formData.payment_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, payment_type: value }))}
                      disabled={isLoading}
                    >
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

                  <div className="space-y-2">
                    <Label htmlFor="edit_date" className="font-medium">Date</Label>
                    <Input
                      id="edit_date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Invoice Summary */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-5">
                <h4 className="font-semibold mb-3 text-gray-900">Invoice Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">Rs. {calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lab Cost:</span>
                    <span className="font-medium">Rs. {formData.lab_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium text-red-600">-Rs. {formData.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax ({formData.tax_rate}%):</span>
                    <span className="font-medium">Rs. {(((calculateSubtotal() + formData.lab_cost - formData.discount) * formData.tax_rate) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-emerald-200 mt-2">
                    <span className="font-semibold text-lg">Total Amount:</span>
                    <span className="font-bold text-lg text-emerald-600">Rs. {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditingInvoice(false);
                    setSelectedInvoice(null);
                  }}
                  className="w-full sm:w-auto px-6"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto px-6"
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update Invoice'}
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
                        {selectedInvoice.services && selectedInvoice.services.length > 0 ? (
                          selectedInvoice.services.map((serviceAssign, index) => {
                            const serviceData = getServiceData(serviceAssign);
                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {serviceData?.service_name || 'N/A'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                                  {serviceData?.amount ? `Rs. ${serviceData.amount.toFixed(2)}` : 'N/A'}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
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
                          Rs. {calculateInvoiceSubtotal(selectedInvoice).toFixed(2)}
                        </span>
                      </div>
                      {selectedInvoice.lab_cost > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Lab Cost:</span>
                          <span className="font-medium">Rs. {selectedInvoice.lab_cost.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedInvoice.discount > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Discount:</span>
                          <span className="font-medium text-red-600">-Rs. {selectedInvoice.discount.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedInvoice.tax_rate > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Tax ({selectedInvoice.tax_rate}%):</span>
                          <span className="font-medium">
                            Rs. {calculateTaxAmount(selectedInvoice)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-3 border-t border-gray-200 mt-3">
                        <span className="font-semibold text-lg">Total Amount:</span>
                        <span className="font-bold text-lg text-emerald-600">
                          Rs. {selectedInvoice.total_amount ? selectedInvoice.total_amount.toFixed(2) : '0.00'}
                        </span>
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
                      onClick={() => setViewInvoiceDialogOpen(false)}
                      className="px-5"
                    >
                      Close
                    </Button>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2 px-5"
                      onClick={() => handleDownload(selectedInvoice.invoice_id)}
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