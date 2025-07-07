"use client";
import React, { useState, useEffect } from 'react';
import { Package, CheckCircle, AlertCircle, Archive, Clock, User, MapPin, ChevronDown } from 'lucide-react';

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
  date: string;
}

interface Order {
  order_id: number;
  patient_id: string;
  dentist_id: string;
  lab_id: string;
  work_type_id: number;
  due_date: string;
  file_types: string;
  shade_type_id: number;
  material_id: number;
  priority: 'high' | 'medium' | 'low';
  special_instructions: string;
  status: '1' | '2' | '3' | '4' | '5'; // 1: Pending, 2: In Progress, 3: Completed, 4: Cancelled, 5: On Hold
  lab: Lab;
  work_type: WorkType;
  shade_type: ShadeType;
  material_type: MaterialType;
  order_files: OrderFile[];
  stage_assign: StageAssign[];
}

// Status options for dropdown
const STATUS_OPTIONS = [
  { value: '1', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: '2', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: '3', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: '4', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  { value: '5', label: 'On Hold', color: 'bg-gray-100 text-gray-800' }
];

// API Response interface
interface OrdersApiResponse {
  success: boolean;
  data: Order[];
  message?: string;
}

// Component Props
interface OrdersListProps {
  initialOrders?: Order[];
  onStatusUpdate?: (orderId: number, newStatus: Order['status']) => void;
}

const OrdersList: React.FC<OrdersListProps> = ({
  initialOrders = [],
  onStatusUpdate
}) => {
  const [orders, setOrders] = useState<Order[]>(initialOrders.length > 0 ? initialOrders : [
    {
      "order_id": 1,
      "patient_id": "P001",
      "dentist_id": "knrsdent001",
      "lab_id": "knrslab001",
      "work_type_id": 1,
      "due_date": "2025-07-07T00:00:00.000Z",
      "file_types": "scans, photos",
      "shade_type_id": 1,
      "material_id": 1,
      "priority": "high",
      "special_instructions": "Rush order needed",
      "status": "1",
      "lab": {
        "lab_id": "knrslab001",
        "name": "Premium Dental Lab",
        "password": "$2b$10$MCkLZFcPCV17AGT7W8SbhOOO4SQQb70S2E9Q6AxOkV7lr2M48d5A2",
        "contact_person": "Dr. Smith",
        "contact_number": "0412292673",
        "email": "contact@premiumdentallab.com",
        "address": "123 Dental Street",
        "specialties": "Crowns, Bridges, Implants"
      },
      "work_type": {
        "work_type_id": 1,
        "work_type": "Crown"
      },
      "shade_type": {
        "shade_type_id": 1,
        "shade": "A2"
      },
      "material_type": {
        "material_id": 1,
        "material": "Porcelain"
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
      "due_date": "2025-07-10T00:00:00.000Z",
      "file_types": "3D models, impressions",
      "shade_type_id": 2,
      "material_id": 2,
      "priority": "medium",
      "special_instructions": "Standard procedure",
      "status": "2",
      "lab": {
        "lab_id": "knrslab001",
        "name": "Premium Dental Lab",
        "password": "$2b$10$MCkLZFcPCV17AGT7W8SbhOOO4SQQb70S2E9Q6AxOkV7lr2M48d5A2",
        "contact_person": "Dr. Smith",
        "contact_number": "0412292673",
        "email": "contact@premiumdentallab.com",
        "address": "123 Dental Street",
        "specialties": "Crowns, Bridges, Implants"
      },
      "work_type": {
        "work_type_id": 2,
        "work_type": "Bridge"
      },
      "shade_type": {
        "shade_type_id": 2,
        "shade": "B1"
      },
      "material_type": {
        "material_id": 2,
        "material": "Ceramic"
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
      "file_types": "digital scans",
      "shade_type_id": 3,
      "material_id": 3,
      "priority": "low",
      "special_instructions": "Patient prefers natural look",
      "status": "3",
      "lab": {
        "lab_id": "knrslab002",
        "name": "Elite Dental Solutions",
        "password": "$2b$10$MCkLZFcPCV17AGT7W8SbhOOO4SQQb70S2E9Q6AxOkV7lr2M48d5A2",
        "contact_person": "Dr. Johnson",
        "contact_number": "0412345678",
        "email": "info@elitedental.com",
        "address": "456 Medical Plaza",
        "specialties": "Veneers, Implants, Orthodontics"
      },
      "work_type": {
        "work_type_id": 3,
        "work_type": "Veneer"
      },
      "shade_type": {
        "shade_type_id": 3,
        "shade": "Natural White"
      },
      "material_type": {
        "material_id": 3,
        "material": "Lithium Disilicate"
      },
      "order_files": [],
      "stage_assign": []
    },
    {
      "order_id": 4,
      "patient_id": "P004",
      "dentist_id": "knrsdent004",
      "lab_id": "knrslab001",
      "work_type_id": 4,
      "due_date": "2025-07-20T00:00:00.000Z",
      "file_types": "impressions, photos",
      "shade_type_id": 4,
      "material_id": 4,
      "priority": "high",
      "special_instructions": "Patient has sensitive teeth",
      "status": "5",
      "lab": {
        "lab_id": "knrslab001",
        "name": "Premium Dental Lab",
        "password": "$2b$10$MCkLZFcPCV17AGT7W8SbhOOO4SQQb70S2E9Q6AxOkV7lr2M48d5A2",
        "contact_person": "Dr. Smith",
        "contact_number": "0412292673",
        "email": "contact@premiumdentallab.com",
        "address": "123 Dental Street",
        "specialties": "Crowns, Bridges, Implants"
      },
      "work_type": {
        "work_type_id": 4,
        "work_type": "Inlay"
      },
      "shade_type": {
        "shade_type_id": 4,
        "shade": "C3"
      },
      "material_type": {
        "material_id": 4,
        "material": "Gold"
      },
      "order_files": [],
      "stage_assign": []
    }
  ]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // API function to update order status
  const updateOrderStatus = async (orderId: number, newStatus: Order['status']): Promise<void> => {
    try {
      setUpdatingOrderId(orderId);
      setError(null);

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
      if (onStatusUpdate) {
        onStatusUpdate(orderId, newStatus);
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Get status info
  const getStatusInfo = (status: Order['status']) => {
    return STATUS_OPTIONS.find(option => option.value === status) || STATUS_OPTIONS[0];
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

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    const matchesSearch = searchTerm === '' || 
      order.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.dentist_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.work_type.work_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.lab.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  // Calculate stats
  const stats = {
    pending: orders.filter(order => order.status === '1').length,
    inProgress: orders.filter(order => order.status === '2').length,
    completed: orders.filter(order => order.status === '3').length,
    total: orders.length
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Orders Management</h1>
          <p className="text-gray-600">Manage and track all dental lab orders</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Stats Cards
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <div className="bg-yellow-500 p-3 rounded-full">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-full">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

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
        </div> */}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by patient, dentist, work type, or lab..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Orders List</h2>
            <p className="text-sm text-gray-600 mt-1">
              Showing {filteredOrders.length} of {orders.length} orders
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dentist</th>
                  
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const daysUntilDue = getDaysUntilDue(order.due_date);
                  const statusInfo = getStatusInfo(order.status);
                  
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
                        <div className="text-sm text-gray-900">{formatDate(order.due_date)}</div>
                        <div className={`text-sm flex items-center mt-1 ${daysUntilDue < 0 ? 'text-red-600' : daysUntilDue <= 2 ? 'text-yellow-600' : 'text-gray-500'}`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days left`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                          {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.order_id, e.target.value as Order['status'])}
                            disabled={updatingOrderId === order.order_id}
                            className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed pr-8"
                          >
                            {STATUS_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            {updatingOrderId === order.order_id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            ) : (
                              <ChevronDown className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No orders found</p>
              <p className="text-gray-400 text-sm">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersList;