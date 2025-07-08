"use client";
import React, { useState, useEffect } from 'react';
import { Package, CheckCircle, AlertCircle, Archive, Clock, User, MapPin, ChevronDown, ClipboardList } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

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

  // New states for tracking dialog
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingOptions, setTrackingOptions] = useState<{[key: string]: boolean}>({
    'In-Person Send': false,
    'Wax Try-In': false,
    'Final Processing': false,
    'Quality Check': false,
    'Ready for Pickup': false,
    'Delivery': false,
    'Completed': false
  });

  // Function to calculate status based on tracking options
  const calculateStatus = (options: {[key: string]: boolean}): Order['status'] => {
    if (options['Completed']) {
      return '3'; // Completed
    } else if (Object.values(options).some(value => value)) {
      return '2'; // In Progress
    }
    return '1'; // Pending
  };

  // Function to handle tracking updates
  const handleTrackingUpdate = async () => {
    if (!selectedOrder) return;

    try {
      setUpdatingOrderId(selectedOrder.order_id);
      setError(null);

      // Calculate new status based on tracking options
      const newStatus = calculateStatus(trackingOptions);

      // Update order status
      await updateOrderStatus(selectedOrder.order_id, newStatus);
      setIsTrackingDialogOpen(false);
    } catch (err) {
      console.error('Error updating tracking:', err);
      setError(err instanceof Error ? err.message : 'Failed to update tracking');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Function to handle checkbox changes
  const handleCheckboxChange = (option: string, checked: boolean) => {
    const newTrackingOptions = {
      ...trackingOptions,
      [option]: checked
    };
    
    // If completing the last step, automatically check "Completed"
    if (option !== 'Completed' && 
        Object.entries(newTrackingOptions)
          .filter(([key]) => key !== 'Completed')
          .every(([_, value]) => value)) {
      newTrackingOptions['Completed'] = true;
    }
    
    // If unchecking any step, uncheck "Completed"
    if (!checked) {
      newTrackingOptions['Completed'] = false;
    }

    setTrackingOptions(newTrackingOptions);

    // If we have a selected order, update its status in the local state
    if (selectedOrder) {
      const newStatus = calculateStatus(newTrackingOptions);
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.order_id === selectedOrder.order_id
            ? { ...order, status: newStatus }
            : order
        )
      );
    }
  };

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // API function to update order status
  const updateOrderStatus = async (orderId: number, newStatus: Order['status']): Promise<void> => {
    try {
      setUpdatingOrderId(orderId);
      setError(null);

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
        {/* Tracking Dialog */}
        <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Order Progress Tracking</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                {Object.entries(trackingOptions).map(([option, checked]) => (
                  <div key={option} className="flex items-center space-x-3">
                    <Checkbox
                      id={option}
                      checked={checked}
                      onCheckedChange={(checked) => handleCheckboxChange(option, checked === true)}
                      disabled={option === 'Completed' && !Object.entries(trackingOptions)
                        .filter(([key]) => key !== 'Completed')
                        .every(([_, value]) => value)}
                    />
                    <label
                      htmlFor={option}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {option}
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <div className="text-sm font-medium text-gray-700">Current Status:</div>
                <div className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    getStatusInfo(calculateStatus(trackingOptions)).color
                  }`}>
                    {getStatusInfo(calculateStatus(trackingOptions)).label}
                  </span>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => setIsTrackingDialogOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTrackingUpdate}
                  disabled={updatingOrderId !== null}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingOrderId !== null ? 'Updating...' : 'Update Progress'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
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
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              // Initialize tracking options based on current order status
                              const newTrackingOptions = {
                                'In-Person Send': order.status === '2' || order.status === '3',
                                'Wax Try-In': order.status === '2' || order.status === '3',
                                'Final Processing': order.status === '2' || order.status === '3',
                                'Quality Check': order.status === '2' || order.status === '3',
                                'Ready for Pickup': order.status === '2' || order.status === '3',
                                'Delivery': order.status === '2' || order.status === '3',
                                'Completed': order.status === '3'
                              };
                              setTrackingOptions(newTrackingOptions);
                              setIsTrackingDialogOpen(true);
                            }}
                            className="inline-flex items-center justify-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            disabled={updatingOrderId === order.order_id}
                          >
                            <ClipboardList className="w-4 h-4 mr-2" />
                            Track Progress
                          </button>
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