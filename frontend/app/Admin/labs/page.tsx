"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, Phone, Mail, Package, FileText, AlertCircle, CheckCircle, Eye, Edit, Plus, Search, Filter, X } from 'lucide-react';

type Stage = {
  name: string;
  completed: boolean;
  date: string | null;
};

type Order = {
  id: string;
  patientName: string;
  patientId: string;
  dentist: string;
  labName: string;
  workType: string;
  status: string;
  orderDate: string;
  dueDate: string;
  priority: string;
  cost: number;
  notes: string;
  stages: Stage[];
};

const DentalLabModule = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ORD-2025-001',
      patientName: 'John Smith',
      patientId: 'PAT-12345',
      dentist: 'Dr. Sarah Johnson',
      labName: 'PrecisionDental Lab',
      workType: 'Complete Denture',
      status: 'In Progress',
      orderDate: '2025-01-15',
      dueDate: '2025-01-22',
      priority: 'Normal',
      cost: 450.00,
      notes: 'Upper complete denture, standard shade A2',
      stages: [
        { name: 'Impression Sent', completed: true, date: '2025-01-15' },
        { name: 'Wax Try-in', completed: true, date: '2025-01-18' },
        { name: 'Final Processing', completed: false, date: null },
        { name: 'Quality Check', completed: false, date: null },
        { name: 'Delivery', completed: false, date: null }
      ]
    },
    {
      id: 'ORD-2025-002',
      patientName: 'Mary Davis',
      patientId: 'PAT-12346',
      dentist: 'Dr. Michael Chen',
      labName: 'Advanced Dental Solutions',
      workType: 'Crown & Bridge',
      status: 'Ready for Pickup',
      orderDate: '2025-01-10',
      dueDate: '2025-01-17',
      priority: 'High',
      cost: 320.00,
      notes: 'PFM crown #14, shade B1',
      stages: [
        { name: 'Impression Sent', completed: true, date: '2025-01-10' },
        { name: 'Wax Try-in', completed: true, date: '2025-01-13' },
        { name: 'Final Processing', completed: true, date: '2025-01-16' },
        { name: 'Quality Check', completed: true, date: '2025-01-17' },
        { name: 'Delivery', completed: false, date: null }
      ]
    }
  ]);

  const [labs, setLabs] = useState([
    {
      id: 'LAB-001',
      name: 'PrecisionDental Lab',
      contact: 'James Wilson',
      phone: '+1-555-0123',
      email: 'orders@precisiondental.com',
      address: '123 Lab Street, City, State 12345',
      specialties: ['Complete Dentures', 'Partial Dentures', 'Relines'],
      rating: 4.8,
      turnaroundTime: '7-10 days',
      status: 'Active'
    },
    {
      id: 'LAB-002',
      name: 'Advanced Dental Solutions',
      contact: 'Lisa Chen',
      phone: '+1-555-0124',
      email: 'lab@advanceddental.com',
      address: '456 Tech Ave, City, State 12346',
      specialties: ['Crown & Bridge', 'Implants', 'Orthodontics'],
      rating: 4.6,
      turnaroundTime: '5-7 days',
      status: 'Active'
    }
  ]);

  const [newOrder, setNewOrder] = useState({
    patientName: '',
    patientId: '',
    dentist: '',
    labName: '',
    workType: '',
    dueDate: '',
    priority: 'Normal',
    notes: ''
  });

  const [showNewLab, setShowNewLab] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{show: boolean; message: string; type: 'success' | 'error'}>({show: false, message: '', type: 'success'});

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Ready for Pickup': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      case 'Delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600';
      case 'Normal': return 'text-green-600';
      case 'Low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const handleCreateOrder = () => {
    const orderId = `ORD-2025-${String(orders.length + 1).padStart(3, '0')}`;
    const newOrderWithId = {
      ...newOrder,
      id: orderId,
      status: 'Pending',
      orderDate: new Date().toISOString().split('T')[0],
      cost: 0,
      stages: [
        { name: 'Impression Sent', completed: false, date: null },
        { name: 'Wax Try-in', completed: false, date: null },
        { name: 'Final Processing', completed: false, date: null },
        { name: 'Quality Check', completed: false, date: null },
        { name: 'Delivery', completed: false, date: null }
      ]
    };
    
    setOrders([...orders, newOrderWithId]);
    setNewOrder({
      patientName: '',
      patientId: '',
      dentist: '',
      labName: '',
      workType: '',
      dueDate: '',
      priority: 'Normal',
      notes: ''
    });
    setShowNewOrder(false);
  };

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
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{order.patientName}</div>
                    <div className="text-sm text-gray-500">{order.patientId}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.workType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.labName}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.dueDate}</td>
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
          <h2 className="text-xl font-semibold text-gray-900">Order Details - {order.id}</h2>
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
                <p><span className="font-medium">Name:</span> {order.patientName}</p>
                <p><span className="font-medium">Patient ID:</span> {order.patientId}</p>
                <p><span className="font-medium">Dentist:</span> {order.dentist}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Order Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Work Type:</span> {order.workType}</p>
                <p><span className="font-medium">Lab:</span> {order.labName}</p>
                <p><span className="font-medium">Order Date:</span> {order.orderDate}</p>
                <p><span className="font-medium">Due Date:</span> {order.dueDate}</p>
                <p><span className="font-medium">Cost:</span> ${order.cost}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Progress Tracking</h3>
            <div className="space-y-3">
              {order.stages.map((stage: Stage, index: number) => (
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

          {order.notes && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

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

  const [uploadedFiles, setUploadedFiles] = useState<{id: number, name: string, size: number, type: string, category: string}[]>([]);

  const workTypeRequirements: {[key: string]: { required: string[]; optional: string[] }} = {
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

  const removeFile = (fileId: string) => {
    setUploadedFiles(uploadedFiles.filter(file => file.id !== fileId));
  };

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
          {/* Basic Order Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                <input
                  type="text"
                  value={newOrder.patientName}
                  onChange={(e) => setNewOrder({...newOrder, patientName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                <input
                  type="text"
                  value={newOrder.patientId}
                  onChange={(e) => setNewOrder({...newOrder, patientId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dentist</label>
                <select
                  value={newOrder.dentist}
                  onChange={(e) => setNewOrder({...newOrder, dentist: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Dentist</option>
                  <option value="Dr. Sarah Johnson">Dr. Sarah Johnson</option>
                  <option value="Dr. Michael Chen">Dr. Michael Chen</option>
                  <option value="Dr. Emily Wilson">Dr. Emily Wilson</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lab</label>
                <select
                  value={newOrder.labName}
                  onChange={(e) => setNewOrder({...newOrder, labName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Lab</option>
                  {labs.map((lab) => (
                    <option key={lab.id} value={lab.name}>{lab.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
                <select
                  value={newOrder.workType}
                  onChange={(e) => setNewOrder({...newOrder, workType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Work Type</option>
                  <option value="Complete Denture">Complete Denture</option>
                  <option value="Partial Denture">Partial Denture</option>
                  <option value="Crown & Bridge">Crown & Bridge</option>
                  <option value="Implant Restoration">Implant Restoration</option>
                  <option value="Reline">Reline</option>
                  <option value="Repair">Repair</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={newOrder.dueDate}
                  onChange={(e) => setNewOrder({...newOrder, dueDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Requirements Checklist */}
          {newOrder.workType && workTypeRequirements[newOrder.workType] && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Required Items for {newOrder.workType}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Required Items</h4>
                  <ul className="space-y-1">
                    {workTypeRequirements[newOrder.workType].required.map((item: string, index: number) => (
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
                    {workTypeRequirements[newOrder.workType].optional.map((item: string, index: number) => (
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

          {/* File Upload Section */}
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

            {/* Uploaded Files List */}
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
                      onClick={() => removeFile(file.id.toString())}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submission Checklist */}
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

          {/* Clinical Specifications */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Clinical Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shade Selection</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Select Shade</option>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="A3">A3</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                  <option value="D2">D2</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Select Material</option>
                  <option value="PFM">Porcelain Fused to Metal</option>
                  <option value="Zirconia">Zirconia</option>
                  <option value="Lithium Disilicate">Lithium Disilicate</option>
                  <option value="Acrylic Resin">Acrylic Resin</option>
                  <option value="Chrome Cobalt">Chrome Cobalt</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newOrder.priority}
                  onChange={(e) => setNewOrder({...newOrder, priority: e.target.value})}
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

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
            <textarea
              value={newOrder.notes}
              onChange={(e) => setNewOrder({...newOrder, notes: e.target.value})}
              rows="4"
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
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        setToast(prev => ({...prev, show: false}));
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
            <div key={lab.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{lab.name}</h3>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    lab.status === 'Active' ? 'bg-green-100 text-green-800' : 
                    lab.status === 'Inactive' ? 'bg-gray-100 text-gray-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {lab.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{lab.contact}</p>
              </div>

              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mr-3">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{lab.phone}</p>
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
                    {lab.specialties.map((specialty, index) => (
                      <span 
                        key={index} 
                        className="bg-blue-50 text-blue-700 px-2.5 py-1 text-xs font-medium rounded-full flex items-center"
                      >
                        {specialty}
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
                  className={`px-4 py-2 text-white rounded-lg ${
                    !inviteEmail.trim() || isSending
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
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white flex items-center`}>
          <span>{toast.message}</span>
          <button 
            onClick={() => setToast(prev => ({...prev, show: false}))}
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
  );

  const Dashboard = () => {
    const stats = [
      { title: 'Active Orders', value: '12', color: 'bg-blue-500' },
      { title: 'Pending Pickup', value: '3', color: 'bg-green-500' },
      { title: 'Overdue', value: '1', color: 'bg-red-500' },
      { title: 'This Month', value: '28', color: 'bg-purple-500' }
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
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{order.id}</p>
                      <p className="text-sm text-gray-600">{order.patientName} - {order.workType}</p>
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
                {orders
                  .filter(order => order.status !== 'Completed')
                  .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                  .slice(0, 5)
                  .map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{order.patientName}</p>
                        <p className="text-sm text-gray-600">{order.workType}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{order.dueDate}</p>
                        <p className="text-xs text-gray-600">{order.labName}</p>
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

  return (
    <div className="min-h-screen bg-gray-100 overflow-auto">
     
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Header */}
        <div >
          <h1 className="text-3xl font-bold mt-7 md:mt-0 text-gray-900 mb-2">Lab Management </h1>
          <p className="text-gray-600">Manage your lab orders, requests, and partner labs.</p>
        </div>
          </div>
        </div>
      

      <div className=" -mt-3 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                onClick={() => setActiveTab(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
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
        {activeTab === 'requests' && (
          
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Lab Requests</h2>
                <button
                  onClick={() => setShowNewOrder(true)}
                  className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 flex items-center gap-2"
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
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.patientName}</div>
                          <div className="text-sm text-gray-500">{order.patientId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.workType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.labName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.dueDate}</td>
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
        )}
        {activeTab === 'orders' && <OrdersList />}
        {activeTab === 'labs' && <LabsList />}

        {selectedOrder && (
          <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        )}

        {showNewOrder && <NewOrderForm />}
      </div>
    </div>
  );
};

export default DentalLabModule;