"use client"
import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Search,
  Bell,
  Plus,
  Archive,
  Clock,
  Menu,
  X,
  DollarSign,
  FileText,
  Hammer,
  Users
} from 'lucide-react';
import { AuthContext } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Types based on your schema
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
  sub_category_id: number | null;
  supplier_id: number | null;
  batch_tracking: boolean;
  current_stock: number;
  minimum_stock: number;
  expiry_date?: string;
  sub_category?: SubCategory;
  supplier?: Supplier;
}

interface LowStockItem {
  item: {
    item_id: number;
    item_name: string;
    unit_of_measurements: string;
    unit_price: number;
    storage_location: string;
    barcode: string;
    expiry_alert_days: number;
    description: string;
    sub_category_id: number | null;
    supplier_id: number | null;
    batch_tracking: boolean;
    sub_category?: SubCategory;
    supplier?: Supplier;
  };
  batches: {
    batch_id: number;
    item_id: number;
    current_stock: number;
    minimum_stock: number;
    expiry_date: string;
    stock_date: string;
  }[];
}

interface ExpiringItem {
  item: {
    item_id: number;
    item_name: string;
    unit_of_measurements: string;
    unit_price: number;
    storage_location: string;
    barcode: string;
    expiry_alert_days: number;
    description: string;
    sub_category_id: number | null;
    supplier_id: number | null;
    batch_tracking: boolean;
  };
  batches: {
    batch_id: number;
    item_id: number;
    current_stock: number;
    minimum_stock: number;
    expiry_date: string;
    stock_date: string;
  }[];
}

interface ActivityLog {
  activity_log_id: number;
  subject: string;
  event: string;
  date: string;
  time: string;
}

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);

  const [itemCount, setItemCount] = useState(0);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [purchaseOrders, setPurchaseOrders] = useState(0);
  const [equipments, setEquipments] = useState(0);
  const [suppliers, setSuppliers] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [expiringSoonItems, setExpiringSoonItems] = useState<ExpiringItem[]>([]);

  const [loadingItemCount, setLoadingItemCount] = useState(false);
  const [loadingInventoryValue, setLoadingInventoryValue] = useState(false);
  const [loadingPurchaseOrders, setLoadingPurchaseOrders] = useState(false);
  const [loadingEquipments, setLoadingEquipments] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingLowStockItems, setLoadingLowStockItems] = useState(false);
  const [loadingExpiringSoonItems, setLoadingExpiringSoonItems] = useState(false);
  const [loadingRecentActivity, setLoadingRecentActivity] = useState(false);

  const { isLoadingAuth, isLoggedIn, apiClient, user } = useContext(AuthContext);
  const router = useRouter();

  const fetchItemCount = async () => {
    setLoadingItemCount(true);
    try {
      const response = await apiClient.get(
        `/inventory/items/count`
      );
      if (response.status == 500) {
        throw new Error("Error fetching item count");
      }
      setItemCount(response.data);


    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setLoadingItemCount(false);
    }
  };

  const fetchInventoryValue = async () => {
    setLoadingInventoryValue(true);
    try {
      const response = await apiClient.get(
        `/inventory/items/total-value`
      );
      if (response.status == 500) {
        throw new Error("Error fetching inventory value");
      }
      setInventoryValue(response.data);
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setLoadingInventoryValue(false);
    }
  };

  const fetchPurchaseOrderCount = async () => {
    setLoadingPurchaseOrders(true);
    try {
      const res = await apiClient.get(
        `/inventory/purchase-orders/count`
      );
      if (res.status == 500) {
        throw new Error("Error fetching purchase order count");
      }
      setPurchaseOrders(res.data);
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setLoadingPurchaseOrders(false);
    }
  };

  const fetchEquipmentCount = async () => {
    setLoadingEquipments(true);
    try {
      const response = await apiClient.get(
        `/inventory/equipments/count`
      );
      if (response.status == 500) {
        throw new Error("Error fetching equipment count");
      }
      setEquipments(response.data);
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setLoadingEquipments(false);
    }
  };

  const fetchSuppliersCount = async () => {
    setLoadingSuppliers(true);
    try {
      const response = await apiClient.get(
        `/inventory/suppliers/count`
      );
      if (response.status == 500) {
        throw new Error("Error fetching suppliers count");
      }
      setSuppliers(response.data);
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setLoadingSuppliers(false);
    }
  }

  const fetchLowStockItems = async () => {
    setLoadingLowStockItems(true);
    try {
      const response = await apiClient.get(
        `/inventory/items/low-stock`
      );
      if (response.status == 500) {
        throw new Error("Error fetching low stock items");
      }
      setLowStockItems(response.data);
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setLoadingLowStockItems(false);
    }
  };

  const fetchExpiringSoonItems = async () => {
    setLoadingExpiringSoonItems(true);
    try {
      const response = await apiClient.get(
        `/inventory/items/expiring-soon`
      );
      if (response.status == 500) {
        throw new Error("Error fetching expiring soon items");
      }
      setExpiringSoonItems(response.data);
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setLoadingExpiringSoonItems(false);
    }
  };

  const fetchActivityLogs = async () => {
    setLoadingRecentActivity(true);
    try {
      const res = await apiClient.get(
        `/inventory/activity-log/recent`
      );
      if (res.status == 500) {
        throw new Error("Error Fetching Recent Activity");
      }
      setRecentActivity(res.data);
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setLoadingRecentActivity(false);
    }
  }

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isLoggedIn) {
      toast.error("Please Log in");
      router.push("/");
    }
    else if (user.role != 'admin') {
      toast.error("Access Denied");
      router.push("/");
    }
  }, [isLoadingAuth]);

  useEffect(() => {
    fetchItemCount();
    fetchInventoryValue();
    fetchPurchaseOrderCount();
    fetchEquipmentCount();
    fetchSuppliersCount();
    fetchLowStockItems();
    fetchExpiringSoonItems();
    fetchActivityLogs();
  }, []);

  const getDaysLeft = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pb-6 space-y-6">
        {/* Stats Cards - Using unique ID as key */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
          {/* Total Items Card */}
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 truncate">Total Items</p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">{loadingItemCount ? "Loading..." : itemCount}</p>
                </div>
                <div className="bg-blue-50 p-2 lg:p-3 rounded-lg flex-shrink-0 ml-4">
                  <Package className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Value Card */}
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 truncate">Inventory Value</p>
                  <p className="text-xl lg:text-xl font-bold text-gray-900 mt-1">{loadingInventoryValue ? "Loading..." : `Rs. ${inventoryValue}`}</p>
                </div>
                <div className="bg-green-50 p-2 lg:p-3 rounded-lg flex-shrink-0 ml-4">
                  <DollarSign className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/*Purchase Orders Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Purchase Orders</p>
                  <p className="text-2xl font-bold text-dental-dark">{loadingPurchaseOrders ? "Loading..." : purchaseOrders}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/*Equipments Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Equipments</p>
                  <p className="text-2xl font-bold text-dental-dark">{loadingEquipments ? "Loading..." : equipments}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <Hammer className='h-6 w-6 text-emerald-600' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/*Suppliers Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Suppliers</p>
                  <p className="text-2xl font-bold text-dental-dark">{loadingSuppliers ? "Loading" : suppliers}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid - Responsive */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Low Stock Alerts */}
          <Card className="hover:shadow-md transition-shadow duration-200 overflow-auto">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                  <span className="truncate">Low Stock Alerts</span>
                </CardTitle>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 flex-shrink-0">
                  {/* Count total low-stock batches */}
                  {lowStockItems.reduce((acc, item) => acc + item.batches.length, 0)}
                </Badge>
              </div>
              <CardDescription>Items that need restocking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {loadingLowStockItems ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="h-12 w-12 mx-auto mb-4 animate-spin border-4 border-gray-300 border-t-transparent rounded-full" />
                  <p>Loading low stock items...</p>
                </div>
              ) : lowStockItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No low stock items</p>
                </div>
              ) : (
                lowStockItems.map(({ item, batches }) =>
                  batches.map(batch => {
                    const stockPercent = Math.min((batch.current_stock / batch.minimum_stock) * 100, 100);
                    return (
                      <div
                        key={batch.batch_id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.item_name}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 space-y-1 sm:space-y-0">
                            <span className="text-sm text-gray-600">
                              Batch ID: {batch.batch_id}
                            </span>
                            <span className="text-sm text-gray-600">
                              Current: {batch.current_stock} {item.unit_of_measurements}
                            </span>
                            <span className="text-sm text-gray-600">
                              Min: {batch.minimum_stock} {item.unit_of_measurements}
                            </span>
                          </div>
                          <Progress
                            value={stockPercent}
                            className="mt-2 h-2"
                          />
                        </div>
                        <Badge
                          variant={batch.current_stock === 0 ? 'destructive' : 'secondary'}
                          className={`ml-4 flex-shrink-0 ${batch.current_stock === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}
                        >
                          {batch.current_stock === 0 ? 'Critical' : 'Low'}
                        </Badge>
                      </div>
                    );
                  })
                )
              )}
            </CardContent>
          </Card>

          {/* Expiring Items */}
          <Card className="hover:shadow-md transition-shadow duration-200 overflow-auto">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Calendar className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                  <span className="truncate">Expiring Soon</span>
                </CardTitle>
                <Badge variant="secondary" className="bg-red-100 text-red-800 flex-shrink-0">
                  {expiringSoonItems.reduce((count, item) => count + item.batches.length, 0)}
                </Badge>
              </div>
              <CardDescription>Items expiring within alert period</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {loadingExpiringSoonItems ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin mx-auto h-8 w-8 border-4 border-red-300 border-t-transparent rounded-full" />
                  <p className="mt-4">Loading expiring items...</p>
                </div>
              ) : expiringSoonItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No items expiring soon</p>
                </div>
              ) : (
                expiringSoonItems.map(({ item, batches }) =>
                  batches.map((batch) => {
                    const daysLeft = getDaysLeft(batch.expiry_date);
                    return (
                      <div key={batch.batch_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.item_name}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 space-y-1 sm:space-y-0">
                            <span className="text-sm text-gray-600">Batch ID: {batch.batch_id}</span>
                            <span className="text-sm text-gray-600">
                              Expires: {new Date(batch.expiry_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant={daysLeft <= 15 ? 'destructive' : 'secondary'}
                          className={`ml-4 flex-shrink-0 ${daysLeft <= 15 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}
                        >
                          {daysLeft} days
                        </Badge>
                      </div>
                    );
                  })
                )
              )}
            </CardContent>
          </Card>
        </div>
        {/* Recent Activity */}
        <Card className="hover:shadow-md transition-shadow duration-200 overflow-auto">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Clock className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                <span className="truncate">Recent Activities</span>
              </CardTitle>
            </div>
            <CardDescription>System logs and updates</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activities</p>
              </div>
            ) : (
              recentActivity.map((log) => (
                <div
                  key={log.activity_log_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">
                      <span className="capitalize font-medium">{log.event == "create" && `A new `}{log.subject}</span> was
                      <span className="ml-1 font-semibold text-blue-700">{log.event.endsWith("e") ? `${log.event}d` : `${log.event}ed`}</span>
                      {" on"} <span className="font-medium">{log.date}</span> at <span className="font-medium">
                        {log.time.split(":").slice(0, 2).join(":")}
                      </span>
                      .
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Dashboard;