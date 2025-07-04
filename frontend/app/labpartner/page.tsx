"use client";
import React, { useState, useEffect } from 'react';
import { Package, CheckCircle, AlertCircle, Archive, Eye, Clock, User, MapPin } from 'lucide-react';

const OrderManagementDashboard = () => {
  // Mock data based on the database schema
  const [orders, setOrders] = useState([
    {
      order_id: 1,
      patient_id: "PAT001",
      dentist_id: "DEN001",
      lab_id: "LAB001",
      work_type_id: 1,
      due_date: "2025-07-10",
      shade_type_id: 1,
      material_id: 1,
      priority: "High",
      special_instructions: "Patient has sensitive teeth",
      status: "Active",
      work_type: "Crown",
      shade: "A2",
      material: "Ceramic",
      lab_name: "Premium Dental Lab",
      dentist_name: "Dr. Sarah Johnson",
      patient_name: "John Smith",
      created_date: "2025-07-01"
    },
    {
      order_id: 2,
      patient_id: "PAT002",
      dentist_id: "DEN002",
      lab_id: "LAB001",
      work_type_id: 2,
      due_date: "2025-07-08",
      shade_type_id: 2,
      material_id: 2,
      priority: "Medium",
      special_instructions: "Match adjacent teeth closely",
      status: "Overdue",
      work_type: "Bridge",
      shade: "B1",
      material: "Zirconia",
      lab_name: "Premium Dental Lab",
      dentist_name: "Dr. Michael Chen",
      patient_name: "Emma Davis",
      created_date: "2025-06-25"
    },
    {
      order_id: 3,
      patient_id: "PAT003",
      dentist_id: "DEN003",
      lab_id: "LAB002",
      work_type_id: 3,
      due_date: "2025-07-15",
      shade_type_id: 3,
      material_id: 3,
      priority: "Low",
      special_instructions: "Standard procedure",
      status: "Active",
      work_type: "Veneer",
      shade: "C1",
      material: "Porcelain",
      lab_name: "Elite Dental Solutions",
      dentist_name: "Dr. Lisa Rodriguez",
      patient_name: "Michael Johnson",
      created_date: "2025-07-02"
    },
    {
      order_id: 4,
      patient_id: "PAT004",
      dentist_id: "DEN001",
      lab_id: "LAB001",
      work_type_id: 1,
      due_date: "2025-07-05",
      shade_type_id: 1,
      material_id: 1,
      priority: "High",
      special_instructions: "Rush order",
      status: "Overdue",
      work_type: "Crown",
      shade: "A3",
      material: "Ceramic",
      lab_name: "Premium Dental Lab",
      dentist_name: "Dr. Sarah Johnson",
      patient_name: "Robert Wilson",
      created_date: "2025-06-28"
    },
    {
      order_id: 5,
      patient_id: "PAT005",
      dentist_id: "DEN004",
      lab_id: "LAB003",
      work_type_id: 4,
      due_date: "2025-07-12",
      shade_type_id: 2,
      material_id: 4,
      priority: "Medium",
      special_instructions: "Patient prefers natural look",
      status: "Active",
      work_type: "Implant",
      shade: "B2",
      material: "Titanium",
      lab_name: "Advanced Dental Tech",
      dentist_name: "Dr. James Anderson",
      patient_name: "Amanda Brown",
      created_date: "2025-07-03"
    },
    {
      order_id: 6,
      patient_id: "PAT006",
      dentist_id: "DEN002",
      lab_id: "LAB002",
      work_type_id: 2,
      due_date: "2025-07-06",
      shade_type_id: 3,
      material_id: 2,
      priority: "High",
      special_instructions: "Urgent delivery required",
      status: "Overdue",
      work_type: "Bridge",
      shade: "C2",
      material: "Zirconia",
      lab_name: "Elite Dental Solutions",
      dentist_name: "Dr. Michael Chen",
      patient_name: "David Martinez",
      created_date: "2025-06-26"
    },
    {
      order_id: 7,
      patient_id: "PAT007",
      dentist_id: "DEN003",
      lab_id: "LAB001",
      work_type_id: 3,
      due_date: "2025-07-20",
      shade_type_id: 1,
      material_id: 3,
      priority: "Low",
      special_instructions: "Standard veneer procedure",
      status: "Active",
      work_type: "Veneer",
      shade: "A1",
      material: "Porcelain",
      lab_name: "Premium Dental Lab",
      dentist_name: "Dr. Lisa Rodriguez",
      patient_name: "Jennifer Taylor",
      created_date: "2025-07-04"
    }
  ]);

  const [selectedOrder, setSelectedOrder] = useState(null);

  // Calculate statistics
  const stats = {
    active: orders.filter(order => order.status === 'Active').length,
    completed: orders.filter(order => order.status === 'Completed').length,
    overdue: orders.filter(order => order.status === 'Overdue').length,
    total: orders.length
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'text-blue-600 bg-blue-50';
      case 'Completed': return 'text-green-600 bg-green-50';
      case 'Overdue': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get days until due
  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Order Management Dashboard</h1>
          <p className="text-gray-600">Track and manage your dental lab orders</p>
        </div>

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
                            <div className="text-sm font-medium text-gray-900">{order.patient_name}</div>
                            <div className="text-sm text-gray-500">{order.patient_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.work_type}</div>
                        <div className="text-sm text-gray-500">{order.material} • {order.shade}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.dentist_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{order.lab_name}</span>
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
                          {order.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order Details - #{selectedOrder.order_id}
                  </h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Patient Information</h4>
                    <div className="space-y-2">
                      <p className="text-sm"><span className="font-medium">Name:</span> {selectedOrder.patient_name}</p>
                      <p className="text-sm"><span className="font-medium">ID:</span> {selectedOrder.patient_id}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Dentist Information</h4>
                    <div className="space-y-2">
                      <p className="text-sm"><span className="font-medium">Name:</span> {selectedOrder.dentist_name}</p>
                      <p className="text-sm"><span className="font-medium">ID:</span> {selectedOrder.dentist_id}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Work Details</h4>
                    <div className="space-y-2">
                      <p className="text-sm"><span className="font-medium">Type:</span> {selectedOrder.work_type}</p>
                      <p className="text-sm"><span className="font-medium">Material:</span> {selectedOrder.material}</p>
                      <p className="text-sm"><span className="font-medium">Shade:</span> {selectedOrder.shade}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Order Details</h4>
                    <div className="space-y-2">
                      <p className="text-sm"><span className="font-medium">Lab:</span> {selectedOrder.lab_name}</p>
                      <p className="text-sm"><span className="font-medium">Due Date:</span> {formatDate(selectedOrder.due_date)}</p>
                      <p className="text-sm"><span className="font-medium">Priority:</span> {selectedOrder.priority}</p>
                      <p className="text-sm"><span className="font-medium">Status:</span> {selectedOrder.status}</p>
                    </div>
                  </div>
                </div>

                {selectedOrder.special_instructions && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Special Instructions</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                      {selectedOrder.special_instructions}
                    </p>
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