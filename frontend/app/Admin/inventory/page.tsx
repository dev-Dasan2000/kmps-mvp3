"use client"
import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';

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

interface ActivityLog {
  id: number;
  action: string;
  item_name: string;
  quantity: string;
  user_name: string;
  created_at: string;
  time_ago: string;
}

interface StatCard {
  id: string; // Added unique identifier
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<Item[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Item[]>([]);
  const [expiringItems, setExpiringItems] = useState<Item[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);

  // Mock data generation
  const generateMockData = () => {
    const mockItems: Item[] = [
      {
        item_id: 1,
        item_name: "Nitrile Examination Gloves",
        unit_of_measurements: "Box of 100",
        unit_price: 1250.5,
        storage_location: "Shelf A2",
        barcode: "8901234567890",
        expiry_alert_days: 30,
        description: "Disposable non-sterile gloves for general examination use",
        sub_category_id: 1,
        supplier_id: 1,
        batch_tracking: true,
        current_stock: 5,
        minimum_stock: 10,
        expiry_date: '2025-08-15',
        sub_category: {
          sub_category_id: 1,
          sub_category_name: "Gloves",
          description: "Disposable gloves used during procedures",
          parent_category_id: 1
        },
        supplier: {
          supplier_id: 1,
          company_name: "DentalSupplies Inc.",
          contact_person: "Dr. Samantha Lee",
          email: "samantha@dentalsupplies.com",
          phone_number: "+1-555-234-5678",
          address: "456 Tooth Ave",
          city: "Colombo",
          state: "Western Province",
          postal_code: "10100",
          country: "Sri Lanka",
          website: "https://www.dentalsupplies.com",
          notes: "Primary supplier for surgical items",
          status: "active"
        }
      },
      {
        item_id: 2,
        item_name: "Dental Composite Resin",
        unit_of_measurements: "Tubes",
        unit_price: 2850.75,
        storage_location: "Cabinet A-1",
        barcode: "8901234567891",
        expiry_alert_days: 45,
        description: "Premium composite resin for dental restorations",
        sub_category_id: 2,
        supplier_id: 2,
        batch_tracking: true,
        current_stock: 12,
        minimum_stock: 8,
        expiry_date: '2025-09-20',
        sub_category: {
          sub_category_id: 2,
          sub_category_name: "Restorative Materials",
          description: "Materials used for dental restorations",
          parent_category_id: 2
        },
        supplier: {
          supplier_id: 2,
          company_name: "MedDental Solutions",
          contact_person: "Mr. Rajesh Kumar",
          email: "rajesh@meddental.lk",
          phone_number: "+94-11-234-5678",
          address: "123 Medical Street",
          city: "Kandy",
          state: "Central Province",
          postal_code: "20000",
          country: "Sri Lanka",
          website: "https://www.meddental.lk",
          notes: "Reliable supplier for restorative materials",
          status: "active"
        }
      },
      {
        item_id: 3,
        item_name: "Local Anesthetic (Lidocaine 2%)",
        unit_of_measurements: "Vials",
        unit_price: 450.25,
        storage_location: "Refrigerator Unit",
        barcode: "8901234567892",
        expiry_alert_days: 15,
        description: "2% Lidocaine with epinephrine for local anesthesia",
        sub_category_id: 3,
        supplier_id: 1,
        batch_tracking: true,
        current_stock: 3,
        minimum_stock: 12,
        expiry_date: '2025-08-30',
        sub_category: {
          sub_category_id: 3,
          sub_category_name: "Anesthetics",
          description: "Local and topical anesthetic agents",
          parent_category_id: 3
        },
        supplier: {
          supplier_id: 1,
          company_name: "DentalSupplies Inc.",
          contact_person: "Dr. Samantha Lee",
          email: "samantha@dentalsupplies.com",
          phone_number: "+1-555-234-5678",
          address: "456 Tooth Ave",
          city: "Colombo",
          state: "Western Province",
          postal_code: "10100",
          country: "Sri Lanka",
          website: "https://www.dentalsupplies.com",
          notes: "Primary supplier for surgical items",
          status: "active"
        }
      },
      {
        item_id: 4,
        item_name: "Dental Burs Set",
        unit_of_measurements: "Sets",
        unit_price: 3500.00,
        storage_location: "Tool Cabinet",
        barcode: "8901234567893",
        expiry_alert_days: 0,
        description: "High-speed carbide burs for various procedures",
        sub_category_id: 4,
        supplier_id: 3,
        batch_tracking: false,
        current_stock: 8,
        minimum_stock: 5,
        sub_category: {
          sub_category_id: 4,
          sub_category_name: "Instruments",
          description: "Dental instruments and tools",
          parent_category_id: 4
        },
        supplier: {
          supplier_id: 3,
          company_name: "Precision Dental Tools Ltd.",
          contact_person: "Ms. Priya Fernando",
          email: "priya@precisiontools.lk",
          phone_number: "+94-81-234-5678",
          address: "789 Industrial Zone",
          city: "Galle",
          state: "Southern Province",
          postal_code: "80000",
          country: "Sri Lanka",
          website: "https://www.precisiontools.lk",
          notes: "Specialized in high-quality dental instruments",
          status: "active"
        }
      },
      {
        item_id: 5,
        item_name: "Impression Material (Alginate)",
        unit_of_measurements: "Packets",
        unit_price: 1890.50,
        storage_location: "Cabinet A-2",
        barcode: "8901234567894",
        expiry_alert_days: 60,
        description: "Fast-setting alginate impression material",
        sub_category_id: 5,
        supplier_id: 2,
        batch_tracking: true,
        current_stock: 2,
        minimum_stock: 8,
        expiry_date: '2025-09-10',
        sub_category: {
          sub_category_id: 5,
          sub_category_name: "Impression Materials",
          description: "Materials for taking dental impressions",
          parent_category_id: 2
        },
        supplier: {
          supplier_id: 2,
          company_name: "MedDental Solutions",
          contact_person: "Mr. Rajesh Kumar",
          email: "rajesh@meddental.lk",
          phone_number: "+94-11-234-5678",
          address: "123 Medical Street",
          city: "Kandy",
          state: "Central Province",
          postal_code: "20000",
          country: "Sri Lanka",
          website: "https://www.meddental.lk",
          notes: "Reliable supplier for restorative materials",
          status: "active"
        }
      },
      {
        item_id: 6,
        item_name: "Orthodontic Archwire",
        unit_of_measurements: "Spools",
        unit_price: 2250.00,
        storage_location: "Ortho Cabinet",
        barcode: "8901234567895",
        expiry_alert_days: 0,
        description: "Nickel-titanium orthodontic archwire - 0.016 inch",
        sub_category_id: 6,
        supplier_id: 3,
        batch_tracking: false,
        current_stock: 12,
        minimum_stock: 6,
        sub_category: {
          sub_category_id: 6,
          sub_category_name: "Orthodontics",
          description: "Orthodontic treatment materials and appliances",
          parent_category_id: 5
        },
        supplier: {
          supplier_id: 3,
          company_name: "Precision Dental Tools Ltd.",
          contact_person: "Ms. Priya Fernando",
          email: "priya@precisiontools.lk",
          phone_number: "+94-81-234-5678",
          address: "789 Industrial Zone",
          city: "Galle",
          state: "Southern Province",
          postal_code: "80000",
          country: "Sri Lanka",
          website: "https://www.precisiontools.lk",
          notes: "Specialized in high-quality dental instruments",
          status: "active"
        }
      }
    ];

      const mockActivity: ActivityLog[] = [
        {
          id: 1,
          action: 'Stock Added',
          item_name: 'Nitrile Examination Gloves',
          quantity: '10 boxes',
          user_name: 'Dr. Smith',
          created_at: '2025-07-28T08:30:00Z',
          time_ago: '2 hours ago'
        },
        {
          id: 2,
          action: 'Stock Used',
          item_name: 'Local Anesthetic (Lidocaine 2%)',
          quantity: '3 vials',
          user_name: 'Nurse Johnson',
          created_at: '2025-07-27T14:15:00Z',
          time_ago: '1 day ago'
        },
        {
          id: 3,
          action: 'New Item Added',
          item_name: 'Dental Composite Resin',
          quantity: '5 tubes',
          user_name: 'Admin',
          created_at: '2025-07-26T10:00:00Z',
          time_ago: '2 days ago'
        },
        {
          id: 4,
          action: 'Stock Alert',
          item_name: 'Impression Material (Alginate)',
          quantity: 'Low Stock Warning',
          user_name: 'System',
          created_at: '2025-07-25T16:45:00Z',
          time_ago: '3 days ago'
        },
        {
          id: 5,
          action: 'Batch Updated',
          item_name: 'Orthodontic Archwire',
          quantity: '5 spools',
          user_name: 'Dr. Wilson',
          created_at: '2025-07-24T11:20:00Z',
          time_ago: '4 days ago'
        }
      ];

    return { mockItems, mockActivity };
  };

  // Define initial stats with unique IDs
  const initialStats: StatCard[] = [
    {
      id: 'total-items',
      title: 'Total Items',
      value: '0',
      change: 'Loading...',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'inventory-value',
      title: 'Inventory Value',
      value: 'LKR 0',
      change: 'Loading...',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  const [dashboardStats, setDashboardStats] = useState<StatCard[]>(initialStats);

  useEffect(() => {
    // Simulate loading delay
    setTimeout(() => {
      const { mockItems, mockActivity } = generateMockData();
      
      setInventoryItems(mockItems);
      setRecentActivity(mockActivity);

      // Calculate low stock items
      const lowStock = mockItems
        .filter(item => item.current_stock <= item.minimum_stock)
        .sort((a, b) => (a.current_stock / a.minimum_stock) - (b.current_stock / b.minimum_stock))
        .slice(0, 5);
      setLowStockItems(lowStock);

      // Calculate expiring items
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const expiring = mockItems
        .filter(item => {
          if (!item.expiry_date) return false;
          const expiryDate = new Date(item.expiry_date);
          return expiryDate <= thirtyDaysFromNow && expiryDate >= today;
        })
        .sort((a, b) => {
          const aDate = new Date(a.expiry_date!);
          const bDate = new Date(b.expiry_date!);
          return aDate.getTime() - bDate.getTime();
        })
        .slice(0, 3);
      setExpiringItems(expiring);

      // Update stats with calculated values
      const totalValue = mockItems.reduce((sum, item) => sum + (item.unit_price * item.current_stock), 0);
      
      setDashboardStats([
        {
          id: 'total-items',
          title: 'Total Items',
          value: mockItems.length.toString(),
          change: `${mockItems.length} total items`,
          icon: Package,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        },
        
        {
          id: 'inventory-value',
          title: 'Inventory Value',
          value: `LKR ${Math.round(totalValue).toLocaleString()}`,
          change: 'Current inventory value',
          icon: TrendingUp,
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        }
      ]);
      
      setLoading(false);
    }, 1000);
  }, []);

  const getDaysLeft = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pb-6 space-y-6">
        {/* Stats Cards - Using unique ID as key */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-6">
          {dashboardStats.map((stat) => (
            <Card key={stat.id} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                    <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs lg:text-sm text-gray-500 mt-1 truncate">{stat.change}</p>
                  </div>
                  <div className={`${stat.bgColor} p-2 lg:p-3 rounded-lg flex-shrink-0 ml-4`}>
                    <stat.icon className={`h-5 w-5 lg:h-6 lg:w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid - Responsive */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Low Stock Alerts */}
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                  <span className="truncate">Low Stock Alerts</span>
                </CardTitle>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 flex-shrink-0">
                  {lowStockItems.length}
                </Badge>
              </div>
              <CardDescription>Items that need restocking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {lowStockItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No low stock items</p>
                </div>
              ) : (
                lowStockItems.map((item) => (
                  <div key={item.item_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.item_name}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 space-y-1 sm:space-y-0">
                        <span className="text-sm text-gray-600">
                          Current: {item.current_stock} {item.unit_of_measurements}
                        </span>
                        <span className="text-sm text-gray-600">
                          Min: {item.minimum_stock} {item.unit_of_measurements}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((item.current_stock / item.minimum_stock) * 100, 100)} 
                        className="mt-2 h-2"
                      />
                    </div>
                    <Badge 
                      variant={item.current_stock === 0 ? 'destructive' : 'secondary'}
                      className={`ml-4 flex-shrink-0 ${item.current_stock === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}
                    >
                      {item.current_stock === 0 ? 'Critical' : 'Low'}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Expiring Items */}
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Calendar className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                  <span className="truncate">Expiring Soon</span>
                </CardTitle>
                <Badge variant="secondary" className="bg-red-100 text-red-800 flex-shrink-0">
                  {expiringItems.length}
                </Badge>
              </div>
              <CardDescription>Items expiring in the next 30 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {expiringItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No items expiring soon</p>
                </div>
              ) : (
                expiringItems.map((item) => {
                  const daysLeft = getDaysLeft(item.expiry_date!);
                  return (
                    <div key={item.item_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.item_name}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 space-y-1 sm:space-y-0">
                          <span className="text-sm text-gray-600">
                            Batch: {item.barcode}
                          </span>
                          <span className="text-sm text-gray-600">
                            Expires: {new Date(item.expiry_date!).toLocaleDateString()}
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity - Full Width */}
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
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;