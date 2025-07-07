"use client";
import React, { useState, useEffect } from 'react';
import { 
  Package, 
  CheckCircle, 
  AlertCircle, 
  Archive, 
  Eye, 
  Clock, 
  User, 
  MapPin,
  FileText as FileTextIcon,
  File as FileIcon,
  ExternalLink as ExternalLinkIcon,
  Calendar as CalendarIcon,
  ListChecks as ListChecksIcon,
  Building as BuildingIcon,
  ClipboardList as ClipboardListIcon
} from 'lucide-react';

// TypeScript interfaces based on database schema
interface Lab {
  lab_id: string;
  name: string;
  password: string;
  contact_person: string;
  contact_number: string;
  email: string;
  address: string;
  specialties: string;
}

interface WorkType {
  work_type_id: number;
  work_type: string;
}

interface ShadeType {
  shade_type_id: number;
  shade: string;
}

interface MaterialType {
  material_id: number;
  material: string;
}

interface OrderFile {
  file_id: number;
  url: string;
  order_id: number;
}

interface Stage {
  stage_id: number;
  name: string;
}

interface StageAssign {
  stage_assign_id: number;
  stage_id: number;
  order_id: number;
  completed: boolean;
  date: string; // ISO timestamp string
}

interface Order {
  order_id: number;
  patient_id: string;
  dentist_id: string;
  lab_id: string;
  work_type_id: number;
  due_date: string; // ISO date string
  file_types: string;
  shade_type_id: number;
  material_id: number;
  priority: 'high' | 'medium' | 'low';
  special_instructions: string;
  status: '1' | '2' | '3'; // 1: Active, 2: Completed, 3: Overdue
  lab: Lab;
  work_type: WorkType;
  shade_type: ShadeType;
  material_type: MaterialType;
  order_files: OrderFile[];
  stage_assign: StageAssign[];
}

// API Response interface for backend integration
interface OrdersApiResponse {
  success: boolean;
  data: Order[];
  message?: string;
}

// Statistics interface
interface OrderStats {
  active: number;
  completed: number;
  overdue: number;
  total: number;
}

// Component Props interface
interface OrderManagementDashboardProps {
  initialOrders?: Order[];
  onOrderUpdate?: (orderId: number, updates: Partial<Order>) => void;
  onOrderDelete?: (orderId: number) => void;
}

const OrderManagementDashboard: React.FC<OrderManagementDashboardProps> = ({
  initialOrders = [],
  onOrderUpdate,
  onOrderDelete
}) => {
  // Mock data based on the new API response format
  const [orders, setOrders] = useState<Order[]>(initialOrders.length > 0 ? initialOrders : [
    {
      "order_id": 1,
      "patient_id": "P001",
      "dentist_id": "knrsdent001",
      "lab_id": "knrslab001",
      "work_type_id": 1,
      "due_date": "2025-07-07T00:00:00.000Z",
      "file_types": "sadf, asgfsa",
      "shade_type_id": 1,
      "material_id": 1,
      "priority": "high",
      "special_instructions": "non at the time",
      "status": "1",
      "lab": {
        "lab_id": "knrslab001",
        "name": "knrstestlab",
        "password": "$2b$10$MCkLZFcPCV17AGT7W8SbhOOO4SQQb70S2E9Q6AxOkV7lr2M48d5A2",
        "contact_person": "naveen",
        "contact_number": "0412292673",
        "email": "naveensandaru2@gmail.com",
        "address": "no 102",
        "specialties": "sadfgasdg, sadgasgdasd"
      },
      "work_type": {
        "work_type_id": 1,
        "work_type": "Test01"
      },
      "shade_type": {
        "shade_type_id": 1,
        "shade": "black"
      },
      "material_type": {
        "material_id": 1,
        "material": "test01"
      },
      "order_files": [],
      "stage_assign": []
    },
    {
      "order_id": 2,
      "patient_id": "P002",
      "dentist_id": "knrsdent002",
      "lab_id": "knrslab001",
      "work_type_id": 2,
      "due_date": "2025-07-08T00:00:00.000Z",
      "file_types": "images, scans",
      "shade_type_id": 2,
      "material_id": 2,
      "priority": "medium",
      "special_instructions": "Handle with care",
      "status": "2",
      "lab": {
        "lab_id": "knrslab001",
        "name": "knrstestlab",
        "password": "$2b$10$MCkLZFcPCV17AGT7W8SbhOOO4SQQb70S2E9Q6AxOkV7lr2M48d5A2",
        "contact_person": "naveen",
        "contact_number": "0412292673",
        "email": "naveensandaru2@gmail.com",
        "address": "no 102",
        "specialties": "crowns, bridges"
      },
      "work_type": {
        "work_type_id": 2,
        "work_type": "Crown"
      },
      "shade_type": {
        "shade_type_id": 2,
        "shade": "white"
      },
      "material_type": {
        "material_id": 2,
        "material": "ceramic"
      },
      "order_files": [],
      "stage_assign": []
    },
    {
      "order_id": 3,
      "patient_id": "P003",
      "dentist_id": "knrsdent003",
      "lab_id": "knrslab002",
      "work_type_id": 3,
      "due_date": "2025-07-15T00:00:00.000Z",
      "file_types": "3d models",
      "shade_type_id": 3,
      "material_id": 3,
      "priority": "low",
      "special_instructions": "Standard procedure",
      "status": "1",
      "lab": {
        "lab_id": "knrslab002",
        "name": "Elite Dental Solutions",
        "password": "$2b$10$MCkLZFcPCV17AGT7W8SbhOOO4SQQb70S2E9Q6AxOkV7lr2M48d5A2",
        "contact_person": "John Doe",
        "contact_number": "0412345678",
        "email": "john@elitedental.com",
        "address": "123 Main St",
        "specialties": "veneers, implants"
      },
      "work_type": {
        "work_type_id": 3,
        "work_type": "Veneer"
      },
      "shade_type": {
        "shade_type_id": 3,
        "shade": "natural"
      },
      "material_type": {
        "material_id": 3,
        "material": "porcelain"
      },
      "order_files": [],
      "stage_assign": []
    }
  ]);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // API function to fetch orders (for backend integration)
  const fetchOrders = async (): Promise<Order[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/orders');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data: OrdersApiResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch orders');
      }
      
      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error fetching orders:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // API function to update order status
  const updateOrderStatus = async (orderId: number, newStatus: Order['status']): Promise<void> => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.order_id === orderId ? { ...order, status: newStatus } : order
        )
      );

      // Call callback if provided
      if (onOrderUpdate) {
        onOrderUpdate(orderId, { status: newStatus });
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order');
    }
  };

  // Helper function to get status text
  const getStatusText = (status: Order['status']): string => {
    switch (status) {
      case "1": return "Active";
      case "2": return "Completed";
      case "3": return "Overdue";
      default: return "Unknown";
    }
  };

  // Helper function to capitalize priority
  const capitalizePriority = (priority: Order['priority']): string => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  // Calculate statistics
  const stats: OrderStats = {
    active: orders.filter(order => order.status === '1').length,
    completed: orders.filter(order => order.status === '2').length,
    overdue: orders.filter(order => order.status === '3').length,
    total: orders.length
  };

  // Get priority color
  const getPriorityColor = (priority: Order['priority']): string => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get status color
  const getStatusColor = (status: Order['status']): string => {
    switch (status) {
      case '1': return 'text-blue-600 bg-blue-50';
      case '2': return 'text-green-600 bg-green-50';
      case '3': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get days until due
  const getDaysUntilDue = (dueDate: string): number => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Load orders on component mount
  useEffect(() => {
    if (initialOrders.length === 0) {
      // Uncomment the line below to fetch from API
      // fetchOrders().then(setOrders);
    }
  }, [initialOrders.length]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Order Management Dashboard</h1>
          <p className="text-gray-600">Track and manage your dental lab orders</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700">Loading orders...</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Active Orders */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-full">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Completed Orders */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Overdue Orders */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
              </div>
              <div className="bg-red-500 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-full">
                <Archive className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <p className="text-sm text-gray-600 mt-1">Latest orders from your dental lab</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dentist</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lab</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => {
                  const daysUntilDue = getDaysUntilDue(order.due_date);
                  return (
                    <tr key={order.order_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.order_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{order.patient_id}</div>
                            <div className="text-sm text-gray-500">Patient ID</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.work_type.work_type}</div>
                        <div className="text-sm text-gray-500">{order.material_type.material} • {order.shade_type.shade}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.dentist_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{order.lab.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(order.due_date)}</div>
                        <div className={`text-sm flex items-center mt-1 ${daysUntilDue < 0 ? 'text-red-600' : daysUntilDue <= 2 ? 'text-yellow-600' : 'text-gray-500'}`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days left`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                          {capitalizePriority(order.priority)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-200 ease-in-out"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-details-title"
          >
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto transform transition-all duration-200 ease-in-out scale-95 animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white z-10 p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900" id="order-details-title">
                  Order Details <span className="text-blue-600">#{selectedOrder.order_id}</span>
                </h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors duration-150"
                  aria-label="Close order details"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 space-y-8">
                {/* Patient & Dentist Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                      <User className="w-4 h-4 mr-2 text-blue-600" />
                      Patient Information
                    </h4>
                    <div className="space-y-2 pl-6">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium text-gray-600">Patient ID:</span> 
                        <span className="ml-2 font-mono">{selectedOrder.patient_id}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                      <User className="w-4 h-4 mr-2 text-blue-600" />
                      Dentist Information
                    </h4>
                    <div className="space-y-2 pl-6">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium text-gray-600">Dentist ID:</span> 
                        <span className="ml-2 font-mono">{selectedOrder.dentist_id}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Work & Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                      <Package className="w-4 h-4 mr-2 text-blue-600" />
                      Work Details
                    </h4>
                    <div className="space-y-2 pl-6">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Type:</span>
                        <span className="text-sm text-gray-900">{selectedOrder.work_type.work_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Material:</span>
                        <span className="text-sm text-gray-900">{selectedOrder.material_type.material}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Shade:</span>
                        <span className="text-sm text-gray-900">{selectedOrder.shade_type.shade}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">File Types:</span>
                        <span className="text-sm text-gray-900">{selectedOrder.file_types}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                      <ClipboardListIcon className="w-4 h-4 mr-2 text-blue-600" />
                      Order Details
                    </h4>
                    <div className="space-y-2 pl-6">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Lab:</span>
                        <span className="text-sm text-gray-900">{selectedOrder.lab.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Due Date:</span>
                        <span className="text-sm text-gray-900">{formatDate(selectedOrder.due_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Priority:</span>
                        <span className={`text-sm font-medium ${getPriorityColor(selectedOrder.priority).split(' ')[0]}`}>
                          {capitalizePriority(selectedOrder.priority)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Status:</span>
                        <span className={`text-sm font-medium ${getStatusColor(selectedOrder.status).split(' ')[0]}`}>
                          {getStatusText(selectedOrder.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lab Information */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                    <BuildingIcon className="w-4 h-4 mr-2 text-blue-600" />
                    Lab Information
                  </h4>
                  <div className="space-y-2 pl-6">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Contact Person:</span>
                      <span className="text-sm text-gray-900">{selectedOrder.lab.contact_person}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Contact Number:</span>
                      <a href={`tel:${selectedOrder.lab.contact_number}`} className="text-blue-600 hover:underline text-sm">
                        {selectedOrder.lab.contact_number}
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <a href={`mailto:${selectedOrder.lab.email}`} className="text-blue-600 hover:underline text-sm">
                        {selectedOrder.lab.email}
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Address:</span>
                      <span className="text-sm text-gray-900 text-right max-w-[60%]">{selectedOrder.lab.address}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-600">Specialties:</span>
                      <span className="text-sm text-gray-900 text-right">
                        {selectedOrder.lab.specialties}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Special Instructions */}
                {selectedOrder.special_instructions && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="text-base font-semibold text-blue-900 mb-3 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 text-blue-600" />
                      Special Instructions
                    </h4>
                    <p className="text-sm text-blue-800 bg-white/50 p-3 rounded-md border border-blue-100">
                      {selectedOrder.special_instructions}
                    </p>
                  </div>
                )}

                {/* Order Files Section */}
                {selectedOrder.order_files && selectedOrder.order_files.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                      <FileTextIcon className="w-4 h-4 mr-2 text-blue-600" />
                      Order Files
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedOrder.order_files.map((file) => (
                        <div 
                          key={file.file_id} 
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all duration-150"
                        >
                          <div className="flex items-center">
                            <FileIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-700 truncate max-w-[180px]">
                              File_{file.file_id}
                            </span>
                          </div>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors duration-150 flex items-center"
                          >
                            <ExternalLinkIcon className="w-3.5 h-3.5 mr-1.5" />
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stage Progress Section */}
                {selectedOrder.stage_assign && selectedOrder.stage_assign.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                      <ListChecksIcon className="w-4 h-4 mr-2 text-blue-600" />
                      Stage Progress
                    </h4>
                    <div className="relative
                      before:absolute before:left-5 before:h-full before:w-0.5 before:bg-gray-200 before:top-0 before:bottom-0
                    ">
                      {selectedOrder.stage_assign.map((stage, index) => (
                        <div 
                          key={stage.stage_assign_id} 
                          className="relative pl-10 pb-6 last:pb-0 group"
                        >
                          <div className={`absolute left-5 top-0 w-2 h-2 rounded-full -ml-1 mt-1.5 z-10 ${stage.completed ? 'bg-green-500' : 'bg-blue-500'}`} />
                          <div className="relative">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                Stage {index + 1}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${stage.completed ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                {stage.completed ? 'Completed' : 'In Progress'}
                              </span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <CalendarIcon className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                              {formatDate(stage.date)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagementDashboard;