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
  DollarSign
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
  id: number;
  action: string;
  item_name: string;
  quantity: string;
  user_name: string;
  created_at: string;
  time_ago: string;
}

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);

  const [itemCount, setItemCount] = useState(0);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [expiringSoonItems, setExpiringSoonItems] = useState<ExpiringItem[]>([]);

  const [loadingItemCount, setLoadingItemCount] = useState(false);
  const [loadingInventoryValue, setLoadingInventoryValue] = useState(false);
  const [loadingLowStockItems, setLoadingLowStockItems] = useState(false);
  const [loadingExpiringSoonItems, setLoadingExpiringSoonItems] = useState(false);

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
    fetchLowStockItems();
    fetchExpiringSoonItems();
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
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-6">
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
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">{loadingInventoryValue ? "Loading..." : `Rs. ${inventoryValue}`}</p>
                </div>
                <div className="bg-green-50 p-2 lg:p-3 rounded-lg flex-shrink-0 ml-4">
                  <DollarSign className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
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

        {/* Recent Activity - Full Width 
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Clock className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                <span className="truncate">Recent Activity</span>
              </CardTitle>
            </div>
            <CardDescription>Latest inventory transactions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                        <span className="font-medium text-gray-900">{activity.action}</span>
                        <Badge variant="outline" className="text-xs w-fit">
                          {activity.item_name}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-sm text-gray-600">
                        <span>{activity.quantity}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{activity.time_ago}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>by {activity.user_name}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>*/}
      </div>
    </div>
  );
};

export default Dashboard;