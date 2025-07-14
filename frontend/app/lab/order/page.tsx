"use client";

import React, { useState, useEffect, useContext } from 'react';
import { Loader, Clock, User, FileText, Eye, Filter, X, CheckCircle, Paperclip, Receipt, ListCheckIcon, List, BookCheck } from 'lucide-react';
import { AuthContext } from '@/context/auth-context';
import axios from 'axios';
import { Search } from "@/Components/ui/search";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCallback } from 'react';

// ======================== TYPES ========================

type Lab = {
  lab_id: string;
  name: string;
  contact_person: string;
  contact_number: string;
  email: string;
  address: string;
  specialties: string;
  rating?: number;
  turnaround_time?: string;
  status?: string;
};

type WorkType = {
  work_type_id: number;
  work_type: string;
};

type Shade = {
  shade_type_id: number;
  shade: string;
};

type MaterialType = {
  material_id: number;
  material: string;
};

type Stage = {
  stage_id: number;
  name: string;
};

type StageWithStatus = Stage & {
  completed: boolean;
  date: string | null;
};

type StageAssign = {
  stage_assign_id: number;
  stage_id: number;
  order_id: number;
  completed: boolean;
  date: string | null;
};

type OrderFile = {
  file_id: number;
  url: string;
  order_id: number;
};

type PatientType = {
  patient_id: string;
  name: string;
}

type DenstistType = {
  dentist_id: string;
  name: string;
}

type Order = {
  order_id: number;
  patient: PatientType;
  dentist: DenstistType;
  lab: Lab;
  work_type: WorkType;
  due_date: string | null;
  file_types: string | null;
  shade: Shade;
  material: MaterialType;
  priority: string;
  special_instructions: string;
  status: string;
  order_files: OrderFile[];
};

// ======================== COMPONENT ========================
const LabOrderModule = () => {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const { user, isLoggedIn, isLoadingAuth } = useContext(AuthContext);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stages, setStages] = useState<StageWithStatus[]>([]);
  const [fetchedStages, setFetchedStages] = useState<Stage[]>([]);
  const [stageAssigns, setStageAssigns] = useState<StageAssign[]>([]);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingStages, setLoadingStages] = useState(false);
  const [loadingStageAssigns, setLoadingStageAssigns] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [updatingStage, setUpdatingStage] = useState<number | null>(null);

  // Debounce search query updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  function getStagesForOrder(orderId: number): StageWithStatus[] {
    return fetchedStages.map(stage => {
      const assignment = stageAssigns.find(sa => sa.order_id === orderId && sa.stage_id === stage.stage_id);
      return {
        ...stage,
        completed: assignment?.completed ?? false,
        date: assignment?.date || null
      };
    });
  }

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const fetchedOrders = await axios.get(
        `${backendURL}/orders`
      );
      if (fetchedOrders.status == 500) {
        throw new Error("Error fetching orders");
      }
      setOrders(fetchedOrders.data);
    }
    catch (err: any) {
      setToast({
        show: true,
        message: err.message,
        type: 'error'
      });
    }
    finally {
      setLoadingOrders(false);
    }
  }

  const fetchStages = async () => {
    setLoadingStages(true);
    try {
      const stagesres = await axios.get(
        `${backendURL}/stages`
      );
      if (stagesres.status == 500) {
        throw new Error("Internal Server Error");
      }
      setFetchedStages(stagesres.data);
    }
    catch (err: any) {
      setToast({
        show: true,
        message: err.message,
        type: 'error'
      });
    }
    finally {
      setLoadingStages(false);
    }
  }

  const fetchStageAssigns = async () => {
    setLoadingStageAssigns(true);
    try {
      const res = await axios.get(
        `${backendURL}/stage-assign`
      );
      if (res.status == 500) {
        throw new Error("Internal Server Error");
      }
      setStageAssigns(res.data);
    }
    catch (err: any) {
      setToast({
        show: true,
        message: err.message,
        type: 'error'
      });
    }
    finally {
      setLoadingStageAssigns(false);
    }
  }

  useEffect(() => {
    fetchOrders();
    fetchStages();
    fetchStageAssigns();
  }, []);

  useEffect(() => {
    if (selectedOrder) {
      const updatedStages = getStagesForOrder(selectedOrder.order_id);
      setStages(updatedStages);
    }
  }, [selectedOrder, fetchedStages, stageAssigns]);

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string | null) => {
    if (!priority) return 'text-gray-500';
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-500';
      case 'low': return 'text-green-600';
      default: return 'text-gray-500';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !debouncedSearchQuery || 
      order.order_id.toString().toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      (order.patient?.name || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      (order.dentist?.name || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      (order.work_type?.work_type || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      (order.status || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase());

    const matchesPriority = selectedPriority === 'all' || order.priority?.toLowerCase() === selectedPriority.toLowerCase();

    return matchesSearch && matchesPriority;
  });

  const OrdersList = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Lab Orders</h2>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <Search
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
              placeholder="Search by order ID, patient, dentist..."
            />
          </div>
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loadingOrders ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="h-6 w-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Loading orders...</span>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dentist</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lab</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.order_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.dentist?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{order.dentist?.dentist_id || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.patient?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{order.patient?.patient_id || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.work_type?.work_type || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.lab?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.due_date?.split("T")[0]}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getPriorityColor(order.priority)}`}>
                      {order.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <BookCheck className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const handleStageToggle = async (stageId: number, orderId: number, isCompleted: boolean) => {
    setUpdatingStage(stageId);
    try {
      const response = await axios.post(
        `${backendURL}/stage-assign/`,
        {
          stage_id: stageId,
          order_id: orderId,
          completed: true,
          date: new Date().toISOString()
        }
      );

      let newStatus = ""
      if(stageId !== 5){
        newStatus = "in-progress"
      }
      else{
        newStatus = "completed"
      }

      const res2 = await axios.put(
        `${backendURL}/orders/${orderId}`,
        {
          status:newStatus
        },
        {
          withCredentials: true,
          headers:{
            "content-type": "application/json"
          }
        }
      );

      if(response.status != 201 || res2.status != 202){
        throw new Error("Error Updating Order");
      }

      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.order_id === orderId
            ? { ...order, status: newStatus }
            : order
        )
      );
  
      if (selectedOrder?.order_id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }

      setStageAssigns(prevAssigns => {
        const existingAssign = prevAssigns.find(
          sa => sa.stage_id === stageId && sa.order_id === orderId
        );
  
        if (existingAssign) {
          return prevAssigns.map(assign => 
            (assign.stage_id === stageId && assign.order_id === orderId)
              ? { ...assign, completed: !isCompleted, date: !isCompleted ? new Date().toISOString() : null }
              : assign
          );
        } else {
          return [
            ...prevAssigns,
            {
              stage_assign_id: Date.now(),
              stage_id: stageId,
              order_id: orderId,
              completed: !isCompleted,
              date: !isCompleted ? new Date().toISOString() : null
            }
          ];
        }
      });
    
      setToast({
        show: true,
        message: `Stage ${!isCompleted ? 'completed' : 'marked as pending'}`,
        type: 'success'
      });
    } catch (err: any) {
      setToast({
        show: true,
        message: err.response?.data?.message || "Failed to update stage",
        type: 'error'
      });
    } finally {
      setUpdatingStage(null);
    }
  };

  const OrderDetails = ({ order, onClose }: { order: Order; onClose: () => void }) => (
    <div className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Order Details - {order.order_id}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Patient Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {order.patient?.name || 'N/A'}</p>
                <p><span className="font-medium">Patient ID:</span> {order.patient?.patient_id || 'N/A'}</p>
                <p><span className="font-medium">Dentist:</span> Dr. {order.dentist?.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Order Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Work Type:</span> {order.work_type?.work_type || 'N/A'}</p>
                <p><span className="font-medium">Lab:</span> {order.lab?.name || 'N/A'}</p>
                <p><span className="font-medium">Order Date:</span> {order.due_date?.split("T")[0]}</p>
                <p><span className="font-medium">Due Date:</span> {order.due_date?.split("T")[0]}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Progress Tracking</h3>
            <div className="space-y-3">
              {loadingStages ? (
                <div className="flex items-center space-x-3">
                  <Loader className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="text-gray-500">Loading stages...</span>
                </div>
              ) : (
                stages?.map((stage, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${stage.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className={`flex-1 ${stage.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                      {stage.name}
                    </span>
                    {stage.completed && stage.date?.split("T")[0] && (
                      <span className="text-sm text-gray-500">{stage.date.split("T")[0]}</span>
                    )}
                    {stage.completed ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-gray-400" />
                    )}
                    <div className="relative">
                      {!stage.completed && (<input
                        type="checkbox"
                        checked={stage.completed}
                        onChange={() => handleStageToggle(stage.stage_id, order.order_id, stage.completed)}
                        disabled={updatingStage === stage.stage_id}
                        className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                      />)}
                      {updatingStage === stage.stage_id && (
                        <Loader className="h-4 w-4 animate-spin text-blue-600 absolute top-0.5 left-0.5" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {order.order_files && order.order_files.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Files</h3>
              <div className="space-y-2">
                {order.order_files.map((file) => (
                  <div key={file.file_id} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.url.split('/').pop()}</p>
                      </div>
                    </div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.special_instructions && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Special Instructions</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">{order.special_instructions}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div>
            <h1 className="text-3xl font-bold mt-7 md:mt-0 text-gray-900 mb-2">Lab Orders</h1>
            <p className="text-gray-600">View and manage your lab orders</p>
          </div>
        </div>
      </div>

      <div className="-mt-3 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OrdersList />
        
        {selectedOrder && (
          <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        )}

        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white flex items-center`}>
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(prev => ({ ...prev, show: false }))}
              className="ml-4 text-white hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabOrderModule;