"use client";

import React, { useState, useEffect, useContext, useRef } from 'react';
import { Loader, Calendar, Clock, User, MapPin, Phone, Mail, Package, FileText, AlertCircle, CheckCircle, Eye, Edit, Plus, Search, Filter, X, CircleCheckBig } from 'lucide-react';
import { AuthContext } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DentistLabOrderForm } from '@/components/DentistLabOrderForm';

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

// Add this type definition
type FormInputs = {
  patient_id: string;
  dentist_id: string;
  lab_id: string;
  work_type_id: number;
  due_date: string;
  shade_type_id?: number;
  material_id?: number;
  priority: string;
  special_instructions: string;
  files: FileList;
};

// Add validation schema
const orderSchema = z.object({
  patient_id: z.string().min(1, 'Patient is required'),
  dentist_id: z.string().min(1, 'Dentist is required'),
  lab_id: z.string().min(1, 'Lab is required'),
  work_type_id: z.number().min(1, 'Work type is required'),
  due_date: z.string().min(1, 'Due date is required'),
  shade_type_id: z.number().optional(),
  material_id: z.number().optional(),
  priority: z.string().min(1, 'Priority is required'),
  special_instructions: z.string().optional(),
  files: z.any().optional()
});


// ======================== COMPONENT ========================
const DentalLabModule = () => {

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, isLoggedIn, isLoadingAuth } = useContext(AuthContext);

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
      const fetchedOrders = await axios.get(
        `${backendURL}/orders/fordentist/${user.id}`
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

  const fetchLabs = async () => {
    setLoadingLabs(true);
    try {
      const res = await axios.get(
        `${backendURL}/labs`
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
      const res = await axios.get(
        `${backendURL}/work-types`
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
      const res = await axios.get(
        `${backendURL}/patients`
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
      const res = await axios.get(
        `${backendURL}/dentists`
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
      const res = await axios.get(
        `${backendURL}/shades`
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
      const res = await axios.get(
        `${backendURL}/material-types`
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
    if (user.role != "dentist") {
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
  }, [isLoadingAuth])

  const [submissionChecklist, setSubmissionChecklist] = useState({
    digitalFiles: {
      scanFiles: false,
      designFiles: false,
      photos: false
    },
    physicalItems: {
      impressions: false,
      models: false,
      articulators: false
    },
    documentation: {
      prescriptionForm: false,
      shadeGuide: false,
      notes: false
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
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Ready for Pickup': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      case 'Delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'High': return 'text-red-600';
      case 'Normal': return 'text-green-600';
      case 'Low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const Dashboard = () => {
    const stats = [
      { title: 'Active Orders', value: orders.filter(o => o.status === 'in-progress').length.toString(), color: 'bg-blue-500' },
      { title: 'Pending Pickup', value: orders.filter(o => o.status === 'completed').length.toString(), color: 'bg-green-500' },
      {
        title: 'Overdue', value: orders.filter(o =>
          o.due_date && new Date(o.due_date) < new Date() && o.status !== 'completed').length.toString(),
        color: 'bg-red-500'
      },
      {
        title: 'This Month', value: orders.filter(o =>
          o.due_date && new Date(o.due_date).getMonth() === new Date().getMonth()).length.toString(),
        color: 'bg-purple-500'
      }
    ];

    return (
      <div className="space-y-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`${stat.color} rounded-lg p-3 mr-4`}>
                  <Package className="h-6 w-6 text-white" />
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

  const RequestsList = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Lab Requests</h2>
          <button
            onClick={() => setShowNewOrder(true)}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Request
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Work Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lab</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.filter(or => or.status === "request").map((order) => (
              <tr key={order.order_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_id}</td>
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
                      <div className="mt-1 text-sm text-gray-500">
                        {order.special_instructions.split('\n').map((instruction, index) => (
                          instruction.trim() && (
                            <div key={index} className="flex items-start space-x-1">
                              <span className="mt-1.5">•</span>
                              <span className="flex-1 truncate" title={instruction.trim()}>
                                {instruction.trim()}
                              </span>
                            </div>
                          )
                        ))}
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.due_date ? new Date(order.due_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-medium ${getPriorityColor(order.priority)}`}>
                    {order.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="text-emerald-500 hover:text-emerald-600 inline-flex items-center justify-center"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        <div className="divide-y divide-gray-200">
          {orders.filter(or => or.status === "request").map((order) => (
            <div key={order.order_id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">Order #{order.order_id}</div>
                  <div className="text-xs text-gray-500">
                    {order.due_date ? new Date(order.due_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'N/A'}
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-gray-500">Patient</div>
                  <div className="text-sm text-gray-900">{order.patient?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500">Work Type</div>
                  <div className="text-sm text-gray-900">{order.work_type?.work_type || 'N/A'}</div>
                  {order.special_instructions && (
                    <div className="mt-1 text-sm text-gray-500">
                      {order.special_instructions.split('\n').map((instruction, index) => (
                        instruction.trim() && (
                          <div key={index} className="flex items-start space-x-1">
                            <span className="mt-1.5">•</span>
                            <span className="flex-1 truncate" title={instruction.trim()}>
                              {instruction.trim()}
                            </span>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500">Lab</div>
                  <div className="text-sm text-gray-900">{order.lab?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500">Priority</div>
                  <span className={`text-sm font-medium ${getPriorityColor(order.priority)}`}>
                    {order.priority}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="text-blue-600 hover:text-blue-900 inline-flex items-center justify-center"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const OrdersList = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Lab Orders</h2>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Work Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lab</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.filter(or => or.status != "request").map((order) => (
              <tr key={order.order_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_id}</td>
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
                      <div className="mt-1 text-sm text-gray-500">
                        {order.special_instructions.split('\n').map((instruction, index) => (
                          instruction.trim() && (
                            <div key={index} className="flex items-start space-x-1">
                              <span className="mt-1.5">•</span>
                              <span className="flex-1 truncate" title={instruction.trim()}>
                                {instruction.trim()}
                              </span>
                            </div>
                          )
                        ))}
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.due_date ? new Date(order.due_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-medium ${getPriorityColor(order.priority)}`}>
                    {order.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="text-blue-600 hover:text-blue-900 inline-flex items-center justify-center"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        <div className="divide-y divide-gray-200">
          {orders.filter(or => or.status != "request").map((order) => (
            <div key={order.order_id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">Order #{order.order_id}</div>
                  <div className="text-xs text-gray-500">
                    {order.due_date ? new Date(order.due_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'N/A'}
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-gray-500">Patient</div>
                  <div className="text-sm text-gray-900">{order.patient?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500">Work Type</div>
                  <div className="text-sm text-gray-900">{order.work_type?.work_type || 'N/A'}</div>
                  {order.special_instructions && (
                    <div className="mt-1 text-sm text-gray-500">
                      {order.special_instructions.split('\n').map((instruction, index) => (
                        instruction.trim() && (
                          <div key={index} className="flex items-start space-x-1">
                            <span className="mt-1.5">•</span>
                            <span className="flex-1 truncate" title={instruction.trim()}>
                              {instruction.trim()}
                            </span>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500">Lab</div>
                  <div className="text-sm text-gray-900">{order.lab?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500">Priority</div>
                  <span className={`text-sm font-medium ${getPriorityColor(order.priority)}`}>
                    {order.priority}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="text-blue-600 hover:text-blue-900 inline-flex items-center justify-center"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const OrderDetails = ({ order, onClose }: { order: Order; onClose: () => void }) => {
    const orderStages = getStagesForOrder(order.order_id);

    return (
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
                  <p><span className="font-medium">Due Date:</span> {order.due_date ? new Date(order.due_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'N/A'}</p>
                  <p><span className="font-medium">Priority:</span> <span className={getPriorityColor(order.priority)}>{order.priority}</span></p>
                  <p><span className="font-medium">Status:</span> <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>{order.status}</span></p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Progress Tracking</h3>
              <div className="space-y-3">
                {orderStages?.map((stage, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${stage.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className={`flex-1 ${stage.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                      {stage.name}
                    </span>
                    {stage.completed && stage.date && (
                      <span className="text-sm text-gray-500">
                        {new Date(stage.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
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
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {order.special_instructions.split('\n').map((instruction, index) => (
                    instruction.trim() && (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="mt-1">•</span>
                        <span className="text-gray-700">{instruction.trim()}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-0 md:py-2">
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

        {selectedOrder && (
          <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        )}

        {showNewOrder && (
          <DentistLabOrderForm
            onClose={() => setShowNewOrder(false)}
            onSubmit={async (data, files) => {
              setCreatingOrder(true);
              try {
                // Create order
                const orderRes = await axios.post(
                  `${backendURL}/orders`,
                  {
                    patient_id: data.patient_id,
                    dentist_id: data.dentist_id,
                    lab_id: data.lab_id,
                    work_type_id: data.work_type_id,
                    due_date: new Date(data.due_date),
                    file_types: getSelectedFileTypes(submissionChecklist),
                    shade_type_id: data.shade_type_id,
                    material_id: data.material_id,
                    priority: data.priority,
                    special_instructions: data.special_instructions,
                    status: "request"
                  },
                  {
                    withCredentials: true,
                    headers: {
                      "content-type": "application/json"
                    }
                  }
                );

                if (orderRes.status !== 201) {
                  throw new Error("Error creating order");
                }

                // Upload files
                for (const file of files) {
                  const formData = new FormData();
                  formData.append("file", file);

                  const fileRes = await axios.post(`${backendURL}/files`, formData, {
                    headers: {
                      "Content-Type": "multipart/form-data"
                    },
                    withCredentials: true
                  });

                  await axios.post(
                    `${backendURL}/order-files`,
                    {
                      url: fileRes.data.url,
                      order_id: orderRes.data
                    },
                    {
                      withCredentials: true,
                      headers: {
                        "content-type": "application/json",
                      }
                    }
                  );
                }

                setToast({
                  message: "Order created successfully",
                  type: "success",
                  show: true
                });
                
                fetchOrders();
              } catch (err: any) {
                setToast({
                  message: err.message,
                  type: "error",
                  show: true
                });
              } finally {
                setCreatingOrder(false);
              }
            }}
            patients={patients}
            dentistId={user.id} // Pass the current dentist's ID
            labs={labs}
            workTypes={workTypes}
            shades={shades}
            materials={materials}
            workTypeRequirements={workTypeRequirements}
          />
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
      </div>
    </div>
  );
};

export default DentalLabModule;
