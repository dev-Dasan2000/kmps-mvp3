"use client";
import React, { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PurchaseOrderForm } from "@/components/purchesorderform";
import { AuthContext } from "@/context/auth-context";
import { useRouter } from "next/navigation";

import {
  Plus,
  Search,
  FileText,
  Edit,
  Eye,
  Truck,
  Calendar,
  DollarSign,
  Package,
  User,
  MapPin,
  Building2,
  Phone,
  Mail
} from "lucide-react";
import { toast } from "sonner";

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

  total_amount: number;
  supplier?: Supplier;
  payment_term?: PaymentTerm;
  shipping_method?: ShippingMethod;
  purchase_order_items: PurchaseOrderItem[];
}

interface PaymentTerm {
  payment_term_id: number;
  payment_term: string;
}

interface ShippingMethod {
  shipping_method_id: number;
  shipping_method: string;
}

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

const PurchaseOrdersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const { isLoadingAuth, isLoggedIn, user, apiClient } = useContext(AuthContext);
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const supplierRes = await apiClient.get(
        `/inventory/suppliers`
      );
      if (supplierRes.status == 500) {
        throw new Error("Error Fetching Suppliers");
      }
      setSuppliers(supplierRes.data);

      const itemsRes = await apiClient.get(
        `/inventory/items`
      );
      if (itemsRes.status == 500) {
        throw new Error("Error Fetching Items");
      }
      setItems(itemsRes.data);

      const paymentTermsRes = await apiClient.get(
        `/inventory/payment-terms`
      );
      if (paymentTermsRes.status == 500) {
        throw new Error("Error Fetching Payment Terms");
      }
      setPaymentTerms(paymentTermsRes.data);

      const shippingMethodsRes = await apiClient.get(
        `/inventory/shipping-methods`
      );
      if (shippingMethodsRes.status == 500) {
        throw new Error("Error Fetching Shipping Methods");
      }
      setShippingMethods(shippingMethodsRes.data);

      const parentCatRes = await apiClient.get(
        `/inventory/parent-categories`
      );
      if (parentCatRes.status == 500) {
        throw new Error("Error Fetching Parent Categories");
      }
      setParentCategories(parentCatRes.data);

      const subCatRes = await apiClient.get(
        `/inventory/sub-categories`
      );
      if (subCatRes.status == 500) {
        throw new Error("Error Fetching Sub Categories");
      }
      setSubCategories(subCatRes.data);

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const purchaseOrderRes = await apiClient.get(
        `/inventory/purchase-orders`
      );
      if (purchaseOrderRes.status == 500) {
        throw new Error("Error Fetching Purchase Orders");
      }
      setPurchaseOrders(purchaseOrderRes.data);
    }
    catch (err: any) {
      toast.error(err.message);
    }
  }

  useEffect(() => {
    fetchData();
    fetchPurchaseOrders();
  }, []);

  const filteredOrders = purchaseOrders.filter((order) => {
    return (
      order.purchase_order_id.toString().includes(searchTerm.toLowerCase()) ||
      order.supplier?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.requested_by?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isLoggedIn) {
      toast.error("Please Log in");
      router.push("/");
    }
    else if (user.role != "admin") {
      toast.error("Access Denied");
      router.push("/");
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading purchase orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container pb-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Purchase Orders</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage purchase orders and procurement workflow</p>
          </div>

          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white self-start sm:self-auto"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Create Purchase Order</span>
            <span className="sm:hidden">Create PO</span>
          </Button>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by PO ID, supplier, or requested by..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Purchase Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No purchase orders found</h3>
                <p className="text-gray-600">Try adjusting your search criteria or create a new purchase order.</p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.purchase_order_id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <h3 className="text-lg font-semibold">PO #{order.purchase_order_id}</h3>

                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPurchaseOrder(order);
                            setIsViewOpen(true);
                          }}
                          className="text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>

                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center text-gray-600">
                        <User className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">By: {order.requested_by}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>Date: {new Date(order.order_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{order.supplier?.company_name}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>LKR {order.total_amount?.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Mobile-specific additional info */}
                    <div className="sm:hidden space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Expected: {new Date(order.expected_delivery_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{order.delivery_address}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* View Purchase Order Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Purchase Order #{selectedPurchaseOrder?.purchase_order_id}</DialogTitle>
            </DialogHeader>
            {selectedPurchaseOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Order Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <Label className="font-medium">Requested By</Label>
                        <p className="mt-1 text-gray-700">{selectedPurchaseOrder.requested_by}</p>
                      </div>
                      <div>
                        <Label className="font-medium">Order Date</Label>
                        <p className="mt-1 text-gray-700">{new Date(selectedPurchaseOrder.order_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="font-medium">Expected Delivery</Label>
                        <p className="mt-1 text-gray-700">{new Date(selectedPurchaseOrder.expected_delivery_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="font-medium">Total Amount</Label>
                        <p className="mt-1 text-gray-700 font-semibold">LKR {selectedPurchaseOrder.total_amount?.toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Supplier Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <Label className="font-medium">Company</Label>
                        <p className="mt-1 text-gray-700">{selectedPurchaseOrder.supplier?.company_name}</p>
                      </div>
                      <div>
                        <Label className="font-medium">Contact Person</Label>
                        <p className="mt-1 text-gray-700">{selectedPurchaseOrder.supplier?.contact_person}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">{selectedPurchaseOrder.supplier?.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">{selectedPurchaseOrder.supplier?.phone_number}</span>
                      </div>
                      <div>
                        <Label className="font-medium">Address</Label>
                        <p className="mt-1 text-gray-700">
                          {selectedPurchaseOrder.supplier?.address}, {selectedPurchaseOrder.supplier?.city}, {selectedPurchaseOrder.supplier?.state}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Delivery & Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <Label className="font-medium">Delivery Address</Label>
                      <p className="mt-1 text-gray-700">{selectedPurchaseOrder.delivery_address}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Notes</Label>
                      <p className="mt-1 text-gray-700">{selectedPurchaseOrder.notes || 'No notes'}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Authorized By</Label>
                      <p className="mt-1 text-gray-700">{selectedPurchaseOrder.authorized_by}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Purchase Order Form */}
        <PurchaseOrderForm
          isOpen={isAddOpen}
          onOpenChange={setIsAddOpen}
          onSuccess={(data: Omit<PurchaseOrder, 'purchase_order_id'>) => {
            fetchPurchaseOrders();
            setIsAddOpen(false);
          }}
          suppliers={suppliers}
          items={items}
          parentCategories={parentCategories}
          subCategories={subCategories}
          paymentTerms={paymentTerms}
          shippingMethods={shippingMethods}
        />
      </div>
    </div>
  );
};

export default PurchaseOrdersPage;