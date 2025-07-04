"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, Phone, Mail, Package, FileText, AlertCircle, CheckCircle, Eye, Edit, Plus, Search, Filter, X, CircleCheckBig } from 'lucide-react';

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
  order_files: OrderFile[]
};

// ======================== MOCK DATA ========================
const mockStages: Stage[] = [
  { stage_id: 1, name: 'Impression Sent' },
  { stage_id: 2, name: 'Wax Try-in' },
  { stage_id: 3, name: 'Final Processing' },
  { stage_id: 4, name: 'Quality Check' },
  { stage_id: 5, name: 'Delivery' }
];

const mockWorkTypes: WorkType[] = [
  { work_type_id: 1, work_type: 'Complete Denture' },
  { work_type_id: 2, work_type: 'Partial Denture' },
  { work_type_id: 3, work_type: 'Crown & Bridge' },
  { work_type_id: 4, work_type: 'Implant Restoration' },
  { work_type_id: 5, work_type: 'Reline' },
  { work_type_id: 6, work_type: 'Repair' }
];

const mockShades: Shade[] = [
  { shade_type_id: 1, shade: 'A1' },
  { shade_type_id: 2, shade: 'A2' },
  { shade_type_id: 3, shade: 'A3' },
  { shade_type_id: 4, shade: 'B1' },
  { shade_type_id: 5, shade: 'B2' },
  { shade_type_id: 6, shade: 'C1' },
  { shade_type_id: 7, shade: 'D2' }
];

const mockMaterialTypes: MaterialType[] = [
  { material_id: 1, material: 'Porcelain Fused to Metal' },
  { material_id: 2, material: 'Zirconia' },
  { material_id: 3, material: 'Lithium Disilicate' },
  { material_id: 4, material: 'Acrylic Resin' },
  { material_id: 5, material: 'Chrome Cobalt' }
];

const mockLabs: Lab[] = [
  {
    lab_id: 'LAB-001',
    name: 'PrecisionDental Lab',
    contact_person: 'James Wilson',
    contact_number: '+1-555-0123',
    email: 'orders@precisiondental.com',
    address: '123 Lab Street, City, State 12345',
    specialties: 'Complete Dentures, Partial Dentures, Relines',
    rating: 4.8,
    turnaround_time: '7-10 days',
    status: 'Active'
  },
  {
    lab_id: 'LAB-002',
    name: 'Advanced Dental Solutions',
    contact_person: 'Lisa Chen',
    contact_number: '+1-555-0124',
    email: 'lab@advanceddental.com',
    address: '456 Tech Ave, City, State 12346',
    specialties: 'Crown & Bridge, Implants, Orthodontics',
    rating: 4.6,
    turnaround_time: '5-7 days',
    status: 'Active'
  }
];

const mockPatients: PatientType[] = [
  { patient_id: 'P001', name: 'John Smith' },
  { patient_id: 'P002', name: 'Mary Davis' }
];

const mockDentists: DenstistType[] = [
  { dentist_id: 'D001', name: 'Sarah Johnson' },
  { dentist_id: 'D002', name: 'Michael Chen' }
];

const mockOrders: Order[] = [
  {
    order_id: 1,
    patient: { patient_id: 'P001', name: 'John Smith' },
    dentist: { dentist_id: 'D001', name: 'Sarah Johnson' },
    lab: mockLabs[0],
    work_type: { work_type_id: 1, work_type: 'Complete Denture' },
    due_date: '2025-01-22',
    file_types: 'STL,PDF,JPG',
    shade: { shade_type_id: 2, shade: 'A2' },
    material: { material_id: 4, material: 'Acrylic Resin' },
    priority: 'Normal',
    special_instructions: 'Upper complete denture, standard shade A2',
    status: 'In Progress',
    order_files: [
      { file_id: 1, url: '/files/order1-impression.stl', order_id: 1 },
      { file_id: 2, url: '/files/order1-prescription.pdf', order_id: 1 }
    ]
  },
  {
    order_id: 2,
    patient: { patient_id: 'P002', name: 'Mary Davis' },
    dentist: { dentist_id: 'D002', name: 'Michael Chen' },
    lab: mockLabs[1],
    work_type: { work_type_id: 3, work_type: 'Crown & Bridge' },
    due_date: '2025-01-17',
    file_types: 'STL,PDF',
    shade: { shade_type_id: 4, shade: 'B1' },
    material: { material_id: 1, material: 'Porcelain Fused to Metal' },
    priority: 'High',
    special_instructions: 'PFM crown #14, shade B1',
    status: 'Ready for Pickup',
    order_files: [
      { file_id: 3, url: '/files/order2-impression.stl', order_id: 2 },
      { file_id: 4, url: '/files/order2-prescription.pdf', order_id: 2 }
    ]
  }
];

const mockStageAssigns: StageAssign[] = [
  { stage_assign_id: 1, stage_id: 1, order_id: 1, completed: true, date: '2025-01-15' },
  { stage_assign_id: 2, stage_id: 2, order_id: 1, completed: true, date: '2025-01-18' },
  { stage_assign_id: 3, stage_id: 3, order_id: 1, completed: false, date: '' },
  { stage_assign_id: 4, stage_id: 1, order_id: 2, completed: true, date: '2025-01-10' },
  { stage_assign_id: 5, stage_id: 2, order_id: 2, completed: true, date: '2025-01-13' },
  { stage_assign_id: 6, stage_id: 3, order_id: 2, completed: true, date: '2025-01-16' },
  { stage_assign_id: 7, stage_id: 4, order_id: 2, completed: true, date: '2025-01-17' }
];

// ======================== COMPONENT ========================

const DentalLabModule = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'orders' | 'labs'>('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [labs, setLabs] = useState<Lab[]>(mockLabs);
  const [workTypes] = useState<WorkType[]>(mockWorkTypes);
  const [shades] = useState<Shade[]>(mockShades);
  const [materials] = useState<MaterialType[]>(mockMaterialTypes);
  const [stages] = useState<Stage[]>(mockStages);
  const [stageAssigns] = useState<StageAssign[]>(mockStageAssigns);

  const [newOrder, setNewOrder] = useState({
    patient_id: '',
    patient_name: '',
    dentist_id: '',
    dentist_name: '',
    lab_id: '',
    work_type_id: 0,
    due_date: '',
    priority: 'Normal',
    special_instructions: '',
    shade_type_id: 0,
    material_id: 0
  });

  const [showNewLab, setShowNewLab] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

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

  const handleCreateOrder = () => {
    const orderId = Math.max(...orders.map(o => o.order_id), 0) + 1;
    const lab = labs.find(l => l.lab_id === newOrder.lab_id);
    const workType = workTypes.find(w => w.work_type_id === newOrder.work_type_id);
    const shade = shades.find(s => s.shade_type_id === newOrder.shade_type_id);
    const material = materials.find(m => m.material_id === newOrder.material_id);

    const orderDate = new Date().toISOString().split('T')[0];
    
    // Find related entities
    const patient = mockPatients.find(p => p.patient_id === newOrder.patient_id);
    const dentist = mockDentists.find(d => d.dentist_id === newOrder.dentist_id);

    if (!lab || !workType || !shade || !material || !patient || !dentist) {
      setToast({
        show: true,
        message: 'Missing required order information',
        type: 'error'
      });
      return;
    }

    const newOrderWithId: Order = {
      order_id: orderId,
      patient: {
        patient_id: patient.patient_id,
        name: patient.name
      },
      dentist: {
        dentist_id: dentist.dentist_id,
        name: dentist.name
      },
      lab: lab,
      work_type: workType,
      due_date: newOrder.due_date,
      file_types: uploadedFiles.map(f => f.type.split('/')[1].toUpperCase()).join(','),
      shade: shade,
      material: material,
      priority: newOrder.priority,
      special_instructions: newOrder.special_instructions,
      status: 'Pending',
      order_files: uploadedFiles.map((file, index) => ({
        file_id: orderId * 100 + index,
        url: `/uploads/${file.name}`,
        order_id: orderId
      }))
    };

    setOrders([...orders, newOrderWithId]);
    setNewOrder({
      patient_id: '',
      patient_name: '',
      dentist_id: '',
      dentist_name: '',
      lab_id: '',
      work_type_id: 0,
      due_date: '',
      priority: 'Normal',
      special_instructions: '',
      shade_type_id: 0,
      material_id: 0
    });
    setUploadedFiles([]);
    setShowNewOrder(false);
    setToast({
      show: true,
      message: 'Order created successfully!',
      type: 'success'
    });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const calculateCost = (workTypeId: number, priority: string): number => {
    const basePrices: Record<number, number> = {
      1: 450, // Complete Denture
      2: 350, // Partial Denture
      3: 320, // Crown & Bridge
      4: 500, // Implant Restoration
      5: 150, // Reline
      6: 200  // Repair
    };

    const priorityMultipliers: Record<string, number> = {
      'Low': 0.9,
      'Normal': 1,
      'High': 1.2,
      'Rush': 1.5
    };

    const basePrice = basePrices[workTypeId] || 0;
    const multiplier = priorityMultipliers[priority] || 1;
    return basePrice * multiplier;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      category: 'uncategorized'
    }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  const handleRequestAcceptance = async (order_id: number) => {
    setOrders(orders.map(order => 
      order.order_id === order_id ? { ...order, status: 'In Progress' } : order
    ));
    setToast({
      show: true,
      message: `Order #${order_id} accepted and marked as In Progress`,
      type: 'success'
    });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })));
  };

  const removeFile = (fileId: number) => {
    setUploadedFiles(uploadedFiles.filter(file => file.id !== fileId));
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) return;

    setIsSending(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setToast({
        show: true,
        message: `Invitation sent to ${inviteEmail}`,
        type: 'success'
      });

      setInviteEmail('');
      setShowInviteDialog(false);

      setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3000);

    } catch (error) {
      setToast({
        show: true,
        message: 'Failed to send invitation. Please try again.',
        type: 'error'
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
            {orders.map((order) => (
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
                <p><span className="font-medium">Dentist:</span> Dr. {order.dentist_name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Order Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Work Type:</span> {order.work_type?.work_type || 'N/A'}</p>
                <p><span className="font-medium">Lab:</span> {order.lab?.name || 'N/A'}</p>
                <p><span className="font-medium">Order Date:</span> {order.order_date}</p>
                <p><span className="font-medium">Due Date:</span> {order.due_date}</p>
                <p><span className="font-medium">Cost:</span> ${order.cost?.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Progress Tracking</h3>
            <div className="space-y-3">
              {order.stages?.map((stage, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${stage.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className={`flex-1 ${stage.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                    {stage.name}
                  </span>
                  {stage.completed && stage.date && (
                    <span className="text-sm text-gray-500">{stage.date}</span>
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

          {order.files && order.files.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Files</h3>
              <div className="space-y-2">
                {order.files.map((file) => (
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                <input
                  type="text"
                  value={newOrder.patient_name}
                  onChange={(e) => setNewOrder({ ...newOrder, patient_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                <input
                  type="text"
                  value={newOrder.patient_id}
                  onChange={(e) => setNewOrder({ ...newOrder, patient_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dentist</label>
                <select
                  value={newOrder.dentist_id}
                  onChange={(e) => setNewOrder({ 
                    ...newOrder, 
                    dentist_id: e.target.value,
                    dentist_name: e.target.options[e.target.selectedIndex].text
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Dentist</option>
                  <option value="D001">Dr. Sarah Johnson</option>
                  <option value="D002">Dr. Michael Chen</option>
                  <option value="D003">Dr. Emily Wilson</option>
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
                  value={newOrder.due_date}
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

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Uploaded Files</h4>
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
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
      { title: 'Overdue', value: orders.filter(o => 
        o.due_date && new Date(o.due_date) < new Date() && o.status !== 'Completed').length.toString(), 
        color: 'bg-red-500' 
      },
      { title: 'This Month', value: orders.filter(o => 
        o.order_date && new Date(o.order_date).getMonth() === new Date().getMonth()).length.toString(), 
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
                  .sort((a, b) => new Date(b.order_date || '').getTime() - new Date(a.order_date || '').getTime())
                  .slice(0, 5)
                  .map((order) => (
                    <div key={order.order_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">#{order.order_id}</p>
                        <p className="text-sm text-gray-600">{order.patient.name} - {order.work_type.work_type}</p>
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
                        <p className="text-sm font-medium text-gray-900">{order.due_date}</p>
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
            {orders.map((order) => (
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
                    >
                      <CircleCheckBig className="h-4 w-4" />
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