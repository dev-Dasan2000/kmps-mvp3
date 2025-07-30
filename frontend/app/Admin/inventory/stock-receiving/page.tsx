"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  Plus, 
  Search, 
  Package, 
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
  Building2,
  Phone,
  Mail,
  Package2,
  Clock,
  DollarSign,
  Clipboard,
  X,
  XCircle
} from 'lucide-react';

// Types based on your schema
interface ParentCategory {
  parent_category_id: number;
  parent_category_name: string;
  description: string;
}

interface SubCategory {
  sub_category_id: number;
  sub_category_name: string;
  description: string;
  parent_category_id: number;
}

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
  status: 'active' | 'inactive';
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

interface Batch {
  batch_id: number;
  item_id: number;
  current_stock: number;
  minimum_stock: number;
  expiry_date: string;
  stock_date: string;
}

interface PaymentTerm {
  payment_term_id: number;
  payment_term: string;
}

interface ShippingMethod {
  shipping_method_id: number;
  shipping_method: string;
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
  supplier?: Supplier;
  payment_term?: PaymentTerm;
  shipping_method?: ShippingMethod;
  purchase_order_items?: PurchaseOrderItem[];
}

interface PurchaseOrderItem {
  purchase_order_id: number;
  item_id: number;
  quantity: number;
  unit_price: number;
  item_name?: string;
  unit_of_measure?: string;
}

interface StockReceivingItem {
  id: string;
  inventory_item_id: string;
  item_name: string;
  quantity_ordered: number;
  quantity: number;
  unit_of_measure: string;
  batch_number: string;
  lot_number: string;
  manufacture_date: string;
  expiry_date: string;
  condition: 'good' | 'damaged' | 'expired';
  storage_location: string;
  remarks: string;
  has_discrepancy: boolean;
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
  purchase_order?: PurchaseOrder;
  items_count?: number;
  has_discrepancy?: boolean;
  stock_receipt_items?: StockReceivingItem[];
  suppliers?: { name: string };
  receipt_number?: string;
  invoice_uploaded?: boolean;
  delivery_note_uploaded?: boolean;
  qc_report_uploaded?: boolean;
}

interface ReceivingItem {
  id: string;
  inventory_item_id: string;
  item_name: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_of_measure: string;
  batch_number: string;
  lot_number: string;
  manufacture_date: string;
  expiry_date: string;
  condition: 'good' | 'damaged' | 'expired';
  storage_location: string;
  remarks: string;
  has_discrepancy: boolean;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

// Mock data
const mockSuppliers: Supplier[] = [
  {
    supplier_id: 1,
    company_name: "MedSupply Corp",
    contact_person: "John Smith",
    email: "john@medsupply.com",
    phone_number: "+1-555-0123",
    address: "123 Medical Ave",
    city: "Boston",
    state: "MA",
    postal_code: "02101",
    country: "USA",
    website: "www.medsupply.com",
    notes: "Primary dental supplies vendor",
    status: "active"
  },
  {
    supplier_id: 2,
    company_name: "Dental Equipment Ltd",
    contact_person: "Sarah Johnson",
    email: "sarah@dentalequip.com",
    phone_number: "+1-555-0456",
    address: "456 Dental St",
    city: "New York",
    state: "NY",
    postal_code: "10001",
    country: "USA",
    website: "www.dentalequip.com",
    notes: "Specialized in dental equipment",
    status: "active"
  }
];

const mockPaymentTerms: PaymentTerm[] = [
  { payment_term_id: 1, payment_term: "Net 30" },
  { payment_term_id: 2, payment_term: "Net 15" },
  { payment_term_id: 3, payment_term: "COD" }
];

const mockShippingMethods: ShippingMethod[] = [
  { shipping_method_id: 1, shipping_method: "Standard Shipping" },
  { shipping_method_id: 2, shipping_method: "Express Delivery" },
  { shipping_method_id: 3, shipping_method: "Next Day Air" }
];

const mockPurchaseOrderItems: PurchaseOrderItem[] = [
  {
    purchase_order_id: 1,
    item_id: 1,
    quantity: 100,
    unit_price: 2.50,
    item_name: "Disposable Gloves",
    unit_of_measure: "boxes"
  },
  {
    purchase_order_id: 1,
    item_id: 2,
    quantity: 50,
    unit_price: 15.00,
    item_name: "Dental Syringes",
    unit_of_measure: "units"
  },
  {
    purchase_order_id: 2,
    item_id: 3,
    quantity: 25,
    unit_price: 45.00,
    item_name: "Dental Burs Set",
    unit_of_measure: "sets"
  }
];

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    purchase_order_id: 1,
    supplier_id: 1,
    requested_by: "Dr. Miller",
    expected_delivery_date: "2024-02-15",
    payment_term_id: 1,
    shipping_method_id: 1,
    order_date: "2024-02-01",
    authorized_by: "Manager",
    delivery_address: "123 Clinic Ave, Boston, MA 02101",
    notes: "Urgent order for dental supplies",
    supplier: mockSuppliers[0],
    payment_term: mockPaymentTerms[0],
    shipping_method: mockShippingMethods[0],
    purchase_order_items: mockPurchaseOrderItems.filter(item => item.purchase_order_id === 1)
  },
  {
    purchase_order_id: 2,
    supplier_id: 2,
    requested_by: "Dr. Davis",
    expected_delivery_date: "2024-02-20",
    payment_term_id: 2,
    shipping_method_id: 2,
    order_date: "2024-02-05",
    authorized_by: "Manager",
    delivery_address: "456 Medical Center, New York, NY 10001",
    notes: "Equipment maintenance supplies",
    supplier: mockSuppliers[1],
    payment_term: mockPaymentTerms[1],
    shipping_method: mockShippingMethods[1],
    purchase_order_items: mockPurchaseOrderItems.filter(item => item.purchase_order_id === 2)
  }
];

const mockStockReceivingItems: StockReceivingItem[] = [
  {
    id: "1",
    inventory_item_id: "1",
    item_name: "Disposable Gloves",
    quantity_ordered: 100,
    quantity: 98,
    unit_of_measure: "boxes",
    batch_number: "GLV001",
    lot_number: "L2024001",
    manufacture_date: "2024-01-15",
    expiry_date: "2026-01-15",
    condition: "good",
    storage_location: "Storage Room A",
    remarks: "2 boxes damaged during transport",
    has_discrepancy: true
  },
  {
    id: "2",
    inventory_item_id: "2",
    item_name: "Dental Syringes",
    quantity_ordered: 50,
    quantity: 50,
    unit_of_measure: "units",
    batch_number: "SYR001",
    lot_number: "L2024002",
    manufacture_date: "2024-01-20",
    expiry_date: "2025-01-20",
    condition: "good",
    storage_location: "Storage Room B",
    remarks: "",
    has_discrepancy: false
  }
];

const mockStockReceivings: StockReceiving[] = [
  {
    stock_receiving_id: 1,
    purchase_order_id: 1,
    received_date: "2024-02-14",
    received_by: "John Doe",
    invoice_url: "https://example.com/invoice1.pdf",
    delivery_note_url: "https://example.com/delivery1.pdf",
    qc_report_url: "https://example.com/qc1.pdf",
    notes: "2 items damaged during transport, supplier will credit",
    purchase_order: mockPurchaseOrders[0],
    items_count: 2,
    has_discrepancy: true,
    stock_receipt_items: mockStockReceivingItems,
    suppliers: { name: "MedSupply Corp" },
    receipt_number: "REC001",
    invoice_uploaded: true,
    delivery_note_uploaded: true,
    qc_report_uploaded: true
  },
  {
    stock_receiving_id: 2,
    purchase_order_id: 2,
    received_date: "2024-02-18",
    received_by: "Jane Smith",
    invoice_url: "https://example.com/invoice2.pdf",
    delivery_note_url: "",
    qc_report_url: "https://example.com/qc2.pdf",
    notes: "All items received in perfect condition",
    purchase_order: mockPurchaseOrders[1],
    items_count: 1,
    has_discrepancy: false,
    stock_receipt_items: [mockStockReceivingItems[0]],
    suppliers: { name: "Dental Equipment Ltd" },
    receipt_number: "REC002",
    invoice_uploaded: true,
    delivery_note_uploaded: false,
    qc_report_uploaded: true
  }
];

// StockItemsView Component
const StockItemsView = ({ receipt, isOpen, onOpenChange }: {
  receipt: StockReceiving | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  if (!receipt) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getDiscrepancyCount = () => {
    return receipt.stock_receipt_items?.filter((item) => item.has_discrepancy).length || 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Items in Receipt #{receipt.receipt_number}
            </DialogTitle>
            {getDiscrepancyCount() > 0 ? (
              <Badge variant="destructive" className="text-sm py-1 w-fit">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                {getDiscrepancyCount()} {getDiscrepancyCount() === 1 ? 'Discrepancy' : 'Discrepancies'}
              </Badge>
            ) : (
              <Badge className="bg-green-100 text-green-800 text-sm py-1 w-fit">
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                All Items Match
              </Badge>
            )}
          </div>
          <DialogDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span>Received on {formatDate(receipt.received_date)}</span>
            <span className="font-medium">{receipt.suppliers?.name || "Unknown Supplier"}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {/* Mobile Card View */}
          <div className="block lg:hidden space-y-4">
            {receipt.stock_receipt_items?.map((item, index) => {
              const difference = item.quantity - item.quantity_ordered;
              const isDifferent = item.quantity !== item.quantity_ordered;
              
              return (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <h4 className="font-medium text-sm">{item.item_name}</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500">Ordered:</span>
                        <span className="ml-1 font-medium">{item.quantity_ordered} {item.unit_of_measure}</span>
                      </div>
                      {item.expiry_date && (
                        <div>
                          <span className="text-gray-500">Expires:</span>
                          <span className="ml-1">{formatDate(item.expiry_date)}</span>
                        </div>
                      )}
                    </div>
                    
                    {item.remarks && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                        <strong>Notes:</strong> {item.remarks}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block rounded-md border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Info</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receipt.stock_receipt_items?.map((item, index) => {
                  const difference = item.quantity - item.quantity_ordered;
                  const isDifferent = item.quantity !== item.quantity_ordered;
                  
                  return (
                    <tr key={index} className={isDifferent ? "bg-red-50" : "hover:bg-gray-50"}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{item.item_name}</div>
                        {item.condition !== 'good' && (
                          <Badge variant={item.condition === 'damaged' ? 'destructive' : 'outline'} className="mt-1 text-xs">
                            {item.condition}
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-4 text-sm text-center font-medium text-gray-900">
                        {item.quantity_ordered} {item.unit_of_measure}
                      </td>
                      <td className="px-3 py-4 text-sm">
                        <div className="space-y-1">
                          
                          {item.expiry_date && (
                            <div className="flex items-center gap-1 text-gray-700">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-xs">Expires: {formatDate(item.expiry_date)}</span>
                            </div>
                          )}
                          {item.storage_location && (
                            <div className="text-xs text-gray-500 mt-1">Location: {item.storage_location}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-center">
                        {isDifferent ? (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Discrepancy
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Match
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {receipt.stock_receipt_items?.some((item) => item.remarks) && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Item Notes</h3>
              <div className="space-y-2">
                {receipt.stock_receipt_items
                  .filter((item) => item.remarks)
                  .map((item, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md">
                      <div className="font-medium">{item.item_name}</div>
                      <div className="text-sm text-gray-700 mt-1">{item.remarks}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// StockReceivingView Component
const StockReceivingView = ({ receipt, isOpen, onOpenChange }: {
  receipt: StockReceiving | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  if (!receipt) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getDiscrepancyCount = () => {
    return receipt.stock_receipt_items?.filter((item) => item.has_discrepancy).length || 0;
  };

  const getDocumentStatus = () => {
    const docs = [];
    if (receipt.invoice_uploaded) docs.push('Invoice');
    if (receipt.delivery_note_uploaded) docs.push('Delivery Note');
    if (receipt.qc_report_uploaded) docs.push('QC Report');
    return docs;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <DialogTitle className="text-xl sm:text-2xl font-bold">
              Receipt #{receipt.receipt_number}
            </DialogTitle>
            <Badge className="bg-green-100 text-green-800 text-sm w-fit">
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              Received
            </Badge>
          </div>
          <DialogDescription>Received on {formatDate(receipt.received_date)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-600" />
                    Supplier Details
                  </h3>
                  <div className="space-y-2 pl-7">
                    <div className="text-sm">
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-2 font-medium">{receipt.suppliers?.name || "N/A"}</span>
                    </div>
                    {receipt.purchase_order && (
                      <div className="text-sm">
                        <span className="text-gray-500">PO Number:</span>
                        <span className="ml-2 font-medium">#{receipt.purchase_order_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Receipt Information
                  </h3>
                  <div className="space-y-2 pl-7">
                    <div className="text-sm">
                      <span className="text-gray-500">Date:</span>
                      <span className="ml-2 font-medium">{formatDate(receipt.received_date)}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Received By:</span>
                      <span className="ml-2 font-medium">{receipt.received_by || "Not specified"}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Items Received:</span>
                      <span className="ml-2 font-medium">{receipt.stock_receipt_items?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Documentation
            </h3>
            <div className="flex flex-wrap gap-2">
              {getDocumentStatus().length > 0 ? (
                getDocumentStatus().map((doc) => (
                  <Badge key={doc} variant="outline" className="text-sm py-1 px-3 bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-2" />
                    {doc} Uploaded
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="text-sm py-1 px-3">
                  No documents uploaded
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Received Items
              </h3>
              {getDiscrepancyCount() > 0 && (
                <Badge variant="destructive" className="text-sm py-1 w-fit">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  {getDiscrepancyCount()} {getDiscrepancyCount() === 1 ? 'Discrepancy' : 'Discrepancies'} Detected
                </Badge>
              )}
            </div>

            {/* Mobile Card View for Items */}
            <div className="block lg:hidden space-y-3">
              {receipt.stock_receipt_items?.map((item, index) => (
                <Card key={index} className={item.has_discrepancy ? "border-red-300 bg-red-50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{item.item_name}</h4>
                      {item.has_discrepancy ? (
                        <Badge variant="destructive" className="text-xs">Discrepancy</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">OK</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Ordered:</span>
                        <span className="ml-1">{item.quantity_ordered} {item.unit_of_measure}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Received:</span>
                        <span className={`ml-1 ${item.has_discrepancy ? "text-red-700 font-medium" : ""}`}>
                          {item.quantity} {item.unit_of_measure}
                        </span>
                      </div>
                      
                      {item.expiry_date && (
                        <div>
                          <span className="text-gray-500">Expires:</span>
                          <span className="ml-1">{formatDate(item.expiry_date)}</span>
                        </div>
                      )}
                    </div>
                    
                    {item.remarks && (
                      <div className="mt-2 text-xs text-gray-600">{item.remarks}</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table View for Items */}
            <div className="hidden lg:block rounded-md border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty Ordered</th>
                   
                    
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {receipt.stock_receipt_items?.map((item, index) => (
                    <tr key={index} className={item.has_discrepancy ? "bg-red-50" : ""}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                        {item.remarks && <div className="text-xs text-gray-500 mt-1">{item.remarks}</div>}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {item.quantity_ordered} {item.unit_of_measure}
                      </td>
                      
                      
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {formatDate(item.expiry_date)}
                      </td>
                      <td className="px-3 py-4 text-sm">
                        {item.has_discrepancy ? (
                          <Badge variant="destructive" className="text-xs">Discrepancy</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">OK</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {receipt.notes && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clipboard className="h-5 w-5 text-blue-600" />
                Notes
              </h3>
              <div className="bg-gray-50 p-4 rounded-md text-sm">
                {receipt.notes}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// StockReceivingForm Component
const StockReceivingForm = ({ 
  suppliers, 
  purchaseOrders, 
  onSuccess, 
  isOpen, 
  onOpenChange,
  initialData = null,
  readOnly = false
}: {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  onSuccess: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: StockReceiving | null;
  readOnly?: boolean;
}) => {
  const [formData, setFormData] = useState({
    purchase_order_id: '',
    supplier_id: '',
    receipt_date: new Date().toISOString().split('T')[0],
    received_by: '',
    notes: ''
  });
  
  const [receivingItems, setReceivingItems] = useState<ReceivingItem[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{
    invoice: UploadedFile | null;
    deliveryNote: UploadedFile | null;
    qcReport: UploadedFile | null;
  }>({
    invoice: null,
    deliveryNote: null,
    qcReport: null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        purchase_order_id: initialData.purchase_order_id?.toString() || '',
        supplier_id: initialData.purchase_order?.supplier_id?.toString() || '',
        receipt_date: initialData.received_date || new Date().toISOString().split('T')[0],
        received_by: initialData.received_by || '',
        notes: initialData.notes || ''
      });
      
      if (initialData.stock_receipt_items) {
        const items: ReceivingItem[] = initialData.stock_receipt_items.map((item, index) => ({
          id: `${index + 1}`,
          inventory_item_id: item.inventory_item_id || '',
          item_name: item.item_name || 'Unknown Item',
          quantity_ordered: item.quantity_ordered,
          quantity_received: item.quantity,
          unit_of_measure: item.unit_of_measure || 'units',
          batch_number: item.batch_number || '',
          lot_number: item.lot_number || '',
          manufacture_date: item.manufacture_date || '',
          expiry_date: item.expiry_date || '',
          condition: item.condition || 'good',
          storage_location: item.storage_location || '',
          remarks: item.remarks || '',
          has_discrepancy: item.has_discrepancy || false
        }));
        setReceivingItems(items);
      }
      
      if (initialData.invoice_uploaded || initialData.delivery_note_uploaded || initialData.qc_report_uploaded) {
        setUploadedFiles({
          invoice: initialData.invoice_uploaded ? { name: 'Invoice', size: 0, type: '', file: null as any } : null,
          deliveryNote: initialData.delivery_note_uploaded ? { name: 'Delivery Note', size: 0, type: '', file: null as any } : null,
          qcReport: initialData.qc_report_uploaded ? { name: 'QC Report', size: 0, type: '', file: null as any } : null
        });
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (formData.purchase_order_id) {
      const po = purchaseOrders.find(p => p.purchase_order_id.toString() === formData.purchase_order_id);
      if (po) {
        setSelectedPO(po);
        setFormData(prev => ({ ...prev, supplier_id: po.supplier_id.toString() }));
        
        const items: ReceivingItem[] = po.purchase_order_items?.map((item, index) => ({
          id: `${index + 1}`,
          inventory_item_id: item.item_id.toString(),
          item_name: item.item_name || 'Unknown Item',
          quantity_ordered: item.quantity,
          quantity_received: item.quantity,
          unit_of_measure: item.unit_of_measure || 'units',
          batch_number: '',
          lot_number: '',
          manufacture_date: '',
          expiry_date: '',
          condition: 'good',
          storage_location: '',
          remarks: '',
          has_discrepancy: false
        })) || [];
        
        setReceivingItems(items);
      }
    } else {
      setReceivingItems([]);
      setSelectedPO(null);
    }
  }, [formData.purchase_order_id, purchaseOrders]);

  const updateReceivingItem = (id: string, field: keyof ReceivingItem, value: any) => {
    setReceivingItems(items => items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === 'quantity_received') {
          updatedItem.has_discrepancy = value !== item.quantity_ordered;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const getDiscrepancyCount = () => {
    return receivingItems.filter(item => item.has_discrepancy).length;
  };

  const handleFileUpload = (fileType: 'invoice' | 'deliveryNote' | 'qcReport', file: File) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fileType]: {
        name: file.name,
        size: file.size,
        type: file.type,
        file: file
      }
    }));
  };

  const removeFile = (fileType: 'invoice' | 'deliveryNote' | 'qcReport') => {
    setUploadedFiles(prev => ({
      ...prev,
      [fileType]: null
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (readOnly) {
      onOpenChange(false);
      return;
    }
    
    if (!formData.supplier_id) {
      alert("Please select a supplier");
      return;
    }

    if (!formData.receipt_date) {
      alert("Please select a receipt date");
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const receiptNumber = `REC${Math.floor(1000 + Math.random() * 9000)}`;
      
      if (initialData) {
        alert(`Stock receipt ${initialData.receipt_number} updated successfully`);
      } else {
        alert(`Stock receipt ${receiptNumber} created successfully`);
      }

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        purchase_order_id: '',
        supplier_id: '',
        receipt_date: new Date().toISOString().split('T')[0],
        received_by: '',
        notes: ''
      });
      setReceivingItems([]);
      setUploadedFiles({
        invoice: null,
        deliveryNote: null,
        qcReport: null
      });
      setLoading(false);
    }, 1000);
  };

  // Get PO items for the selected PO
  const poItems = selectedPO?.purchase_order_items || [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">
            {readOnly ? 'View Stock Receipt' : initialData ? 'Edit Stock Receipt' : 'Receive Stock Inventory'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'View details of received inventory'
              : initialData
              ? 'Update received inventory details'
              : 'Record received inventory with batch tracking and documentation'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="purchase_order_id">Linked PO Number *</Label>
                {formData.purchase_order_id && !readOnly && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7 px-2 text-gray-500 hover:bg-red-50 hover:text-red-600 border-dashed"
                    onClick={() => {
                      setFormData({...formData, purchase_order_id: ''});
                      setReceivingItems([]);
                      setSelectedPO(null);
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear PO
                  </Button>
                )}
              </div>
              <Select
                value={formData.purchase_order_id}
                onValueChange={(value) => setFormData({ ...formData, purchase_order_id: value })}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select PO (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {purchaseOrders.map((po) => (
                    <SelectItem key={po.purchase_order_id} value={po.purchase_order_id.toString()}>
                      PO #{po.purchase_order_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_id">Supplier *</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                disabled={!!formData.purchase_order_id || readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedPO ? selectedPO.supplier?.company_name : 'Select supplier'} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.supplier_id} value={supplier.supplier_id.toString()}>
                      {supplier.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receipt_date">Receipt Date *</Label>
              <Input
                id="receipt_date"
                type="date"
                value={formData.receipt_date}
                onChange={(e) => setFormData({ ...formData, receipt_date: e.target.value })}
                readOnly={readOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="received_by">Received By</Label>
              <Input
                placeholder="John Doe"
                value={formData.received_by}
                onChange={(e) => setFormData({ ...formData, received_by: e.target.value })}
                readOnly={readOnly}
              />
            </div>
          </div>

          {/* PO Items Table */}
          {selectedPO && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Purchase Order Items</h3>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty Ordered</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {poItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.unit_of_measure || 'units'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.unit_price)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.quantity * item.unit_price)}
                        </td>
                      </tr>
                    ))}
                    {poItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          No items found in this purchase order
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Document Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Documentation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Invoice Upload */}
              <div className="space-y-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full flex items-center gap-2"
                  onClick={() => document.getElementById('invoice-upload')?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Upload Invoice
                </Button>
                <input
                  id="invoice-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('invoice', e.target.files[0])}
                />
                {uploadedFiles.invoice && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="truncate">{uploadedFiles.invoice.name}</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 p-0"
                      onClick={() => removeFile('invoice')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Delivery Note Upload */}
              <div className="space-y-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full flex items-center gap-2"
                  onClick={() => document.getElementById('delivery-note-upload')?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Upload Delivery Note
                </Button>
                <input
                  id="delivery-note-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('deliveryNote', e.target.files[0])}
                />
                {uploadedFiles.deliveryNote && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="truncate">{uploadedFiles.deliveryNote.name}</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 p-0"
                      onClick={() => removeFile('deliveryNote')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* QC Report Upload */}
              <div className="space-y-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full flex items-center gap-2"
                  onClick={() => document.getElementById('qc-report-upload')?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Upload QC Report
                </Button>
                <input
                  id="qc-report-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('qcReport', e.target.files[0])}
                />
                {uploadedFiles.qcReport && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="truncate">{uploadedFiles.qcReport.name}</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 p-0"
                      onClick={() => removeFile('qcReport')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Receiving Items 
          {receivingItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-lg font-semibold">Received Items</h3>
                {receivingItems.some((item) => item.has_discrepancy) && (
                  <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                    <AlertTriangle className="h-3 w-3" />
                    {receivingItems.filter((item) => item.has_discrepancy).length} Discrepancies
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                {receivingItems.map((item) => (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 space-y-4 ${
                      item.has_discrepancy ? 'border-red-300 bg-red-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{item.item_name}</h4>
                      {item.has_discrepancy && <Badge variant="destructive">Discrepancy</Badge>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Quantity Ordered</Label>
                        <Input
                          type="number"
                          value={item.quantity_ordered}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Quantity Received *</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.quantity_received}
                          onChange={(e) => updateReceivingItem(item.id, 'quantity_received', Number(e.target.value))}
                          readOnly={readOnly}
                          className={item.has_discrepancy ? 'border-red-300' : ''}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Unit of Measure</Label>
                        <Input
                          value={item.unit_of_measure}
                          onChange={(e) => updateReceivingItem(item.id, 'unit_of_measure', e.target.value)}
                          readOnly={readOnly}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Condition</Label>
                        <Select
                          value={item.condition}
                          onValueChange={(value) => updateReceivingItem(item.id, 'condition', value)}
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="damaged">Damaged</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Batch Number</Label>
                        <Input
                          value={item.batch_number}
                          onChange={(e) => updateReceivingItem(item.id, 'batch_number', e.target.value)}
                          readOnly={readOnly}
                          placeholder="Batch number"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Lot Number</Label>
                        <Input
                          value={item.lot_number}
                          onChange={(e) => updateReceivingItem(item.id, 'lot_number', e.target.value)}
                          readOnly={readOnly}
                          placeholder="Lot number"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Manufacture Date</Label>
                        <Input
                          type="date"
                          value={item.manufacture_date}
                          onChange={(e) => updateReceivingItem(item.id, 'manufacture_date', e.target.value)}
                          readOnly={readOnly}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Expiry Date</Label>
                        <Input
                          type="date"
                          value={item.expiry_date}
                          onChange={(e) => updateReceivingItem(item.id, 'expiry_date', e.target.value)}
                          readOnly={readOnly}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Storage Location</Label>
                        <Input
                          value={item.storage_location}
                          onChange={(e) => updateReceivingItem(item.id, 'storage_location', e.target.value)}
                          readOnly={readOnly}
                          placeholder="e.g., Room 1 Cabinet A"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Remarks</Label>
                        <Textarea
                          value={item.remarks}
                          onChange={(e) => updateReceivingItem(item.id, 'remarks', e.target.value)}
                          readOnly={readOnly}
                          placeholder="Special notes or observations"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}*/}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes/Comments</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              readOnly={readOnly}
              placeholder="Any special instructions or notes about this receipt..."
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {readOnly ? 'Close' : 'Cancel'}
            </Button>
            {!readOnly && (
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? 'Saving...' : (initialData ? 'Update Receipt' : 'Save Receipt')}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Main Component
const StockReceiving = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isItemsOpen, setIsItemsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<StockReceiving | null>(null);
  const [stockReceipts, setStockReceipts] = useState<StockReceiving[]>(mockStockReceivings);
  const [loading, setLoading] = useState(false);

  const getDocumentStatus = (receipt: StockReceiving) => {
    const docs = [];
    if (receipt.invoice_uploaded) docs.push('Invoice');
    if (receipt.delivery_note_uploaded) docs.push('Delivery Note');
    if (receipt.qc_report_uploaded) docs.push('QC Report');
    return docs;
  };

  const filteredReceipts = stockReceipts.filter((receipt) => {
    const matchesSearch = 
      receipt.stock_receiving_id.toString().includes(searchTerm.toLowerCase()) ||
      receipt.purchase_order?.supplier?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.purchase_order_id.toString().includes(searchTerm.toLowerCase()) ||
      receipt.received_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.suppliers?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleViewReceipt = (receipt: StockReceiving) => {
    setSelectedReceipt(receipt);
    setIsViewOpen(true);
  };

  const handleEditReceipt = (receipt: StockReceiving) => {
    setSelectedReceipt(receipt);
    setIsEditOpen(true);
  };
  
  const handleViewItems = (receipt: StockReceiving) => {
    setSelectedReceipt(receipt);
    setIsItemsOpen(true);
  };
  
  const handleDeleteReceipt = (receipt: StockReceiving) => {
    setSelectedReceipt(receipt);
    setIsDeleteDialogOpen(true);
  };
  
  const executeDelete = async () => {
    if (!selectedReceipt) return;
    
    setLoading(true);
    
    setTimeout(() => {
      setStockReceipts(prev => prev.filter(r => r.stock_receiving_id !== selectedReceipt.stock_receiving_id));
      setIsDeleteDialogOpen(false);
      setSelectedReceipt(null);
      setLoading(false);
    }, 1000);
  };

  const handleSuccess = () => {
    // In a real app, this would refetch data
    setStockReceipts([...stockReceipts]);
  };

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="max-w-7xl mx-auto pb-6 space-y-4 ">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900">Stock Receiving</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Receive inventory items with batch tracking and discrepancy management
            </p>
          </div>
          
          <Button 
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Receive Stock</span>
            <span className="sm:hidden">Add Stock</span>
          </Button>
        </div>

        {/* Search Section */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by receipt ID, supplier, PO, or receiver..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        
        {/* Receipts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredReceipts.map((receipt) => (
            <Card key={receipt.stock_receiving_id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg font-semibold truncate">
                      Receipt #{receipt.receipt_number || receipt.stock_receiving_id}
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs sm:text-sm">
                      <span className="truncate block">
                        {receipt.suppliers?.name || receipt.purchase_order?.supplier?.company_name || 'No supplier'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(receipt.received_date).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1 ml-2">
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      <CheckCircle className="h-2 w-2 mr-1" />
                      Received
                    </Badge>
                    {receipt.has_discrepancy && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-2 w-2 mr-1" />
                        Issues
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Receipt Details */}
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      PO Number:
                    </span>
                    <span className="font-medium">#{receipt.purchase_order_id}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Received By:
                    </span>
                    <span className="font-medium truncate max-w-24 sm:max-w-32" title={receipt.received_by}>
                      {receipt.received_by}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Package2 className="h-3 w-3" />
                      Items:
                    </span>
                    <span className="font-medium">{receipt.items_count || receipt.stock_receipt_items?.length || 0}</span>
                  </div>
                  
                  {receipt.purchase_order?.supplier && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        Contact:
                      </span>
                      <span className="font-medium text-xs truncate max-w-20 sm:max-w-28" 
                            title={receipt.purchase_order.supplier.contact_person}>
                        {receipt.purchase_order.supplier.contact_person}
                      </span>
                    </div>
                  )}
                </div>

                {/* Document Status */}
                <div className="space-y-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-600">Documentation:</span>
                  <div className="flex flex-wrap gap-1">
                    {getDocumentStatus(receipt).length > 0 ? (
                      getDocumentStatus(receipt).map((doc) => (
                        <Badge key={doc} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          <Upload className="h-2 w-2 mr-1" />
                          {doc}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="text-xs text-gray-500">
                        No documents
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-4 gap-1 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="p-2"
                    onClick={() => handleViewReceipt(receipt)}
                    title="View Receipt"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="p-2"
                    onClick={() => handleEditReceipt(receipt)}
                    title="Edit Receipt"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="p-2"
                    onClick={() => handleViewItems(receipt)}
                    title="View Items"
                  >
                    <Package className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="p-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteReceipt(receipt);
                    }}
                    title="Delete Receipt"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Notes */}
                {receipt.notes && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <strong>Notes:</strong> 
                    <span className="block sm:inline sm:ml-1">{receipt.notes}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredReceipts.length === 0 && (
          <Card className="text-center py-8 sm:py-12">
            <CardContent>
              <Truck className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                No stock receipts found
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">
                {searchTerm 
                  ? "Try adjusting your search terms"
                  : "Get started by receiving your first stock delivery"
                }
              </p>
              {!searchTerm && (
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setIsAddOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Receive First Stock
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
  <AlertDialogContent className="mx-4 max-w-md">
    <AlertDialogHeader>
      <AlertDialogTitle className="text-red-600 flex items-center text-base sm:text-lg">
        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
        Delete Stock Receipt
      </AlertDialogTitle>
      <AlertDialogDescription className="pt-3 text-sm">
        {selectedReceipt && (
          <>
            <p className="mb-4">Are you sure you want to delete this stock receipt?</p>
            <div className="bg-gray-50 p-3 rounded-md mb-4 border-l-4 border-red-400">
              <p className="font-medium">
                Receipt #{selectedReceipt.receipt_number || selectedReceipt.stock_receiving_id}
              </p>
              <p className="text-sm text-gray-600">
                Supplier: {selectedReceipt.suppliers?.name || selectedReceipt.purchase_order?.supplier?.company_name || 'Unknown'}
              </p>
              <p className="text-sm text-gray-600">
                Date: {new Date(selectedReceipt.received_date).toLocaleDateString()}
              </p>
            </div>
            <p className="text-red-500 text-sm">
              This will permanently delete the receipt and all its items. This action cannot be undone.
            </p>
          </>
        )}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
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


        {/* Modal Components */}
        <StockReceivingForm
          suppliers={mockSuppliers}
          purchaseOrders={mockPurchaseOrders}
          onSuccess={handleSuccess}
          isOpen={isAddOpen}
          onOpenChange={setIsAddOpen}
        />
        
        <StockReceivingView
          receipt={selectedReceipt}
          isOpen={isViewOpen}
          onOpenChange={setIsViewOpen}
        />
        
        <StockReceivingForm
          suppliers={mockSuppliers}
          purchaseOrders={mockPurchaseOrders}
          onSuccess={handleSuccess}
          isOpen={isEditOpen}
          onOpenChange={setIsEditOpen}
          initialData={selectedReceipt}
        />
        
        <StockItemsView
          receipt={selectedReceipt}
          isOpen={isItemsOpen}
          onOpenChange={setIsItemsOpen}
        />
      </div>
    </div>
  );
}

export default StockReceiving;