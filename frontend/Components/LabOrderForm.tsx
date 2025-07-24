import React, { useRef, useContext, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, Package, FileText, AlertCircle, Clock, Search } from 'lucide-react';
import { AuthContext } from '@/context/auth-context';

type Lab = {
  lab_id: string;
  name: string;
};

type WorkType = {
  work_type_id: number;
  work_type: string;
};

type PatientType = {
  patient_id: string;
  name: string;
  email?: string;
};

type DentistType = {
  dentist_id: string;
  name: string;
};

type FormData = {
  patient_id: string;
  dentist_id: string;
  lab_id: string;
  work_type_id: number;
  due_date: string;
  shade_type_id: number;
  material_id: number;
  priority: string;
  special_instructions: string;
  submissionChecklist: {
    digitalFiles: Record<string, boolean>;
    physicalItems: Record<string, boolean>;
    patientInfo: Record<string, boolean>;
  };
};

interface LabOrderFormProps {
  onClose: () => void;
  onSubmit: (data: FormData, files: File[]) => Promise<void>;
  patients: PatientType[];
  dentists: DentistType[];
  labs: Lab[];
  workTypes: WorkType[];
  shades: { shade_type_id: number; shade: string; }[];
  materials: { material_id: number; material: string; }[];
  workTypeRequirements: Record<string, { required: string[]; optional: string[]; }>;
}

export const LabOrderForm: React.FC<LabOrderFormProps> = ({
  onClose,
  onSubmit,
  patients,
  dentists,
  labs,
  workTypes,
  shades,
  materials,
  workTypeRequirements,
}) => {
  const { control, handleSubmit, watch } = useForm<FormData>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { apiClient } = useContext(AuthContext);

  // New state for patient search
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<PatientType[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [patientValidated, setPatientValidated] = useState(true);
  const [patientErrorMessage, setPatientErrorMessage] = useState('');

  const workTypeId = watch('work_type_id');
  const selectedWorkType = workTypes.find(w => w.work_type_id === workTypeId);

  // Search for patients
  const searchPatients = async (term: string) => {
    if (term.length < 2) {
      setPatientSearchResults([]);
      return;
    }
    
    try {
      const response = await apiClient.get(`/patients/search?q=${encodeURIComponent(term)}`);
      if (response.data) {
        setPatientSearchResults(response.data);
        
        // If no patients were found matching the search term
        if (response.data.length === 0 && term.length > 2) {
          setPatientValidated(false);
          setPatientErrorMessage('No matching patients found. Please select a patient from the dropdown.');
        }
      }
    } catch (err) {
      console.error('Error searching patients:', err);
      setPatientSearchResults([]);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
  };

  const onFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data, selectedFiles);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Create New Lab Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <div className="relative flex flex-col">
                  <div className="relative">
                    <Controller
                      name="patient_id"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <>
                          <input
                            type="text"
                            value={patientSearchTerm}
                            onChange={(e) => {
                              const value = e.target.value;
                              setPatientSearchTerm(value);
                              
                              // Reset patientId if the input field is cleared or modified
                              if (!value || (field.value && !value.includes(field.value))) {
                                field.onChange('');
                                setPatientValidated(false);
                                if (value.length > 0) {
                                  setPatientErrorMessage('Please select a patient from the dropdown list');
                                } else {
                                  setPatientErrorMessage('');
                                }
                              }
                              
                              searchPatients(value);
                              setShowPatientDropdown(true);
                            }}
                            onFocus={() => {
                              setShowPatientDropdown(true);
                              if (!field.value && patientSearchTerm.length > 0) {
                                setPatientValidated(false);
                                setPatientErrorMessage('Please select a patient from the dropdown list');
                              }
                            }}
                            onBlur={() => setTimeout(() => {
                              setShowPatientDropdown(false);
                              // Check if a valid patient was selected
                              if (!field.value && patientSearchTerm.length > 0) {
                                setPatientValidated(false);
                                setPatientErrorMessage('Please select a patient from the dropdown list');
                              }
                            }, 200)}
                            placeholder="Search by patient name or ID..."
                            className={`w-full pl-10 pr-10 py-2 border ${!patientValidated ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                          />
                          <Search className="absolute left-3 top-[50%] -translate-y-[50%] text-gray-400 h-4 w-4 pointer-events-none" />
                          {patientSearchTerm && (
                            <button
                              type="button"
                              onClick={() => {
                                setPatientSearchTerm("");
                                field.onChange('');
                                setPatientValidated(false);
                                setPatientErrorMessage('');
                              }}
                              className="absolute right-2 top-[50%] -translate-y-[50%] text-gray-400 hover:text-gray-600 transition-colors p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                          {showPatientDropdown && patientSearchResults.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                              {patientSearchResults.map((patient) => (
                                <div
                                  key={patient.patient_id}
                                  className="cursor-pointer hover:bg-gray-100 px-4 py-2 text-sm text-gray-700"
                                  onMouseDown={(e) => {
                                    e.preventDefault(); // Prevent onBlur from firing before onClick
                                    field.onChange(patient.patient_id);
                                    setPatientSearchTerm(`${patient.name} (${patient.patient_id})`);
                                    setShowPatientDropdown(false);
                                    setPatientValidated(true);
                                    setPatientErrorMessage('');
                                  }}
                                >
                                  <div className="font-medium">{patient.name}</div>
                                  <div className="text-xs text-gray-500">ID: {patient.patient_id}</div>
                                  {patient.email && <div className="text-xs text-gray-500">{patient.email}</div>}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    />
                  </div>
                  {!patientValidated && patientErrorMessage && (
                    <div className="text-red-500 text-xs mt-1">{patientErrorMessage}</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dentist</label>
                <Controller
                  name="dentist_id"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Dentist</option>
                      {dentists.map((dent) => (
                        <option key={dent.dentist_id} value={dent.dentist_id}>
                          {dent.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lab</label>
                <Controller
                  name="lab_id"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Lab</option>
                      {labs.map((lab) => (
                        <option key={lab.lab_id} value={lab.lab_id}>{lab.name}</option>
                      ))}
                    </select>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
                <Controller
                  name="work_type_id"
                  control={control}
                  defaultValue={0}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={0}>Select Work Type</option>
                      {workTypes.map((workType) => (
                        <option key={workType.work_type_id} value={workType.work_type_id}>
                          {workType.work_type}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <Controller
                  name="due_date"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <input
                      type="date"
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shade</label>
                <Controller
                  name="shade_type_id"
                  control={control}
                  defaultValue={0}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={0}>Select Shade</option>
                      {shades.map((shade) => (
                        <option key={shade.shade_type_id} value={shade.shade_type_id}>
                          {shade.shade}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                <Controller
                  name="material_id"
                  control={control}
                  defaultValue={0}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={0}>Select Material</option>
                      {materials.map((material) => (
                        <option key={material.material_id} value={material.material_id}>
                          {material.material}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <Controller
                  name="priority"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Priority</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  )}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                <Controller
                  name="special_instructions"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter any special instructions or notes..."
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {selectedWorkType && workTypeRequirements[selectedWorkType.work_type] && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Required Items for {selectedWorkType.work_type}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Required Items</h4>
                  <ul className="space-y-1">
                    {workTypeRequirements[selectedWorkType.work_type].required.map((item, index) => (
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
                    {workTypeRequirements[selectedWorkType.work_type].optional.map((item, index) => (
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
                  ref={fileInputRef}
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
                      type="button"
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
                  <Controller
                    name="submissionChecklist.digitalFiles"
                    control={control}
                    defaultValue={{}}
                    render={({ field }) => (
                      <>
                        {['Intra Oral Scans', 'Stl Files', 'Cbct Scans', 'Photographs'].map((item) => (
                          <label key={item} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={field.value[item] || false}
                              onChange={(e) => {
                                field.onChange({
                                  ...field.value,
                                  [item]: e.target.checked
                                });
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 capitalize">{item}</span>
                          </label>
                        ))}
                      </>
                    )}
                  />
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Physical Items</h4>
                <div className="space-y-2">
                  <Controller
                    name="submissionChecklist.physicalItems"
                    control={control}
                    defaultValue={{}}
                    render={({ field }) => (
                      <>
                        {['Impressions', 'Bite Registration', 'Models', 'Face Bow'].map((item) => (
                          <label key={item} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={field.value[item] || false}
                              onChange={(e) => {
                                field.onChange({
                                  ...field.value,
                                  [item]: e.target.checked
                                });
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 capitalize">{item.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </>
                    )}
                  />
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Patient Information</h4>
                <div className="space-y-2">
                  <Controller
                    name="submissionChecklist.patientInfo"
                    control={control}
                    defaultValue={{}}
                    render={({ field }) => (
                      <>
                        {['Prescription', 'Clinical Notes'].map((item) => (
                          <label key={item} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={field.value[item] || false}
                              onChange={(e) => {
                                field.onChange({
                                  ...field.value,
                                  [item]: e.target.checked
                                });
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 capitalize">{item.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Order...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};