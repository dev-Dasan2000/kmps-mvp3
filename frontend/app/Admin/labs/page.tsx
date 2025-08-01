"use client";

import React, { useState, useEffect, useContext, useRef } from 'react';
import { Loader, Calendar, Clock, User, MapPin, Phone, Mail, Package, FileText, AlertCircle, CheckCircle, Eye, Edit, Plus, Filter, X, CircleCheckBig, Trash2 } from 'lucide-react';
import { AuthContext } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { headers } from 'next/headers';
import { LabOrderForm } from '@/components/LabOrderForm';
import { Search as SearchIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
// ======================== TYPES ========================

type Lab = {
  lab_id: string;
  name: string;
  password?: string;
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
  date: string;
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
const DentalLabModule = () => {

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);
  const formScrollPosition = useRef<number>(0);

  const { user, isLoggedIn, isLoadingAuth, apiClient } = useContext(AuthContext);

  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'orders' | 'labs'>('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>();
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [shades, setShades] = useState<Shade[]>([]);
  const [materials, setMaterials] = useState<MaterialType[]>([]);
  const [stages, setStages] = useState<StageWithStatus[]>([]);
  const [fetchedStages, setFetchedStages] = useState<Stage[]>([]);
  const [stageAssigns, setStageAssigns] = useState<StageAssign[]>([]);
  const [patients, setPatients] = useState<PatientType[]>([]);
  const [dentists, setDentists] = useState<DenstistType[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [deleteLabDialogOpen, setDeleteLabDialogOpen] = useState(false);
  const [labToDelete, setLabToDelete] = useState<string | null>(null);
  const [deleteOrderDialogOpen, setDeleteOrderDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);

  const [showNewLab, setShowNewLab] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingStages, setLoadingStages] = useState(false);
  const [loadingStageAssigns, setLoadingStageAssigns] = useState(false);
  const [loadingLabs, setLoadingLabs] = useState(false);
  const [loadingWorkTypes, setLoadingWorkTypes] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingDentists, setLoadingDentists] = useState(false);
  const [loadingShades, setLoadingShades] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [acceptingOrder, setAcceptingOrder] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

  useEffect(() => {
    if (formScrollRef.current && showNewOrder) {
      formScrollRef.current.scrollTop = formScrollPosition.current;
    }
  });

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

  const getSelectedFileTypes = (checklist: typeof submissionChecklist) => {
    const selected: string[] = [];

    Object.entries(checklist).forEach(([categoryKey, categoryValue]) => {
      Object.entries(categoryValue).forEach(([key, value]) => {
        if (value) selected.push(key);
      });
    });

    return selected.join(", ");
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const fetchedOrders = await apiClient.get(
        `/orders`
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
      const stagesres = await apiClient.get(
        `/stages`
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
      const res = await apiClient.get(
        `/stage-assign`
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

  const fetchLabs = async () => {
    setLoadingLabs(true);
    try {
      const res = await apiClient.get(
        `/labs`
      );
      if (res.status == 500) {
        throw new Error("Internal Server Error");
      }
      setLabs(res.data);
    }
    catch (err: any) {
      setToast({
        show: true,
        message: err.message,
        type: 'error'
      });
    }
    finally {
      setLoadingLabs(false);
    }
  }

  const fetchWorkTypes = async () => {
    setLoadingWorkTypes(true);
    try {
      const res = await apiClient.get(
        `/work-types`
      );
      if (res.status == 500) {
        throw new Error("Internal Server Error");
      }
      setWorkTypes(res.data);
    }
    catch (err: any) {
      setToast({
        show: true,
        message: err.message,
        type: 'error'
      });
    }
    finally {
      setLoadingWorkTypes(false);
    }
  }

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const res = await apiClient.get(
        `/patients`
      );
      if (res.status == 500) {
        throw new Error("Internal Server Error");
      }
      setPatients(res.data);
    }
    catch (err: any) {
      setToast({
        show: true,
        message: err.message,
        type: 'error'
      });
    }
    finally {
      setLoadingPatients(false);
    }
  }

  const fetchDentists = async () => {
    setLoadingDentists(true);
    try {
      const res = await apiClient.get(
        `/dentists`
      );
      if (res.status == 500) {
        throw new Error("Internal Server Error");
      }
      setDentists(res.data);
    }
    catch (err: any) {
      setToast({
        show: true,
        message: err.message,
        type: 'error'
      });
    }
    finally {
      setLoadingDentists(false);
    }
  }

  const fetchShades = async () => {
    setLoadingShades(true);
    try {
      const res = await apiClient.get(
        `/shades`
      );
      if (res.status == 500) {
        throw new Error("Internal Server Error");
      }
      setShades(res.data);
    }
    catch (err: any) {
      setToast({
        show: true,
        message: err.message,
        type: 'error'
      });
    }
    finally {
      setLoadingShades(false);
    }
  }

  const fetchMaterials = async () => {
    setLoadingMaterials(true);
    try {
      const res = await apiClient.get(
        `/material-types`
      );
      if (res.status == 500) {
        throw new Error("Internal Server Error");
      }
      setMaterials(res.data);
    }
    catch (err: any) {
      setToast({
        show: true,
        message: err.message,
        type: 'error'
      });
    }
    finally {
      setLoadingMaterials(false);
    }
  }

  useEffect(() => {
    if (selectedOrder) {
      const updatedStages = getStagesForOrder(selectedOrder.order_id);
      setStages(updatedStages);
    }
  }, [selectedOrder]);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isLoggedIn) {
      setToast({
        show: true,
        message: 'Please Log in',
        type: 'error'
      });
      router.push('/');
      return;
    }
    if (user.role != "admin") {
      setToast({
        show: true,
        message: 'Access Denied',
        type: 'error'
      });
      router.push('/');
      return;
    }
    fetchOrders();
    fetchStages();
    fetchStageAssigns();
    fetchLabs();
    fetchWorkTypes();
    fetchPatients();
    fetchDentists();
    fetchShades();
    fetchMaterials();
  }, [isLoadingAuth]);

  useEffect(() => {
    // setSearchQuery(''); // Removed as per edit hint
  }, [activeTab])

  const [newOrder, setNewOrder] = useState({
    patient_id: '',
    dentist_id: '',
    lab_id: '',
    work_type_id: 0,
    due_date: '',
    file_types: '',
    shade_type_id: 0,
    material_id: 0,
    priority: 'Normal',
    special_instructions: '',
    status: ''

  });

  const [submissionChecklist, setSubmissionChecklist] = useState({
    digitalFiles: {
      intraOralScans: false,
      stlFiles: false,
      cbctScans: false,
      photographs: false
    },
    physicalItems: {
      impressions: false,
      biteRegistration: false,
      models: false,
      faceBow: false
    },
    documentation: {
      prescription: false,
      clinicalNotes: false
    }
  });

  const [uploadedFiles, setUploadedFiles] = useState<{ id: number; name: string; size: number; type: string; category: string }[]>([]);

  const workTypeRequirements: Record<string, { required: string[]; optional: string[] }> = {
    'Complete Denture': {
      required: ['Final impressions', 'Bite registration', 'Face-bow transfer', 'Shade selection', 'Clinical photos'],
      optional: ['Previous denture photos', 'Bite analysis', 'Patient preferences']
    },
    'Crown & Bridge': {
      required: ['Prepared tooth scan/impression', 'Opposing arch', 'Bite registration', 'Shade match', 'Margin definition'],
      optional: ['CBCT scan', 'Temporary restoration notes', 'Contact preferences']
    },
    'Partial Denture': {
      required: ['Primary impressions', 'Secondary impressions', 'Bite registration', 'Jaw relation records'],
      optional: ['Existing partial evaluation', 'Tissue conditioning notes']
    },
    'Implant Restoration': {
      required: ['Implant scan body', 'Soft tissue scan', 'Opposing arch', 'Emergence profile', 'CBCT data'],
      optional: ['Healing abutment photos', 'Gingival contour preferences']
    }
  };

  const getStatusColor = (status: string | null) => {
    const baseStyles = 'px-2.5 py-1 text-xs font-medium rounded-full';
    
    switch (status?.toLowerCase()) {
      case 'pending':
        return `${baseStyles} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/80 dark:text-yellow-200`;
      case 'in progress':
        return `${baseStyles} bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200`;
      case 'ready for pickup':
        return `${baseStyles} bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200`;
      case 'completed':
        return `${baseStyles} bg-green-100 text-green-800 dark:bg-green-900/80 dark:text-green-200`;
      case 'delayed':
        return `${baseStyles} bg-red-100 text-red-800 dark:bg-red-900/80 dark:text-red-200`;
      case 'request':
        return `${baseStyles} bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200`;
      case 'accepted':
        return `${baseStyles} bg-teal-100 text-teal-800 dark:bg-teal-900/80 dark:text-teal-200`;
      default:
        return `${baseStyles} bg-gray-100 text-gray-800 dark:bg-gray-700/80 dark:text-gray-300`;
    }
  };

  const getPriorityColor = (priority: string | null) => {
    const baseStyles = 'px-2.5 py-1 text-xs font-semibold rounded-full';
    
    switch (priority?.toLowerCase()) {
      case 'high':
        return `${baseStyles} bg-red-100 text-red-800 dark:bg-red-900/90 dark:text-red-100`;
      case 'urgent':
        return `${baseStyles} bg-red-500 text-white dark:bg-red-600`;
      case 'medium':
      case 'normal':
        return `${baseStyles} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/80 dark:text-yellow-200`;
      case 'low':
        return `${baseStyles} bg-green-100 text-green-800 dark:bg-green-900/80 dark:text-green-200`;
      default:
        return `${baseStyles} bg-gray-100 text-gray-800 dark:bg-gray-700/80 dark:text-gray-300`;
    }
  };

  const handleCreateOrder = async () => {
    setCreatingOrder(true);
    try {
      const res = await apiClient.post(
        `/orders`,
        {
          patient_id: newOrder.patient_id,
          dentist_id: newOrder.dentist_id,
          lab_id: newOrder.lab_id,
          work_type_id: newOrder.work_type_id,
          due_date: new Date(newOrder.due_date),
          file_types: getSelectedFileTypes(submissionChecklist),
          shade_type_id: newOrder.shade_type_id,
          material_id: newOrder.material_id,
          priority: newOrder.priority,
          special_instructions: newOrder.special_instructions,
          status: "accepted"
        },
        {
          withCredentials: true,
          headers: {
            "content-type": "application/json"
          }
        }
      );
      if (res.status != 201) {
        throw new Error("Error Creating an Order");
      }
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await apiClient.post(`/files`, formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          },
          withCredentials: true
        });

        const uploadedFile = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: response.data.url,
          category: 'uncategorized'
        };

        const res2 = await apiClient.post(
          `/order-files`,
          {
            url: response.data.url,
            order_id: res.data // or `newOrderID` if set
          },
          {
            withCredentials: true,
            headers: {
              "content-type": "application/json",
            }
          }
        );

        if (res2.status !== 201) {
          throw new Error("Error creating order file entry");
        }
        setUploadedFiles(prev => [...prev, uploadedFile]);
      }

      setToast({
        message: "Order created successfully.",
        type: "success",
        show: true
      });
    }
    catch (err: any) {
      setToast({
        message: err.message,
        type: "error",
        show: true
      })
    }
    finally {
      setCreatingOrder(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;

    const filesArray = Array.from(fileList);
    setSelectedFiles(prev => [...prev, ...filesArray]);

    event.target.value = ''; // allow re-selecting same file
  };

  const handleRequestAcceptance = async (order_id: number) => {
    if (!order_id) return;
    setAcceptingOrder(true);
    try {
      const res = await apiClient.put(
        `/orders/${order_id}`,
        {
          status: "accepted"
        },
        {
          withCredentials: true,
          headers: {
            "content-type": "application/json"
          }
        }
      );
      if (res.status != 202) {
        throw new Error("Error Accepting Request");
      }
      fetchOrders();
    }
    catch (err: any) {
      setToast({
        show: true,
        message: err.message,
        type: 'error'
      });
    }
    finally {
      setAcceptingOrder(false);
    }
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(selectedFiles.filter(file => file.name !== fileName));
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) return;

    setIsSending(true);
    try {
      const res = await apiClient.post(
        `/admins/invite`,
        {
          role: "lab",
          email: inviteEmail
        },
        {
          withCredentials: true,
          headers: {
            "content-type": "application/json"
          }
        }
      );
      if (res.status == 500) {
        throw new Error("Error Sending Invite");
      }
      setToast({
        message: "Invite Sent Successfully.",
        type: "success",
        show: true
      });
    } catch (error: any) {
      setToast({
        message: error.message,
        type: "error",
        show: true
      });
    } finally {
      setIsSending(false);
    }
  };

  const deleteOrder = async (orderId: number) => {
    if (!orderId) return;
    setOrderToDelete(orderId);
    setDeleteOrderDialogOpen(true);
  };

  const confirmOrderDelete = async () => {
    if (!orderToDelete) return;

    try {
      await apiClient.delete(`/orders/${orderToDelete}`);
      setToast({
        show: true,
        message: 'Order deleted successfully',
        type: 'success'
      });
      fetchOrders(); // Refresh the orders list
    } catch (error: any) {
      console.error('Error deleting order:', error);
      setToast({
        show: true,
        message: error.response?.data?.error || error.message || 'Error deleting order',
        type: 'error'
      });
    } finally {
      setDeleteOrderDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  const deleteLab = async (labId: string) => {
    // Open the delete confirmation dialog and set the lab to delete
    setLabToDelete(labId);
    setDeleteLabDialogOpen(true);
  };

  const confirmLabDelete = async () => {
    if (!labToDelete) return;

    try {
      await apiClient.delete(`/labs/${labToDelete}`);
      setLabs(labs.filter(lab => lab.lab_id !== labToDelete));
      setToast({
        show: true,
        message: 'Lab deleted successfully',
        type: 'success'
      });
    } catch (err: any) {
      const status = err.response?.status;
      setToast({
        show: true,
        message: status === 409 
          ? 'This Lab has associated orders. Please delete them before deleting the lab.' 
          : err.message || 'Failed to delete lab',
        type: 'error'
      });
    } finally {
      setDeleteLabDialogOpen(false);
      setLabToDelete(null);
    }
  };

  // ======================== SUBCOMPONENTS ========================

  const OrdersList = () => {
    const [orderSearchQuery, setOrderSearchQuery] = useState('');
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [selectedPriority, setSelectedPriority] = useState<string>('all');

    useEffect(() => {
      const query = orderSearchQuery.toLowerCase();
      let filtered = orders.filter(or => or.status !== "request");

      // Apply search filter
      if (query) {
        filtered = filtered.filter(order =>
          order.dentist?.name?.toLowerCase().includes(query) ||
          order.patient?.name?.toLowerCase().includes(query) ||
          order.lab?.email?.toLowerCase().includes(query)
        );
      }

      // Apply priority filter
      if (selectedPriority !== 'all') {
        filtered = filtered.filter(order => order.priority === selectedPriority);
      }

      setFilteredOrders(filtered);
    }, [orderSearchQuery, orders, selectedPriority]);

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Lab Orders</h2>
            <button
              onClick={() => setShowNewOrder(true)}
              className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Order
            </button>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search orders..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              {orderSearchQuery && (
                <button
                  type="button"
                  onClick={() => setOrderSearchQuery("")}
                  className="absolute right-2 top-[50%] -translate-y-[50%] text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

          </div>
        </div>

        {/* Table view for medium and large screens */}
        <div className="hidden md:block overflow-x-auto">
          {filteredOrders.filter(or => or.status != "request").length > 0 ?
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
                {filteredOrders.filter(or => or.status != "request").map((order) => (
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
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-gray-900">{order.work_type?.work_type || 'N/A'}</div>
                        {order.special_instructions && (
                          <div className="mt-1 text-xs text-gray-500">
                            <ul className="list-disc list-inside">
                              {order.special_instructions.split('\n').map((instruction, index) => (
                                instruction.trim() && (
                                  <li key={index} className="truncate max-w-xs" title={instruction.trim()}>
                                    {instruction.trim()}
                                  </li>
                                )
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </td>
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
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => deleteOrder(order.order_id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Order"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            :
            <p className='text-center text-gray-500 py-4'>No orders Available</p>
          }

        </div>

        {/* Card view for small screens */}
        <div className="md:hidden">
          <div className="divide-y divide-gray-200">
            {orders.filter(or => or.status != "request").map((order) => (
              <div key={order.order_id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Order #{order.order_id}</span>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${getPriorityColor(order.priority)}`}>
                    {order.priority} Priority
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-start">
                    <User className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Patient</p>
                      <p className="text-sm font-medium">{order.patient?.name || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <User className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Dentist</p>
                      <p className="text-sm font-medium">{order.dentist?.name || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Package className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Work Type</p>
                      <p className="text-sm font-medium">{order.work_type?.work_type || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Due Date</p>
                      <p className="text-sm font-medium">{order.due_date?.split("T")[0] || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Lab</p>
                      <p className="text-sm font-medium">{order.lab?.name || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteOrder(order.order_id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                    title="Delete Order"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
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
                <p><span className="font-medium">Due Date:</span> {order.due_date?.split("T")[0]}</p>
              </div>
            </div>
          </div>

          {order.status !== "request" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Progress Tracking</h3>
              <div className="space-y-3">
                {stages?.map((stage, index) => (
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
                  </div>
                ))}
              </div>
            </div>
          )}

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
                      href={`${backendURL}${file.url}`}
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

  const handleLabOrderSubmit = async (formData: any, files: File[]) => {
    setCreatingOrder(true);
    try {
      if (!formData.dentist_id) {
        throw new Error('Dentist is required');
      }
  
      const orderData = {
        patient_id: formData.patient_id || null,
        dentist_id: formData.dentist_id,
        lab_id: formData.lab_id || null,
        work_type_id: formData.work_type_id ? parseInt(formData.work_type_id) : null,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        shade_type_id: formData.shade_type_id ? parseInt(formData.shade_type_id) : null,
        material_id: formData.material_id ? parseInt(formData.material_id) : null,
        priority: formData.priority || null,
        special_instructions: formData.special_instructions || null,
        status: "accepted",
        file_types: formData.submissionChecklist ? JSON.stringify(formData.submissionChecklist) : null
      };
  
      const orderResponse = await apiClient.post(`/orders`, orderData);
      if (orderResponse.status !== 201) {
        throw new Error('Order creation failed');
      }
  
      const orderId = orderResponse.data;
  
      if (files.length > 0) {
        const uploadPromises = files.map(async (file, index) => {
          const fileFormData = new FormData();
          fileFormData.append("file", file);
  
          const uploadRes = await apiClient.post(`/files`, fileFormData, {
            headers: {
              "Content-Type": "multipart/form-data"
            },
            withCredentials: true
          });
  
          const uploadedFile = {
            id: Date.now() + index,
            name: file.name,
            size: file.size,
            type: file.type,
            url: uploadRes.data.url,
            category: 'uncategorized'
          };
  
          const dbRes = await apiClient.post(
            `/order-files`,
            {
              url: uploadedFile.url,
              order_id: orderId
            },
            {
              withCredentials: true,
              headers: {
                "Content-Type": "application/json"
              }
            }
          );
  
          if (dbRes.status !== 201) {
            throw new Error(`Failed to link file "${file.name}" to order`);
          }
  
          setUploadedFiles(prev => [...prev, uploadedFile]);
        });
  
        await Promise.all(uploadPromises);
      }
  
      setToast({
        show: true,
        message: 'Order created successfully',
        type: 'success'
      });
  
      fetchOrders();
      setShowNewOrder(false);
    } catch (error: any) {
      console.error('Error creating order:', error.response?.data || error);
      setToast({
        show: true,
        message: error.response?.data?.error || error.message || 'Error creating order',
        type: 'error'
      });
    } finally {
      setCreatingOrder(false);
    }
  };
  

  const LabsList = () => {
    const [labSearchQuery, setLabSearchQuery] = useState('');
    const [filteredLabs, setFilteredLabs] = useState<Lab[]>([]);

    useEffect(() => {
      const query = labSearchQuery.toLowerCase();
      if (!query) {
        setFilteredLabs(labs);
      } else {
        const filtered = labs.filter(lab =>
          lab.name.toLowerCase().includes(query) ||
          lab.email.toLowerCase().includes(query) ||
          lab.contact_person.toLowerCase().includes(query)
        );
        setFilteredLabs(filtered);
      }
    }, [labSearchQuery, labs]);

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Labs</h2>
          <div className="flex gap-4 items-center">
            <div className="relative w-64">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search labs..."
                value={labSearchQuery}
                onChange={(e) => setLabSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              {labSearchQuery && (
                <button
                  type="button"
                  onClick={() => setLabSearchQuery("")}
                  className="absolute right-2 top-[50%] -translate-y-[50%] text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowInviteDialog(true)}
              className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Invite Lab
            </button>
          </div>
        </div>
        {filteredLabs.length > 0 ?
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLabs.map((lab) => (
              <div key={lab.lab_id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{lab.name}</h3>
                    <button
                      onClick={() => deleteLab(lab.lab_id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{lab.contact_person}</p>
                </div>

                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mr-3">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-sm font-medium text-gray-900">{lab.contact_number}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mr-3">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{lab.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mr-3">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="text-sm text-gray-900">{lab.address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {lab.specialties.split(',').map((specialty, index) => (
                        <span
                          key={index}
                          className="bg-blue-50 text-blue-700 px-2.5 py-1 text-xs font-medium rounded-full flex items-center"
                        >
                          {specialty.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          :
          <p className='text-center text-gray-500 p-4'>No Labs Available</p>
        }

        {/* Delete Lab Confirmation Dialog */}
        <Dialog
          open={deleteLabDialogOpen}
          onOpenChange={(open) => {
            setDeleteLabDialogOpen(open);
            if (!open) {
              setLabToDelete(null);
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">Confirm Lab Deletion</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-700">Are you sure you want to delete this lab? This action cannot be undone.</p>
            </div>
            <DialogFooter className="flex space-x-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteLabDialogOpen(false)}
                className="px-4"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmLabDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4"
              >
                Delete Lab
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const Dashboard = () => {
    const stats = [
      { 
        title: 'Active Orders', 
        value: orders.filter(o => o.status === 'in-progress').length.toString(), 
        color: 'bg-blue-300',
        icon: Clock
      },
      { 
        title: 'Pending Pickup', 
        value: orders.filter(o => o.status === 'completed').length.toString(), 
        color: 'bg-emerald-300',
        icon: Package
      },
      {
        title: 'Overdue', 
        value: orders.filter(o =>
          o.due_date && new Date(o.due_date) < new Date() && o.status !== 'completed').length.toString(),
        color: 'bg-rose-300',
        icon: AlertCircle
      },
      {
        title: 'This Month', 
        value: orders.filter(o =>
          o.due_date && new Date(o.due_date).getMonth() === new Date().getMonth()).length.toString(),
        color: 'bg-violet-300',
        icon: Calendar
      }
    ];

    return (
      <div className="space-y-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`${stat.color} rounded-lg p-3 mr-4`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[...orders]
                  .sort((a, b) => new Date(b.due_date || '').getTime() - new Date(a.due_date || '').getTime())
                  .slice(0, 5)
                  .map((order) => (
                    <div key={order.order_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">#{order.order_id}</p>
                        <p className="text-sm text-gray-600">{order.patient?.name} - {order.work_type.work_type}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Due Dates</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[...orders]
                  .filter(order => order.status !== 'Completed')
                  .sort((a, b) => new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime())
                  .slice(0, 5)
                  .map((order) => (
                    <div key={order.order_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{order.patient?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-600">{order.work_type?.work_type || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{order.due_date?.split("T")[0]}</p>
                        <p className="text-xs text-gray-600">{order.lab?.name || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RequestsList = () => {
    const [requestSearchQuery, setRequestSearchQuery] = useState('');
    const [filteredRequests, setFilteredRequests] = useState<Order[]>([]);
    const [selectedPriority, setSelectedPriority] = useState<string>('all');

    useEffect(() => {
      const query = requestSearchQuery.toLowerCase();
      let filtered = orders.filter(or => or.status === "request");

      // Apply search filter
      if (query) {
        filtered = filtered.filter(order =>
          order.dentist?.name?.toLowerCase().includes(query) ||
          order.patient?.name?.toLowerCase().includes(query) ||
          order.lab?.email?.toLowerCase().includes(query)
        );
      }

      // Apply priority filter
      if (selectedPriority !== 'all') {
        filtered = filtered.filter(order => order.priority === selectedPriority);
      }

      setFilteredRequests(filtered);
    }, [requestSearchQuery, orders, selectedPriority]);

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Lab Requests</h2>
          </div>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search requests..."
                value={requestSearchQuery}
                onChange={(e) => setRequestSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              {requestSearchQuery && (
                <button
                  type="button"
                  onClick={() => setRequestSearchQuery("")}
                  className="absolute right-2 top-[50%] -translate-y-[50%] text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

          </div>
        </div>

        {/* Table view for medium and large screens */}
        <div className="hidden md:block overflow-x-auto">
          {filteredRequests.length > 0 ? (
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
                {filteredRequests.map((order) => (
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
                      <div className="flex justify-evenly items-center w-full gap-x-1">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="text-green-500 hover:text-green-600"
                          onClick={() => handleRequestAcceptance(order.order_id)}
                          disabled={acceptingOrder}
                        >
                          {acceptingOrder ? (
                            <Loader className='h-4 w-4' />
                          ) : (
                            <CircleCheckBig className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500 py-4">No requests available</p>
          )}
        </div>


        {/* Card view for small screens */}
        <div className="md:hidden">
          <div className="divide-y divide-gray-200">
            {orders.filter(or => or.status === "request").map((order) => (
              <div key={order.order_id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Request #{order.order_id}</span>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${getPriorityColor(order.priority)}`}>
                    {order.priority} Priority
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-start">
                    <User className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Patient</p>
                      <p className="text-sm font-medium">{order.patient?.name || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <User className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Dentist</p>
                      <p className="text-sm font-medium">{order.dentist?.name || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Package className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Work Type</p>
                      <p className="text-sm font-medium">{order.work_type?.work_type || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Due Date</p>
                      <p className="text-sm font-medium">{order.due_date?.split("T")[0] || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Lab</p>
                      <p className="text-sm font-medium">{order.lab?.name || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    className="p-2 text-green-500 hover:bg-green-50 rounded-full"
                    onClick={() => handleRequestAcceptance(order.order_id)}
                    disabled={acceptingOrder}
                    title="Accept Request"
                  >
                    {acceptingOrder ? (
                      <Loader className='h-4 w-4' />
                    ) : (
                      <CircleCheckBig className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div>
            <h1 className="text-3xl font-bold mt-7 md:mt-0 text-gray-900 mb-2">Lab Management</h1>
            <p className="text-gray-600">Manage your lab orders, requests, and partner labs.</p>
          </div>
        </div>
      </div>

      <div className="-mt-3 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { key: 'dashboard', label: 'Dashboard' },
              { key: 'requests', label: 'Requests' },
              { key: 'orders', label: 'Orders' },
              { key: 'labs', label: 'Partner Labs' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'requests' && <RequestsList />}
        {activeTab === 'orders' && <OrdersList />}
        {activeTab === 'labs' && <LabsList />}

        {selectedOrder && (
          <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        )}

        {showNewOrder && (
          <LabOrderForm
            onClose={() => setShowNewOrder(false)}
            onSubmit={handleLabOrderSubmit}
            patients={patients}
            dentists={dentists}
            labs={labs}
            workTypes={workTypes}
            shades={shades}
            materials={materials}
            workTypeRequirements={workTypeRequirements}
          />
        )}

        {/* Invite Lab Dialog */}
        {showInviteDialog && (
          <div className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md shadow-xl border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Invite Lab</h3>
                <button
                  onClick={() => {
                    setShowInviteDialog(false);
                    setInviteEmail('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter lab's email address"
                    autoComplete="off"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteDialog(false);
                      setInviteEmail('');
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    disabled={isSending}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendInvite}
                    disabled={!inviteEmail.trim() || isSending}
                    className={`px-4 py-2 text-white rounded-lg ${!inviteEmail.trim() || isSending
                      ? 'bg-emerald-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                      } flex items-center gap-2`}
                  >
                    {isSending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Send Invite
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            } text-white flex items-center`}>
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(prev => ({ ...prev, show: false }))}
              className="ml-4 text-white hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {showNewLab && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Add New Lab</h2>
                <button onClick={() => setShowNewLab(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <form className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lab Name</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" type="text" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" type="text" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" type="text" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" type="email" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" type="text" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialties (comma separated)</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" type="text" />
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button type="button" onClick={() => setShowNewLab(false)} className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="button" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Order Dialog */}
         <Dialog
           open={deleteOrderDialogOpen}
           onOpenChange={(open) => {
             setDeleteOrderDialogOpen(open);
             if (!open) {
               setOrderToDelete(null);
             }
           }}
         >
           <DialogContent className="max-w-md">
             <DialogHeader>
               <DialogTitle className="text-xl font-bold text-gray-900">Confirm Order Deletion</DialogTitle>
             </DialogHeader>
             <div className="py-4">
               <p className="text-gray-700">Are you sure you want to delete this order? This action cannot be undone.</p>
             </div>
             <DialogFooter className="flex space-x-2 justify-end">
               <Button
                 variant="outline"
                 onClick={() => setDeleteOrderDialogOpen(false)}
                 className="px-4"
               >
                 Cancel
               </Button>
               <Button
                 variant="destructive"
                 onClick={confirmOrderDelete}
                 className="bg-red-600 hover:bg-red-700 text-white px-4"
               >
                 Delete Order
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
      </div>
    </div>
  );
};

export default DentalLabModule;