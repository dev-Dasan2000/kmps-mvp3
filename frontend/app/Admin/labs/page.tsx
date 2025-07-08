"use client";

import React, { useState, useEffect, useContext, useRef } from 'react';
import { Loader, Calendar, Clock, User, MapPin, Phone, Mail, Package, FileText, AlertCircle, CheckCircle, Eye, Edit, Plus, Search, Filter, X, CircleCheckBig } from 'lucide-react';
import { AuthContext } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { headers } from 'next/headers';
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
  }, [isLoadingAuth])

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

  const handleCreateOrder = async () => {
    setCreatingOrder(true);
    try {
      const res = await axios.post(
        `${backendURL}/orders`,
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

        const response = await axios.post(`${backendURL}/files`, formData, {
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

        const res2 = await axios.post(
          `${backendURL}/order-files`,
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
    setAcceptingOrder(true);
    try {
      const res = await axios.put(
        `${backendURL}/orders/${order_id}`,
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
      const res = await axios.post(
        `${backendURL}/admins/invite`,
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

  // ======================== SUBCOMPONENTS ========================

  const OrdersList = () => (
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

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
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
            {orders.filter(or => or.status != "request").map((order) => (
              <tr key={order.order_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_id}</td>
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
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="text-gray-600 hover:text-gray-900">
                    <Edit className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

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

  const NewOrderForm = () => (
    <div className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Create New Lab Order</h2>
          <button
            onClick={() => setShowNewOrder(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                <select
                  value={newOrder.patient_id}
                  onChange={(e) =>
                    setNewOrder({
                      ...newOrder,
                      patient_id: e.target.value,

                    })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'>
                  <option value="">Select patient</option>
                  {patients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.patient_id} - {p.name}
                    </option>
                  ))}
                </select>

              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dentist</label>
                <select
                  value={newOrder.dentist_id}
                  onChange={(e) =>
                    setNewOrder({
                      ...newOrder,
                      dentist_id: e.target.value,

                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Dentist</option>
                  {dentists.map((dent) => (
                    <option key={dent.dentist_id} value={dent.dentist_id}>
                      {dent.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lab</label>
                <select
                  value={newOrder.lab_id}
                  onChange={(e) => setNewOrder({ ...newOrder, lab_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Lab</option>
                  {labs.map((lab) => (
                    <option key={lab.lab_id} value={lab.lab_id}>{lab.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
                <select
                  value={newOrder.work_type_id}
                  onChange={(e) => setNewOrder({ ...newOrder, work_type_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="0">Select Work Type</option>
                  {workTypes.map((workType) => (
                    <option key={workType.work_type_id} value={workType.work_type_id}>{workType.work_type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={newOrder.due_date?.split("T")[0]}
                  onChange={(e) => setNewOrder({ ...newOrder, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {newOrder.work_type_id > 0 && workTypeRequirements[workTypes.find(w => w.work_type_id === newOrder.work_type_id)?.work_type || ''] && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Required Items for {workTypes.find(w => w.work_type_id === newOrder.work_type_id)?.work_type}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Required Items</h4>
                  <ul className="space-y-1">
                    {workTypeRequirements[workTypes.find(w => w.work_type_id === newOrder.work_type_id)?.work_type || ''].required.map((item, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-700">
                        <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Optional Items</h4>
                  <ul className="space-y-1">
                    {workTypeRequirements[workTypes.find(w => w.work_type_id === newOrder.work_type_id)?.work_type || ''].optional.map((item, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Digital Files & Documents</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Files</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept=".stl,.obj,.ply,.dcm,.dco,.jpg,.jpeg,.png,.pdf,.doc,.docx"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Drop files here or <span className="text-blue-600 hover:text-blue-500">browse</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    STL, OBJ, PLY, DICOM, Images, PDF documents
                  </p>
                </label>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Uploaded Files</h4>
                {selectedFiles.map((file) => (
                  <div key={file.name} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(file.name)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Submission Checklist</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Digital Files</h4>
                <div className="space-y-2">
                  {Object.entries(submissionChecklist.digitalFiles).map(([key, checked]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setSubmissionChecklist({
                          ...submissionChecklist,
                          digitalFiles: { ...submissionChecklist.digitalFiles, [key]: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Physical Items</h4>
                <div className="space-y-2">
                  {Object.entries(submissionChecklist.physicalItems).map(([key, checked]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setSubmissionChecklist({
                          ...submissionChecklist,
                          physicalItems: { ...submissionChecklist.physicalItems, [key]: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Documentation</h4>
                <div className="space-y-2">
                  {Object.entries(submissionChecklist.documentation).map(([key, checked]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setSubmissionChecklist({
                          ...submissionChecklist,
                          documentation: { ...submissionChecklist.documentation, [key]: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Clinical Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shade Selection</label>
                <select
                  value={newOrder.shade_type_id}
                  onChange={(e) => setNewOrder({ ...newOrder, shade_type_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="0">Select Shade</option>
                  {shades.map((shade) => (
                    <option key={shade.shade_type_id} value={shade.shade_type_id}>{shade.shade}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material Type</label>
                <select
                  value={newOrder.material_id}
                  onChange={(e) => setNewOrder({ ...newOrder, material_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="0">Select Material</option>
                  {materials.map((material) => (
                    <option key={material.material_id} value={material.material_id}>{material.material}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newOrder.priority}
                  onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Rush">Rush (+50% cost)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
            <textarea
              value={newOrder.special_instructions}
              onChange={(e) => setNewOrder({ ...newOrder, special_instructions: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Include specific instructions, patient preferences, anatomical considerations, contact points, occlusal requirements, etc."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => setShowNewOrder(false)}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateOrder}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Order & Send to Lab
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const LabsList = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Partner Laboratories</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your partner dental laboratories</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
            onClick={() => setShowInviteDialog(true)}
          >
            <Mail className="h-4 w-4" />
            Invite Lab
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {labs.map((lab) => (
            <div key={lab.lab_id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{lab.name}</h3>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${lab.status === 'Active' ? 'bg-green-100 text-green-800' :
                    lab.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                    {lab.status}
                  </span>
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

                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end space-x-2">
                  <button
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                    title="Edit Lab"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const Dashboard = () => {
    const stats = [
      { title: 'Active Orders', value: orders.filter(o => o.status === 'In Progress').length.toString(), color: 'bg-blue-500' },
      { title: 'Pending Pickup', value: orders.filter(o => o.status === 'Ready for Pickup').length.toString(), color: 'bg-green-500' },
      {
        title: 'Overdue', value: orders.filter(o =>
          o.due_date && new Date(o.due_date) < new Date() && o.status !== 'Completed').length.toString(),
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

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
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
            {orders.filter(or => or.status === "request").map((order) => (
              <tr key={order.order_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_id}</td>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.due_date}</td>
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
                    <button className="text-gray-600 hover:text-gray-900">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      className="text-green-500 hover:text-green-600"
                      onClick={() => handleRequestAcceptance(order.order_id)}
                      disabled={acceptingOrder}
                    >
                      {acceptingOrder ? (
                        <Loader className='h-4 w-4' />
                      )
                        :
                        (<CircleCheckBig className="h-4 w-4" />)}

                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

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

        {showNewOrder && <NewOrderForm />}

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
      </div>
    </div>
  );
};

export default DentalLabModule;