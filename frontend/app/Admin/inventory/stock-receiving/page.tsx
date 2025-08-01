"use client";
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  Plus, 
  Search, 
  Package, 
  FileCheck, 
  Eye, 
  Edit, 
  AlertTriangle,
  CheckCircle,
  Trash2,
  Calendar,
  FileText,
  User,
  Upload,
  Truck,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Globe,
  Building2,
  Clock,
  X
} from 'lucide-react';

// Types based on your schema
interface Supplier {
  supplier_id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  website: string;
  notes: string;
  status: string;
}

interface PaymentTerm {
  payment_term_id: number;
  payment_term: string;
}

interface ShippingMethod {
  shipping_method_id: number;
  shipping_method: string;
}

interface Item {
  item_id: number;
  item_name: string;
  unit_of_measurements: string;
  unit_price: number;
  storage_location: string;
  barcode: string;
  expiry_alert_days: number;
  description: string;
  sub_category_id: number;
  supplier_id: number;
  batch_tracking: boolean;
}

interface PurchaseOrderItem {
  purchase_order_id: number;
  item_id: number;
  quantity: number;
  item: Item;
}

interface PurchaseOrder {
  purchase_order_id: number;
  supplier_id: number;
  requested_by: string;
  expected_delivery_date: string;
  payment_term_id: number;
  shipping_method_id: number;
  order_date: string;
  authorized_by: string;
  delivery_address: string;
  notes: string;
  supplier: Supplier;
  payment_term: PaymentTerm;
  shipping_method: ShippingMethod;
  stock_receivings: StockReceiving[];
  purchase_order_items: PurchaseOrderItem[];
  total_amount: number;
}

interface StockReceiving {
  stock_receiving_id: number;
  purchase_order_id: number;
  received_date: string;
  received_by: string;
  invoice_url: string;
  delivery_note_url: string;
  qc_report_url: string;
  notes: string;
  status: string;
  purchase_order: PurchaseOrder;
}

const StockReceivingSystem = () => {
  const { apiClient } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<StockReceiving | null>(null);
  const [stockReceipts, setStockReceipts] = useState<StockReceiving[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    purchase_order_id: '',
    received_date: '',
    received_by: '',
    invoice_url: '',
    delivery_note_url: '',
    qc_report_url: '',
    notes: '',
    status: 'not-updated'
  });

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState({
    invoice: null as File | null,
    delivery_note: null as File | null,
    qc_report: null as File | null
  });

  const [uploadLoading, setUploadLoading] = useState({
    invoice: false,
    delivery_note: false,
    qc_report: false
  });

  // Selected purchase order for form preview
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // API Functions
  const fetchStockReceipts = async () => {
    try {
      const response = await apiClient.get('/inventory/stock-receivings');
      return response.data;
    } catch (error) {
      console.error('Error fetching stock receipts:', error);
      throw error;
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const response = await apiClient.get('/inventory/purchase-orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }
  };

  const createStockReceipt = async (data: any) => {
    try {
      const response = await apiClient.post('/inventory/stock-receivings', data);
      return response.data;
    } catch (error) {
      console.error('Error creating stock receipt:', error);
      throw error;
    }
  };

  const updateStockReceipt = async (id: number, data: any) => {
    try {
      const response = await apiClient.put(`/inventory/stock-receivings/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating stock receipt:', error);
      throw error;
    }
  };

  const deleteStockReceipt = async (id: number) => {
    try {
      await apiClient.delete(`/inventory/stock-receivings/${id}`);
    } catch (error) {
      console.error('Error deleting stock receipt:', error);
      throw error;
    }
  };

  // File upload utility function
  const uploadFile = async (file: File, fileType: 'invoice' | 'delivery_note' | 'qc_report') => {
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      throw new Error('File too large');
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid file (PDF, JPG, PNG, DOC, DOCX)');
      throw new Error('Invalid file type');
    }

    setUploadLoading(prev => ({ ...prev, [fileType]: true }));
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Use the existing file upload endpoint with apiClient
      const response = await apiClient.post('/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const result = response.data;
      // Backend returns { url: '/uploads/files/filename' }
      const fileUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}${result.url}`;
      
      // Update form data with the uploaded file URL
      const urlField = fileType === 'invoice' ? 'invoice_url' : 
                      fileType === 'delivery_note' ? 'delivery_note_url' : 'qc_report_url';
      
      setFormData(prev => ({ ...prev, [urlField]: fileUrl }));
      
      // Show success message
      const fileTypeLabel = fileType === 'invoice' ? 'Invoice' : 
                            fileType === 'delivery_note' ? 'Delivery Note' : 'QC Report';
      toast.success(`${fileTypeLabel} uploaded successfully`);
      
      return fileUrl;
    } catch (error) {
      console.error('File upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to upload file: ${errorMessage}`);
      throw error;
    } finally {
      setUploadLoading(prev => ({ ...prev, [fileType]: false }));
    }
  };

  // Handle file selection and upload
  const handleFileSelect = async (file: File, fileType: 'invoice' | 'delivery_note' | 'qc_report') => {
    try {
      setUploadedFiles(prev => ({ ...prev, [fileType]: file }));
      await uploadFile(file, fileType);
    } catch (error) {
      console.error('Error uploading file:', error);
      // Reset file selection on error
      setUploadedFiles(prev => ({ ...prev, [fileType]: null }));
    }
  };

  // Remove uploaded file
  const handleFileRemove = (fileType: 'invoice' | 'delivery_note' | 'qc_report') => {
    const urlField = fileType === 'invoice' ? 'invoice_url' : 
                    fileType === 'delivery_note' ? 'delivery_note_url' : 'qc_report_url';
    
    setUploadedFiles(prev => ({ ...prev, [fileType]: null }));
    setFormData(prev => ({ ...prev, [urlField]: '' }));
    
    const fileTypeLabel = fileType === 'invoice' ? 'Invoice' : 
                          fileType === 'delivery_note' ? 'Delivery Note' : 'QC Report';
    toast.success(`${fileTypeLabel} removed successfully`);
  };



  // Mock data based on your schema
  const mockStockReceipts: StockReceiving[] = [
    {
      stock_receiving_id: 2,
      purchase_order_id: 4,
      received_date: '2025-07-25',
      received_by: 'John Doe',
      invoice_url: 'https://example.com/invoices/invoice1.pdf',
      delivery_note_url: 'https://example.com/delivery-notes/delivery1.pdf',
      qc_report_url: 'https://example.com/qc-reports/qc1.pdf',
      notes: 'Received all items in good condition.',
      status: 'not-updated',
      purchase_order: {
        purchase_order_id: 4,
        supplier_id: 1,
        requested_by: 'John Doe',
        expected_delivery_date: '2025-08-15',
        payment_term_id: 1,
        shipping_method_id: 1,
        order_date: '2025-07-25',
        authorized_by: 'Jane Smith',
        delivery_address: '123 Main St, Cityville',
        notes: 'Please expedite shipping.',
        supplier: {
          supplier_id: 1,
          company_name: 'DentalSupplies Inc.',
          contact_person: 'Dr. Samantha Lee',
          email: 'samantha@dentalsupplies.com',
          phone_number: '+1-555-234-5678',
          address: '456 Tooth Ave',
          city: 'Colombo',
          state: 'Western Province',
          postal_code: '10100',
          country: 'Sri Lanka',
          website: 'https://www.dentalsupplies.com',
          notes: 'Primary supplier for surgical items',
          status: 'active'
        },
        payment_term: {
          payment_term_id: 1,
          payment_term: 'Net 30'
        },
        shipping_method: {
          shipping_method_id: 1,
          shipping_method: 'Express Delivery'
        },
        stock_receivings: [],
        purchase_order_items: [
          {
            purchase_order_id: 4,
            item_id: 1,
            quantity: 50,
            item: {
              item_id: 1,
              item_name: 'Nitrile Examination Gloves',
              unit_of_measurements: 'boxes',
              unit_price: 1250.5,
              storage_location: 'Shelf A2',
              barcode: '8901234567890',
              expiry_alert_days: 30,
              description: 'Disposable non-sterile gloves for general examination use',
              sub_category_id: 1,
              supplier_id: 1,
              batch_tracking: true
            }
          }
        ],
        total_amount: 62525
      }
    },
    {
      stock_receiving_id: 3,
      purchase_order_id: 5,
      received_date: '2025-07-28',
      received_by: 'Sarah Wilson',
      invoice_url: 'https://example.com/invoices/invoice2.pdf',
      delivery_note_url: '',
      qc_report_url: 'https://example.com/qc-reports/qc2.pdf',
      notes: 'Minor packaging damage on 2 items, otherwise good.',
      status: 'updated',
      purchase_order: {
        purchase_order_id: 5,
        supplier_id: 2,
        requested_by: 'Sarah Wilson',
        expected_delivery_date: '2025-08-20',
        payment_term_id: 2,
        shipping_method_id: 2,
        order_date: '2025-07-28',
        authorized_by: 'Mike Johnson',
        delivery_address: '789 Oak Street, Medical Center',
        notes: 'Handle with care - fragile items.',
        supplier: {
          supplier_id: 2,
          company_name: 'MedTech Solutions',
          contact_person: 'Dr. Michael Chen',
          email: 'michael@medtechsolutions.com',
          phone_number: '+1-555-987-6543',
          address: '789 Innovation Drive',
          city: 'Kandy',
          state: 'Central Province',
          postal_code: '20000',
          country: 'Sri Lanka',
          website: 'https://www.medtechsolutions.com',
          notes: 'Specialized in dental equipment',
          status: 'active'
        },
        payment_term: {
          payment_term_id: 2,
          payment_term: 'Net 15'
        },
        shipping_method: {
          shipping_method_id: 2,
          shipping_method: 'Standard Delivery'
        },
        stock_receivings: [],
        purchase_order_items: [
          {
            purchase_order_id: 5,
            item_id: 2,
            quantity: 25,
            item: {
              item_id: 2,
              item_name: 'Dental Composite Resin',
              unit_of_measurements: 'syringes',
              unit_price: 2850.75,
              storage_location: 'Refrigerator B1',
              barcode: '8901234567891',
              expiry_alert_days: 14,
              description: 'Light-cured composite for dental restorations',
              sub_category_id: 2,
              supplier_id: 2,
              batch_tracking: true
            }
          }
        ],
        total_amount: 71268.75
      }
    }
  ];

  const mockPurchaseOrders: PurchaseOrder[] = [
    {
      purchase_order_id: 6,
      supplier_id: 1,
      requested_by: 'Emma Davis',
      expected_delivery_date: '2025-08-25',
      payment_term_id: 1,
      shipping_method_id: 1,
      order_date: '2025-08-01',
      authorized_by: 'Robert Brown',
      delivery_address: '456 Medical Plaza, Downtown',
      notes: 'Urgent order for upcoming procedures.',
      supplier: {
        supplier_id: 1,
        company_name: 'DentalSupplies Inc.',
        contact_person: 'Dr. Samantha Lee',
        email: 'samantha@dentalsupplies.com',
        phone_number: '+1-555-234-5678',
        address: '456 Tooth Ave',
        city: 'Colombo',
        state: 'Western Province',
        postal_code: '10100',
        country: 'Sri Lanka',
        website: 'https://www.dentalsupplies.com',
        notes: 'Primary supplier for surgical items',
        status: 'active'
      },
      payment_term: {
        payment_term_id: 1,
        payment_term: 'Net 30'
      },
      shipping_method: {
        shipping_method_id: 1,
        shipping_method: 'Express Delivery'
      },
      stock_receivings: [],
      purchase_order_items: [
        {
          purchase_order_id: 6,
          item_id: 3,
          quantity: 100,
          item: {
            item_id: 3,
            item_name: 'Surgical Masks',
            unit_of_measurements: 'boxes',
            unit_price: 45.99,
            storage_location: 'Shelf C3',
            barcode: '8901234567892',
            expiry_alert_days: 90,
            description: 'Disposable 3-layer surgical masks',
            sub_category_id: 3,
            supplier_id: 1,
            batch_tracking: false
          }
        }
      ],
      total_amount: 4599
    }
  ];

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      setError(null);
      
      try {
        const [receiptsData, ordersData] = await Promise.all([
          fetchStockReceipts(),
          fetchPurchaseOrders()
        ]);
        
        setStockReceipts(receiptsData);
        setPurchaseOrders(ordersData);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data. Please try again.');
        toast.error('Failed to load data');
        
        // Fallback to mock data for development
        setStockReceipts(mockStockReceipts);
        setPurchaseOrders(mockPurchaseOrders);
      } finally {
        setDataLoading(false);
      }
    };
    
    loadData();
  }, []);



  const executeDelete = async () => {
    if (!selectedReceipt) return;
    
    try {
      await deleteStockReceipt(selectedReceipt.stock_receiving_id);
      setStockReceipts(prev => prev.filter(r => r.stock_receiving_id !== selectedReceipt.stock_receiving_id));
      toast.success('Stock receipt deleted successfully');
    } catch (error) {
      console.error('Error deleting stock receipt:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to delete stock receipt: ${errorMessage}`);
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedReceipt(null);
    }
  };

  const handleStatusToggle = async (receipt: StockReceiving, newStatus: boolean) => {
    const updatedStatus = newStatus ? 'updated' : 'not-updated';
    
    try {
      await updateStockReceipt(receipt.stock_receiving_id, { status: updatedStatus });
      
      setStockReceipts(prev => 
        prev.map(r => 
          r.stock_receiving_id === receipt.stock_receiving_id 
            ? { ...r, status: updatedStatus }
            : r
        )
      );
      
      toast.success(`Status updated to ${updatedStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to update status: ${errorMessage}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const submitData = {
        ...formData,
        purchase_order_id: parseInt(formData.purchase_order_id)
      };
      
      if (selectedReceipt) {
        // Edit mode
        const updatedReceipt = await updateStockReceipt(selectedReceipt.stock_receiving_id, submitData);
        
        setStockReceipts(prev => prev.map(r => 
          r.stock_receiving_id === selectedReceipt.stock_receiving_id 
            ? { ...r, ...updatedReceipt }
            : r
        ));
        
        setIsEditOpen(false);
        toast.success('Stock receipt updated successfully');
      } else {
        // Add mode
        const newReceipt = await createStockReceipt(submitData);
        
        // Fetch the complete receipt with relations
        const receiptsData = await fetchStockReceipts();
        setStockReceipts(receiptsData);
        
        setIsAddOpen(false);
        toast.success('Stock receipt created successfully');
      }
      
      // Reset form
      setFormData({
        purchase_order_id: '',
        received_date: '',
        received_by: '',
        invoice_url: '',
        delivery_note_url: '',
        qc_report_url: '',
        notes: '',
        status: 'not-updated'
      });
      setUploadedFiles({
        invoice: null,
        delivery_note: null,
        qc_report: null
      });
      setSelectedReceipt(null);
      setSelectedPO(null);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to ${selectedReceipt ? 'update' : 'create'} stock receipt: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      purchase_order_id: '',
      received_date: '',
      received_by: '',
      invoice_url: '',
      delivery_note_url: '',
      qc_report_url: '',
      notes: '',
      status: 'not-updated'
    });
    setUploadedFiles({
      invoice: null,
      delivery_note: null,
      qc_report: null
    });
    setSelectedReceipt(null);
    setSelectedPO(null);
  };

  // Handle purchase order selection
  const handlePOSelection = (poId: string) => {
    setFormData(prev => ({ ...prev, purchase_order_id: poId }));
    const po = purchaseOrders.find(p => p.purchase_order_id === parseInt(poId));
    setSelectedPO(po || null);
  };

  // Handler functions for CRUD operations
  const handleViewReceipt = (receipt: StockReceiving) => {
    setSelectedReceipt(receipt);
    setIsViewOpen(true);
  };

  const handleEditReceipt = (receipt: StockReceiving) => {
    setSelectedReceipt(receipt);
    setFormData({
      purchase_order_id: receipt.purchase_order_id.toString(),
      received_date: receipt.received_date,
      received_by: receipt.received_by,
      invoice_url: receipt.invoice_url || '',
      delivery_note_url: receipt.delivery_note_url || '',
      qc_report_url: receipt.qc_report_url || '',
      notes: receipt.notes || '',
      status: receipt.status
    });
    const po = purchaseOrders.find(p => p.purchase_order_id === receipt.purchase_order_id);
    setSelectedPO(po || null);
    setIsEditOpen(true);
  };

  const handleDeleteReceipt = (receipt: StockReceiving) => {
    setSelectedReceipt(receipt);
    setIsDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'updated':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Updated
          </Badge>
        );
      case 'not-updated':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending Update
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const getDocumentCount = (receipt: StockReceiving) => {
    let count = 0;
    if (receipt.invoice_url) count++;
    if (receipt.delivery_note_url) count++;
    if (receipt.qc_report_url) count++;
    return count;
  };

  // Filter receipts based on search term
  const filteredReceipts = stockReceipts.filter(receipt => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const receiptId = receipt.stock_receiving_id.toString();
    const supplierName = receipt.purchase_order?.supplier?.company_name?.toLowerCase() || '';
    const poNumber = receipt.purchase_order_id.toString();
    const receivedBy = receipt.received_by.toLowerCase();
    
    return receiptId.includes(searchLower) ||
           supplierName.includes(searchLower) ||
           poNumber.includes(searchLower) ||
           receivedBy.includes(searchLower);
  });

  // Show loading state
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Stock Receiving</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Manage inventory receipts with batch tracking and quality control
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center py-48">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading stock receiving data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && stockReceipts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Stock Receiving</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Manage inventory receipts with batch tracking and quality control
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <AlertTriangle className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Stock Receiving</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Manage inventory receipts with batch tracking and quality control
            </p>
          </div>
          
          <Button 
            className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto"
            onClick={() => {
              resetForm();
              setIsAddOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Receive Stock
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by receipt ID, supplier, PO number, or received by..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stock Receipts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredReceipts.map((receipt) => (
            <Card key={receipt.stock_receiving_id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold truncate">
                      Receipt #{receipt.stock_receiving_id}
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm">
                      <span className="truncate block">
                        {receipt.purchase_order?.supplier?.company_name || 'Unknown Supplier'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(receipt.received_date).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 ml-2">
                    {getStatusBadge(receipt.status)}
                    
                    {/* Status Toggle */}
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border">
                      <span className="text-xs font-medium text-gray-600">
                        {receipt.status === 'updated' ? 'Updated' : 'Pending'}
                      </span>
                      <Switch
                        checked={receipt.status === 'updated'}
                        onCheckedChange={(checked) => handleStatusToggle(receipt, checked)}
                        className="scale-75"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      PO:
                    </span>
                    <span className="font-medium">#{receipt.purchase_order_id}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Received by:
                    </span>
                    <span className="font-medium text-xs truncate max-w-20">{receipt.received_by}</span>
                  </div>
                  
                 {/* <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Quantity
                    </span>
                    <span className="font-medium">{receipt.purchase_order? || 0}</span>
                  </div> */}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Upload className="h-3 w-3" />
                      Documents:
                    </span>
                    <span className="font-medium">{getDocumentCount(receipt)}/3</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Total:
                    </span>
                    <span className="font-medium text-green-600">
                      ${(receipt.purchase_order?.total_amount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewReceipt(receipt)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEditReceipt(receipt)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleDeleteReceipt(receipt)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {receipt.notes && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border-l-2 border-blue-200">
                    <strong>Notes:</strong> {receipt.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredReceipts.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No stock receipts found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? "Try adjusting your search terms"
                  : "Get started by receiving your first stock delivery"
                }
              </p>
              {!searchTerm && (
                <Button 
                  className="bg-emerald-500 hover:bg-emerald-600"
                  onClick={() => {
                    resetForm();
                    setIsAddOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Receive First Stock
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Stock Receipt Dialog */}
      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddOpen(false);
          setIsEditOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedReceipt ? 'Edit Stock Receipt' : 'Receive New Stock'}
            </DialogTitle>
            <DialogDescription>
              {selectedReceipt 
                ? 'Update the stock receipt information below.'
                : 'Fill in the details to record a new stock receipt.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_order_id">Purchase Order *</Label>
                <Select 
                  value={formData.purchase_order_id} 
                  onValueChange={handlePOSelection}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Purchase Order" />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseOrders.map((po) => (
                      <SelectItem key={po.purchase_order_id} value={po.purchase_order_id.toString()}>
                        PO #{po.purchase_order_id} - {po?.supplier?.company_name || 'Unknown Supplier'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="received_date">Received Date *</Label>
                <Input
                  id="received_date"
                  type="date"
                  value={formData.received_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, received_date: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            {/* Purchase Order Details Preview */}
            {selectedPO && (
              <Card className="mt-4 bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Package className="h-5 w-5 mr-2 text-blue-600" />
                    Purchase Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* PO Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Order Date:</span>
                      <p className="font-medium">{new Date(selectedPO.order_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Expected Delivery:</span>
                      <p className="font-medium">{new Date(selectedPO.expected_delivery_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Amount:</span>
                      <p className="font-semibold text-green-600">${(selectedPO?.total_amount || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Supplier Info */}
                  <div className="bg-white p-3 rounded-lg border">
                    <h4 className="font-medium text-sm mb-2 flex items-center">
                      <Building2 className="h-4 w-4 mr-1" />
                      Supplier Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Company:</span>
                        <p className="font-medium">{selectedPO?.supplier?.company_name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Contact:</span>
                        <p className="font-medium">{selectedPO?.supplier?.contact_person || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <p className="font-medium text-xs">{selectedPO?.supplier?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <p className="font-medium text-xs">{selectedPO?.supplier?.phone_number || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="bg-white p-3 rounded-lg border">
                    <h4 className="font-medium text-sm mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      Order Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Requested By:</span>
                        <p className="font-medium">{selectedPO.requested_by}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Authorized By:</span>
                        <p className="font-medium">{selectedPO.authorized_by}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Payment Terms:</span>
                        <p className="font-medium">{selectedPO?.payment_term?.payment_term || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Shipping Method:</span>
                        <p className="font-medium">{selectedPO?.shipping_method?.shipping_method || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-gray-600">Delivery Address:</span>
                      <p className="font-medium text-sm">{selectedPO.delivery_address}</p>
                    </div>
                  </div>

                  {/* Items to Receive */}
                  <div className="bg-white p-3 rounded-lg border">
                    <h4 className="font-medium text-sm mb-3 flex items-center justify-between">
                      <span className="flex items-center">
                        <Package className="h-4 w-4 mr-1" />
                        Items to Receive ({selectedPO?.purchase_order_items?.length || 0} items)
                      </span>
                      <span className="text-green-600 font-semibold">
                        Total: ${(selectedPO?.total_amount || 0).toLocaleString()}
                      </span>
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {(selectedPO?.purchase_order_items || []).map((item, index) => (
                        <div key={item.item_id} className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-400 hover:bg-gray-100 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-base text-gray-900 truncate">{item?.item?.item_name || 'Unknown Item'}</h5>
                              <p className="text-sm text-gray-600 mt-1">{item?.item?.description || 'No description'}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {item?.item?.unit_of_measurements || 'N/A'}
                                </Badge>
                                <Badge 
                                  variant={item?.item?.batch_tracking ? "default" : "outline"}
                                  className="text-xs"
                                >
                                  {item?.item?.batch_tracking ? 'Batch Tracked' : 'No Batch Tracking'}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right ml-4 bg-blue-100 p-3 rounded-lg">
                              <p className="text-sm text-gray-600 mb-1">Quantity to Receive</p>
                              <p className="text-2xl font-bold text-blue-600">{item.quantity}</p>
                              <p className="text-xs text-gray-500">{item.item.unit_of_measurements}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm bg-white p-3 rounded border">
                            <div className="text-center">
                              <span className="text-gray-500 block text-xs">Unit Price</span>
                              <p className="font-semibold text-green-600">${item?.item?.unit_price || 0}</p>
                            </div>
                            <div className="text-center">
                              <span className="text-gray-500 block text-xs">Line Total</span>
                              <p className="font-semibold text-green-600">
                                ${((item?.item?.unit_price || 0) * (item?.quantity || 0)).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-center">
                              <span className="text-gray-500 block text-xs">Storage Location</span>
                              <p className="font-medium text-gray-900 truncate">{item?.item?.storage_location || 'N/A'}</p>
                            </div>
                            <div className="text-center">
                              <span className="text-gray-500 block text-xs">Expiry Alert</span>
                              <p className="font-medium text-gray-900">{item?.item?.expiry_alert_days || 0} days</p>
                            </div>
                          </div>
                          
                          <div className="mt-3 text-sm bg-gray-100 p-2 rounded">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Barcode:</span>
                              <span className="font-mono text-gray-900">{item?.item?.barcode || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Summary Footer */}
                    <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-900">
                          Total Items: {(selectedPO?.purchase_order_items || []).reduce((sum, item) => sum + (item?.quantity || 0), 0)} units
                        </span>
                        <span className="font-bold text-blue-900 text-lg">
                          Order Total: ${(selectedPO?.total_amount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PO Notes */}
                  {selectedPO.notes && (
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <h4 className="font-medium text-sm mb-2 text-yellow-800">Purchase Order Notes:</h4>
                      <p className="text-sm text-yellow-700">{selectedPO.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="received_by">Received By *</Label>
                <Input
                  id="received_by"
                  value={formData.received_by}
                  onChange={(e) => setFormData(prev => ({ ...prev, received_by: e.target.value }))}
                  placeholder="Enter receiver name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-updated">Not Updated</SelectItem>
                    <SelectItem value="updated">Updated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* File Upload Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-900 flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Document Uploads
              </h4>
              
              {/* Invoice Upload */}
              <div className="space-y-2">
                <Label htmlFor="invoice_file">Invoice Document</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      id="invoice_file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileSelect(file, 'invoice');
                        }
                      }}
                      className="cursor-pointer"
                      disabled={uploadLoading.invoice}
                    />
                  </div>
                  {uploadLoading.invoice && (
                    <div className="text-sm text-blue-600 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Uploading...
                    </div>
                  )}
                  {uploadedFiles.invoice && !uploadLoading.invoice && (
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-green-600 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Uploaded
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileRemove('invoice')}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {formData.invoice_url && (
                  <div className="text-xs text-gray-500 truncate bg-gray-50 p-2 rounded border">
                    📄 {uploadedFiles.invoice?.name || 'Previously uploaded file'}
                  </div>
                )}
              </div>
              
              {/* Delivery Note Upload */}
              <div className="space-y-2">
                <Label htmlFor="delivery_note_file">Delivery Note</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      id="delivery_note_file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileSelect(file, 'delivery_note');
                        }
                      }}
                      className="cursor-pointer"
                      disabled={uploadLoading.delivery_note}
                    />
                  </div>
                  {uploadLoading.delivery_note && (
                    <div className="text-sm text-blue-600 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Uploading...
                    </div>
                  )}
                  {uploadedFiles.delivery_note && !uploadLoading.delivery_note && (
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-green-600 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Uploaded
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileRemove('delivery_note')}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {formData.delivery_note_url && (
                  <div className="text-xs text-gray-500 truncate bg-gray-50 p-2 rounded border">
                    📦 {uploadedFiles.delivery_note?.name || 'Previously uploaded file'}
                  </div>
                )}
              </div>
              
              {/* QC Report Upload */}
              <div className="space-y-2">
                <Label htmlFor="qc_report_file">Quality Control Report</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      id="qc_report_file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileSelect(file, 'qc_report');
                        }
                      }}
                      className="cursor-pointer"
                      disabled={uploadLoading.qc_report}
                    />
                  </div>
                  {uploadLoading.qc_report && (
                    <div className="text-sm text-blue-600 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Uploading...
                    </div>
                  )}
                  {uploadedFiles.qc_report && !uploadLoading.qc_report && (
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-green-600 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Uploaded
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileRemove('qc_report')}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {formData.qc_report_url && (
                  <div className="text-xs text-gray-500 truncate bg-gray-50 p-2 rounded border">
                    📋 {uploadedFiles.qc_report?.name || 'Previously uploaded file'}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about the receipt..."
                rows={3}
              />
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsAddOpen(false);
                  setIsEditOpen(false);
                  resetForm();
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600"
              >
                {loading ? 'Saving...' : (selectedReceipt ? 'Update Receipt' : 'Save Receipt')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Receipt Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock Receipt Details</DialogTitle>
            <DialogDescription>
              View complete information for this stock receipt
            </DialogDescription>
          </DialogHeader>
          
          {selectedReceipt && (
            <div className="mt-6 space-y-6">
              {/* Receipt Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Receipt #{selectedReceipt.stock_receiving_id}
                    {getStatusBadge(selectedReceipt.status)}
                  </CardTitle>
                  <CardDescription>
                    Received on {new Date(selectedReceipt.received_date).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Purchase Order:</span>
                      <p className="font-medium">#{selectedReceipt.purchase_order_id}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Received By:</span>
                      <p className="font-medium">{selectedReceipt.received_by}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Order Date:</span>
                      <p className="font-medium">
                        {new Date(selectedReceipt.purchase_order.order_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Expected Delivery:</span>
                      <p className="font-medium">
                        {new Date(selectedReceipt.purchase_order.expected_delivery_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Supplier Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    Supplier Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-lg">{selectedReceipt?.purchase_order?.supplier?.company_name || 'Unknown Supplier'}</h4>
                    <p className="text-gray-600 text-sm">{selectedReceipt?.purchase_order?.supplier?.contact_person || 'N/A'}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-xs break-all">{selectedReceipt?.purchase_order?.supplier?.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-xs">{selectedReceipt?.purchase_order?.supplier?.phone_number || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-xs">
                        {selectedReceipt?.purchase_order?.supplier?.city || 'N/A'}, {selectedReceipt?.purchase_order?.supplier?.state || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <a 
                        href={selectedReceipt?.purchase_order?.supplier?.website || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs truncate"
                      >
                        Website
                      </a>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <span className="text-gray-600 text-sm">Address:</span>
                    <p className="text-sm">
                      {selectedReceipt?.purchase_order?.supplier?.address || 'N/A'}, {selectedReceipt?.purchase_order?.supplier?.city || 'N/A'}, {selectedReceipt?.purchase_order?.supplier?.state || 'N/A'} {selectedReceipt?.purchase_order?.supplier?.postal_code || 'N/A'}, {selectedReceipt?.purchase_order?.supplier?.country || 'N/A'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Order Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Order Details
                    </span>
                    <span className="text-green-600 font-semibold">
                      ${(selectedReceipt?.purchase_order?.total_amount || 0).toLocaleString()}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Payment Terms:</span>
                      <p className="font-medium">{selectedReceipt?.purchase_order?.payment_term?.payment_term || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Shipping Method:</span>
                      <p className="font-medium">{selectedReceipt?.purchase_order?.shipping_method?.shipping_method || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Requested By:</span>
                      <p className="font-medium">{selectedReceipt?.purchase_order?.requested_by || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Authorized By:</span>
                      <p className="font-medium">{selectedReceipt?.purchase_order?.authorized_by || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 text-sm">Delivery Address:</span>
                    <p className="text-sm">{selectedReceipt?.purchase_order?.delivery_address || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Items Received */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Items Received</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(selectedReceipt?.purchase_order?.purchase_order_items || []).map((item) => (
                      <div key={item.item_id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{item?.item?.item_name || 'Unknown Item'}</h4>
                            <p className="text-xs text-gray-600 truncate">{item?.item?.description || 'No description'}</p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-semibold text-sm">Qty: {item?.quantity || 0}</p>
                            <p className="text-xs text-gray-600">{item?.item?.unit_of_measurements || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Unit Price:</span>
                            <p className="font-medium">${item?.item?.unit_price || 0}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Total:</span>
                            <p className="font-medium">${((item?.item?.unit_price || 0) * (item?.quantity || 0)).toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Location:</span>
                            <p className="font-medium truncate">{item?.item?.storage_location || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Batch Tracking:</span>
                            <Badge 
                              variant={item?.item?.batch_tracking ? "default" : "outline"}
                              className="text-xs"
                            >
                              {item?.item?.batch_tracking ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-xs">
                          <span className="text-gray-500">Barcode:</span>
                          <span className="font-mono ml-1">{item?.item?.barcode || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <FileCheck className="h-5 w-5 mr-2" />
                    Documents ({getDocumentCount(selectedReceipt)}/3)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Invoice</span>
                      </div>
                      {selectedReceipt.invoice_url ? (
                        <a 
                          href={selectedReceipt.invoice_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View Document
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">Not uploaded</span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Delivery Note</span>
                      </div>
                      {selectedReceipt.delivery_note_url ? (
                        <a 
                          href={selectedReceipt.delivery_note_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View Document
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">Not uploaded</span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">QC Report</span>
                      </div>
                      {selectedReceipt.qc_report_url ? (
                        <a 
                          href={selectedReceipt.qc_report_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View Document
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">Not uploaded</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {(selectedReceipt.notes || selectedReceipt.purchase_order.notes) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedReceipt.notes && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Receipt Notes:</h4>
                        <p className="text-sm bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                          {selectedReceipt.notes}
                        </p>
                      </div>
                    )}
                    
                    {selectedReceipt.purchase_order.notes && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Purchase Order Notes:</h4>
                        <p className="text-sm bg-gray-50 p-3 rounded border-l-4 border-gray-400">
                          {selectedReceipt.purchase_order.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          
          <DialogFooter className="mt-6">
            <Button 
              onClick={() => setIsViewOpen(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center">
              <Trash2 className="h-5 w-5 mr-2" />
              Delete Stock Receipt
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-3">
              {selectedReceipt && (
                <>
                  <p className="mb-4">Are you sure you want to delete this stock receipt?</p>
                  <div className="bg-gray-50 p-3 rounded-md mb-4 border-l-4 border-red-400">
                    <p className="font-medium">Receipt #{selectedReceipt.stock_receiving_id}</p>
                    <p className="text-sm text-gray-600">
                      Supplier: {selectedReceipt.purchase_order.supplier.company_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Date: {new Date(selectedReceipt.received_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Total Value: ${selectedReceipt.purchase_order.total_amount.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-red-500 text-sm">
                    This will permanently delete the receipt and all associated data.
                    This action cannot be undone.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={loading} className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto" 
              onClick={executeDelete}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Receipt'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StockReceivingSystem;