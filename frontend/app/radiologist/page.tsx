"use client";
import React, { useState, useEffect, useContext } from 'react';
import { Calendar, Clock, Plus, Search, MoreHorizontal, CheckCircle, X, Upload, FileText, Edit, Trash2, UserPlus, User, Users, Check, FileUp, ChevronDown, ChevronRight, Eye, File, ScanLine, AlertCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { AuthContext } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import axios from 'axios';

// Types based on the database structure
interface Doctor {
  id: number;
  name: string;
  specialization: string;
}

interface Radiologist {
  id: number;
  name: string;
  specialization: string;
}

interface Study {
  study_id: number;
  patient_id: string;
  radiologist_id?: number;
  radiologist?: Radiologist;
  doctors?: Doctor[];
  date: string;
  time: string;
  modality?: string;
  report_id?: number;
  assertion_number?: number;
  description?: string;
  source?: string;
  isurgent: boolean;
  dicom_file_url?: string;
  body_part?: string;
  reason?: string;
  status?: string;
  report?: {
    status?: string;
    report_file_url?: string;
  };
  patient?: {
    name?: string;
    email?: string;
    patient_id?: string;
  };
}

// New interface for recent studies from the API
interface RecentStudy {
  study_id: number;
  patient_id: string;
  patient_name: string;
  date: string;
  modality: string;
  source: string;
}

interface NewStudyForm {
  patient_id: string;
  patient_name: string;
  modality?: string;
  server_type?: string;
  assertion_number?: string;
  description: string;
  dicom_files: File[];
  report_files: File[];
}

interface AssignmentForm {
  radiologist_id: string;
  doctor_ids: string[];
}

const MedicalStudyInterface: React.FC = () => {
  const [radiologistID, setRadiologistID] = useState("");
  const [isAddStudyOpen, setIsAddStudyOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedStudyId, setSelectedStudyId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [activeModality, setActiveModality] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [studyToEdit, setStudyToEdit] = useState<Study | null>(null);
  const [expandedStudyId, setExpandedStudyId] = useState<number | null>(null);
  const dicomurlx = process.env.DICOM_URL;

  const { user, isLoadingAuth, isLoggedIn, apiClient } = useContext(AuthContext);
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const openDicomInNewTab = (dicomUrl: string) => {
    if (!dicomUrl) return;

    const fullUrl = dicomUrl.startsWith('http') ? dicomUrl : `${backendURL}${dicomUrl}`;
    const htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <title>Opening DICOM...</title>
  </head>
  <body>
      <p>Opening DICOM file: ${dicomUrl}</p>
      <script>
          fetch('${dicomurlx}/open-dicom', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: '${fullUrl}' })
          })
          .then(response => {
              if (response.redirected) {
                  window.location.href = response.url;
              } else {
                  document.body.innerHTML = '<p>DICOM request sent successfully!</p>';
              }
          })
          .catch(error => {
              document.body.innerHTML = '<p>Error: ' + error.message + '</p>';
          });
      </script>
  </body>
  </html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Helper to open or download report files based on file type
  const openReportFile = async (reportId: number) => {
    try {
      // Fetch the report data using Axios
      const reportResponse = await apiClient.get(`/reports/${reportId}`);
      const reportData = reportResponse.data;
      const fileUrl = reportData.report_file_url;

      if (!fileUrl) {
        toast.error('Report file URL is missing');
        return;
      }

      // Determine the file extension
      const fileExtension = fileUrl.split('.').pop()?.toLowerCase();
      const fullUrl = `${backendURL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;

      if (fileExtension === 'pdf') {
        // Open PDF in a new tab
        window.open(fullUrl, '_blank');
      } else {
        // Trigger download for other file types
        const link = document.createElement('a');
        link.href = fullUrl;
        link.setAttribute('download', '');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error opening report file:', error);
      toast.error('Failed to open report file');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString.split('T')[0]; // Fallback to just splitting if parsing fails
    }
  };

  const [newStudy, setNewStudy] = useState<NewStudyForm>({
    patient_id: '',
    patient_name: '',
    modality: '',
    server_type: '',
    assertion_number: '',
    description: '',
    dicom_files: [],
    report_files: []
  });

  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>({
    radiologist_id: '',
    doctor_ids: []
  });

  const [studies, setStudies] = useState<Study[]>([]);
  const [recentStudies, setRecentStudies] = useState<RecentStudy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [assignedTodayCount, setAssignedTodayCount] = useState<number>(0);
  const [reportedTodayCount, setReportedTodayCount] = useState<number>(0);
  const [radiologists, setRadiologists] = useState<Radiologist[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Record<string, any>>({});
  const router = useRouter();

  // New state variables for report counts by status
  const [notReportedCount, setNotReportedCount] = useState<number>(0);
  const [draftCount, setDraftCount] = useState<number>(0);
  const [finalizedCount, setFinalizedCount] = useState<number>(0);

  // Helper to convert API study payload into UI-friendly shape
  const normalizeStudy = (raw: any): Study => {
    const doctorsList: Doctor[] = (raw.dentistAssigns ?? []).map((da: any) => ({
      id: da.dentist?.dentist_id
        ? (typeof da.dentist.dentist_id === 'string' ? da.dentist.dentist_id : da.dentist.dentist_id.toString())
        : (da.dentist_id ?? '0'),
      name: da.dentist?.name ?? da.dentist?.email ?? 'Dentist',
      specialization: da.dentist?.specialization ?? ''
    }));
    return {
      ...raw,
      doctors: doctorsList.length ? doctorsList : undefined
    } as Study;
  };

  // Calculate studies assigned today
  const calculateAssignedToday = (studies: Study[]) => {
    if (!radiologistID) return 0;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return studies.filter(study => {
      // Convert study date to YYYY-MM-DD format for comparison
      const studyDate = study.date.split('T')[0];
      return studyDate === today && study.radiologist_id?.toString() === radiologistID;
    }).length;
  };

  // Update assigned today count, total assigned count, and reported today count when studies change
  useEffect(() => {
    if (studies.length > 0 && radiologistID) {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      // Calculate assigned today count (only for this radiologist)
      setAssignedTodayCount(calculateAssignedToday(studies));

      // Calculate pending review count (only studies assigned to this radiologist AND at least one doctor)
      const pendingReviewCount = studies.filter(study =>
        study.radiologist_id?.toString() === radiologistID &&
        study.doctors &&
        study.doctors.length > 0
      ).length;
      setTodayCount(pendingReviewCount);

      // Calculate reported today count (studies with reports assigned to this radiologist)
      const reportedToday = studies.filter(study => {
        return study.report_id &&
          study.radiologist_id?.toString() === radiologistID;
      }).length;

      setReportedTodayCount(reportedToday);
    }
  }, [studies, radiologistID]);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isLoggedIn) {
      toast.error("You are not logged in");
      router.push("/")
    }
    else if (user.role != "radiologist") {
      toast.error("Access Denied");
      router.push("/")
    }
    if (user && user.id) {
      setRadiologistID(user.id);
    }
  }, [isLoadingAuth]);

  // New effect to fetch report counts by status
  useEffect(() => {
    const fetchReportCounts = async () => {
      if (!radiologistID) return;

      try {
        const response = await apiClient.get(`/radiologists/${radiologistID}/study-counts`);
        const counts = response.data;

        setNotReportedCount(counts.notReported);
        setDraftCount(counts.draft);
        setFinalizedCount(counts.finalized);
      } catch (err) {
        console.error('Failed to fetch report counts:', err);
      }
    };

    fetchReportCounts();
  }, [radiologistID]);

  // Function to fetch patient data
  const fetchPatients = async (patientIds: string[]) => {
    try {
      const idsToFetch = patientIds.filter(id => !patients[id]);
      if (idsToFetch.length === 0) return;

      const fetchedPatients: Record<string, any> = {};

      for (const id of idsToFetch) {
        try {
          const response = await apiClient.get(`/patients/${id}`);
          const patient = response.data;
          fetchedPatients[patient.patient_id || id] = patient;
        } catch (error) {
          console.error(`Error fetching patient ${id}:`, error);
        }
      }

      setPatients(prev => ({ ...prev, ...fetchedPatients }));
    } catch (err) {
      console.error('Error in fetchPatients:', err);
    }
  };


  // Fetch studies from the backend
  useEffect(() => {
    const fetchStudies = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get(`/studies`);
        const data = response.data;

        const normalized = data.map((s: any) => normalizeStudy(s));

        // Filter studies assigned to the radiologist (if applicable)
        const filtered = radiologistID
          ? normalized.filter((s: Study) => s.radiologist_id?.toString() === radiologistID)
          : normalized;

        setStudies(filtered);

        // Extract unique patient IDs and fetch their details
        const patientIdsSet = new Set<string>();
        normalized.forEach((s: Study) => {
          if (s.patient_id) {
            patientIdsSet.add(s.patient_id);
          }
        });

        const patientIds = Array.from(patientIdsSet);
        if (patientIds.length > 0) {
          fetchPatients(patientIds);
        }

      } catch (err) {
        console.error('Failed to fetch studies:', err);
        setError('Failed to load studies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudies();
  }, [radiologistID]);

  // Fetch recent studies from the backend
  useEffect(() => {
    const fetchRecentStudies = async () => {
      if (!radiologistID) return;

      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get(`/radiologists/${radiologistID}/recent-studies`);
        setRecentStudies(response.data);
      } catch (err) {
        console.error('Failed to fetch recent studies:', err);
        setError('Failed to load recent studies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentStudies();
  }, [radiologistID]);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        // Radiologists
        const radRes = await apiClient.get(`/radiologists`);
        const radiologistsData = radRes.data;
        const mappedRadiologists = radiologistsData.map((r: any) => ({
          id: r.radiologist_id ?? r.id,
          name: r.name ?? `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim(),
          specialization: r.specialization ?? r.email ?? ''
        }));
        setRadiologists(mappedRadiologists);

        // Doctors (dentists)
        const docRes = await apiClient.get(`/dentists`);
        const dentistsData = docRes.data;
        const mappedDoctors = dentistsData.map((d: any) => ({
          id: d.dentist_id ?? d.id,
          name: d.name ?? `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim(),
          specialization: d.specialization ?? d.email ?? ''
        }));
        setDoctors(mappedDoctors);
      } catch (err) {
        console.error('Error fetching staff:', err);
      }
    };

    fetchStaff();
  }, []);

  const tabs = ['1D', '3D', '1W', '1M', '1Y', 'ALL'];
  const modalities = ['All', 'CT', 'MRI', 'DX', 'IO', 'CR'];

  const handleFileUpload = (files: FileList | null, type: 'dicom' | 'report') => {
    if (!files) return;

    const fileArray = Array.from(files);
    setNewStudy(prev => ({
      ...prev,
      [type === 'dicom' ? 'dicom_files' : 'report_files']: fileArray
    }));
  };

  const handleSubmitStudy = () => {
    console.log('Submitting study:', newStudy);

    // Create new study object
    const newStudyRecord: Study = {
      study_id: studies.length + 1,
      patient_id: newStudy.patient_id,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modality: newStudy.modality,
      assertion_number: parseInt(newStudy.assertion_number || "") || Math.floor(Math.random() * 1000000),
      description: newStudy.description,
      source: 'MANUAL-UPLOAD',
      isurgent: false
    };

    // Add to studies list
    setStudies(prev => [newStudyRecord, ...prev]);

    setIsAddStudyOpen(false);
    // Reset form
    setNewStudy({
      patient_id: '',
      patient_name: '',
      modality: '',
      server_type: '',
      assertion_number: '',
      description: '',
      dicom_files: [],
      report_files: []
    });
  };

  const handleAssignStaff = async () => {
    if (!selectedStudyId) return;

    try {
      const payload: any = {
        radiologist_id: assignmentForm.radiologist_id,
        doctor_ids: assignmentForm.doctor_ids
      };

      const res = await apiClient.put(`/studies/${selectedStudyId}`, payload);

      const updatedRaw = res.data;
      const updatedStudy: Study = normalizeStudy(updatedRaw);

      setStudies(prev =>
        prev.map(study =>
          study.study_id === updatedStudy.study_id ? updatedStudy : study
        )
      );

      // Close modal and reset form
      setIsAssignModalOpen(false);
      setSelectedStudyId(null);
      setAssignmentForm({
        radiologist_id: '',
        doctor_ids: []
      });
    } catch (error) {
      console.error('Error assigning staff:', error);
      toast.error('Error assigning staff');
    }
  };


  const handleEditStudy = (studyId: number) => {
    const study = studies.find(s => s.study_id === studyId);
    if (!study) return;

    setStudyToEdit(study);
    setIsEditMode(true);
    setNewStudy({
      patient_id: study.patient_id || '',
      patient_name: '',
      modality: study.modality || '',
      server_type: study.source || '',
      assertion_number: study.assertion_number?.toString() || '',
      description: study.description || '',
      dicom_files: [], // Cannot pre-fill file inputs due to security restrictions
      report_files: []
    });
    setIsAddStudyOpen(true);
  };

  // Handle the actual update of a study
  const handleUpdateStudy = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!studyToEdit) {
        setError('No study to edit');
        setLoading(false);
        return;
      }

      let reportFileUrl = '';

      // If there's an existing report, get its file URL
      if (studyToEdit.report_id) {
        try {
          const reportResponse = await apiClient.get(`/reports/${studyToEdit.report_id}`);
          reportFileUrl = reportResponse.data.report_file_url || '';
        } catch (error) {
          console.error('Error fetching existing report:', error);
        }
      }

      if (newStudy.report_files.length > 0) {
        try {
          // Delete old report file if exists
          if (reportFileUrl) {
            const fileName = reportFileUrl.split('/').pop();
            if (fileName) {
              try {
                await apiClient.delete(`/files/${fileName}`);
              } catch (deleteError: any) {
                console.warn(`Warning: Could not delete old report file: ${deleteError.response?.status}`);
              }
            }
          }

          // Upload new report file
          const reportFormData = new FormData();
          reportFormData.append('file', newStudy.report_files[0]);

          const uploadRes = await apiClient.post(`/files`, reportFormData);
          reportFileUrl = uploadRes.data.url;
          console.log('Report file uploaded successfully:', reportFileUrl);

          // Update or create report
          let reportStatus = 'new';
          if (studyToEdit.report_id && studyToEdit.report) {
            reportStatus = studyToEdit.report.status || 'new';
          }

          const reportPayload = {
            report_file_url: reportFileUrl,
            status: reportStatus,
            study_id: studyToEdit.study_id
          };

          let reportUpdateRes;
          if (studyToEdit.report_id) {
            reportUpdateRes = await apiClient.put(`/reports/${studyToEdit.report_id}`, reportPayload);
          } else {
            reportUpdateRes = await apiClient.post(`/reports`, reportPayload);
          }

          const reportUpdateData = reportUpdateRes.data;
          console.log(`Report ${studyToEdit.report_id ? 'updated' : 'created'} successfully:`, reportUpdateData);

          // Refetch updated study
          const studyRes = await apiClient.get(`/studies/${studyToEdit.study_id}`);
          const normalizedStudy = normalizeStudy(studyRes.data);

          setStudies(prev =>
            prev.map(study =>
              study.study_id === normalizedStudy.study_id ? normalizedStudy : study
            )
          );
        } catch (error) {
          console.error('Error uploading report file:', error);
          console.warn('Continuing without report file');
        }
      }

      toast.success('Study updated successfully');

      // Reset form and close modal
      setIsAddStudyOpen(false);
      setIsEditMode(false);
      setStudyToEdit(null);
      setNewStudy({
        patient_id: '',
        patient_name: '',
        modality: '',
        server_type: '',
        assertion_number: '',
        description: '',
        dicom_files: [],
        report_files: []
      });

    } catch (error) {
      console.error('Error updating report:', error);
      setError('Failed to update report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (studyId: number) => {
    setSelectedStudyId(studyId);
    setIsAssignModalOpen(true);

    // Pre-populate form with existing assignments
    const study = studies.find(s => s.study_id === studyId);
    if (study) {
      setAssignmentForm({
        radiologist_id: study.radiologist_id?.toString() || '',
        doctor_ids: study.doctors?.map(d => d.id.toString()) || []
      });
    }
  };

  const handleDoctorSelection = (doctorId: string) => {
    setAssignmentForm(prev => ({
      ...prev,
      doctor_ids: prev.doctor_ids.includes(doctorId)
        ? prev.doctor_ids.filter(id => id !== doctorId)
        : [...prev.doctor_ids, doctorId]
    }));
  };

  // Filter recent studies based on search term and modality
  const filteredRecentStudies = recentStudies.filter(study => {
    // Filter by modality if not 'All'
    const modalityMatch = activeModality === 'All' || study.modality === activeModality;

    // Filter by search term
    const searchMatch = searchTerm === '' ||
      study.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      study.patient_name.toLowerCase().includes(searchTerm.toLowerCase());

    return modalityMatch && searchMatch;
  });

  const displayedRecentStudies = filteredRecentStudies.slice((currentPage - 1) * 10, currentPage * 10);
  const totalPages = Math.ceil(filteredRecentStudies.length / 10);

  return (
    <div className="min-h-screen bg-gray-50 p-6 overflow-auto">
      {loading && (
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <p className="text-blue-700">Loading studies...</p>
        </div>
      )}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Not Reported</div>
                <div className="text-3xl font-bold text-gray-900">{notReportedCount}</div>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Draft Reports</div>
                <div className="text-3xl font-bold text-gray-900">{draftCount}</div>
              </div>
              <Edit className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Finalized Reports</div>
                <div className="text-3xl font-bold text-gray-900">{finalizedCount}</div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-4">
            {/* Modality Filters */}
            <div className="flex flex-wrap gap-2 items-center mb-4">
              <span className="text-sm text-emerald-600 mr-2">Modality:</span>
              {modalities.map((modality) => (
                <button
                  key={modality}
                  onClick={() => setActiveModality(modality)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${activeModality === modality
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                    }`}
                >
                  {modality}
                </button>
              ))}
            </div>

            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveTab('ALL');
                    setActiveModality('All');
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 text-emerald-600 border border-emerald-300 rounded-lg hover:bg-emerald-50"
                >Reset
                </button>
                <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Studies Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Recent Patient Studies
            </h2>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modality</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedRecentStudies.map((study) => (
                  <tr key={study.study_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {study.patient_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <User className="flex-shrink-0 h-4 w-4 text-gray-500 mr-2" />
                        {study.patient_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${study.modality === 'CT' ? 'bg-purple-100 text-purple-800' :
                          study.modality === 'MRI' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-green-100 text-green-800'}`}>
                        {study.modality}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${study.report?.status === 'completed' ? 'bg-green-100 text-green-800' :
                          study.report?.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'}`}>
                        {study.report?.status ? study.report.status.replace('_', ' ') : 'Not Started'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {study.description || 'No description available'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <File className="flex-shrink-0 h-4 w-4 text-gray-500 mr-2" />
                        {study.source}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="flex-shrink-0 h-4 w-4 text-gray-500 mr-2" />
                        {formatDate(study.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => router.push(`/radiologist/studies?search=${encodeURIComponent(study.patient_id)}`)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                      >
                        <Eye className="-ml-0.5 mr-1.5 h-4 w-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4 p-4">
            {displayedRecentStudies.map((study) => (
              <div key={study.study_id} className="bg-white shadow overflow-hidden rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-500 mr-2" />
                      <h3 className="text-lg leading-6 font-medium text-gray-900">{study.patient_name}</h3>
                    </div>
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-4 font-medium rounded-full 
                      ${study.modality === 'CT' ? 'bg-purple-100 text-purple-800' :
                        study.modality === 'MRI' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-green-100 text-green-800'}`}>
                      {study.modality}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500 flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {study.patient_id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${study.report?.status === 'completed' ? 'bg-green-100 text-green-800' :
                      study.report?.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {study.report?.status ? study.report.status.replace('_', ' ') : 'Not Started'}
                    </span>
                  </div>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <File className="h-4 w-4 text-gray-400 mr-2" />
                        Source
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">{study.source}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        Date
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(study.date)}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-2" />
                        Description
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {study.description || 'No description available'}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-6">
                    <button
                      onClick={() => router.push(`/radiologist/studies?search=${encodeURIComponent(study.patient_id)}`)}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                      <Eye className="-ml-1 mr-2 h-4 w-4" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, filteredRecentStudies.length)} of {filteredRecentStudies.length} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add New Study Modal */}
      {isAddStudyOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {isEditMode ? 'Add/Edit a Report' : 'Add New Study'}
                </h2>
                <button
                  onClick={() => setIsAddStudyOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {isEditMode ? (
                  // Edit mode: only show report upload
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Files
                    </label>
                    <label htmlFor="report-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="text-blue-600 underline cursor-pointer">Upload a file</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PDF, DOC, DOCX files up to 10MB</p>
                        <div className="mt-2">
                          {newStudy.report_files.length > 0 && (
                            <p className="text-sm text-green-600">
                              {newStudy.report_files.length} file(s) selected
                            </p>
                          )}
                        </div>
                      </div>
                    </label>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload(e.target.files, 'report')}
                      className="hidden"
                      id="report-upload"
                    />
                  </div>
                ) : (
                  // Add mode: show the full form
                  <>
                    {/* Patient Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Patient ID
                        </label>
                        <input
                          type="text"
                          value={newStudy.patient_id}
                          onChange={(e) => setNewStudy(prev => ({ ...prev, patient_id: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Patient Name
                        </label>
                        <input
                          type="text"
                          value={newStudy.patient_name}
                          onChange={(e) => setNewStudy(prev => ({ ...prev, patient_name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Study Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Modality
                        </label>
                        <select
                          value={newStudy.modality}
                          onChange={(e) => setNewStudy(prev => ({ ...prev, modality: e.target.value }))}
                          className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                          <option value="">Select Modality</option>
                          <option value="CT">CT</option>
                          <option value="MRI">MRI</option>
                          <option value="DX">DX</option>
                          <option value="CR">CR</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Server Type
                        </label>
                        <select
                          value={newStudy.server_type}
                          onChange={(e) => setNewStudy(prev => ({ ...prev, server_type: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                          <option value="">Select Server Type</option>
                          <option value="PACS">PACS</option>
                          <option value="DICOM">DICOM</option>
                          <option value="CLOUD">CLOUD</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Accession Number
                      </label>
                      <input
                        type="text"
                        value={newStudy.assertion_number}
                        onChange={(e) => setNewStudy(prev => ({ ...prev, assertion_number: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={newStudy.description}
                        onChange={(e) => setNewStudy(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>

                    {/* File Uploads */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        DICOM Files
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="text-blue-600 underline cursor-pointer">Upload a file</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">DCM, DOC, DOCX files up to 10MB</p>
                        <input
                          type="file"
                          multiple
                          accept=".dcm,.doc,.docx"
                          onChange={(e) => handleFileUpload(e.target.files, 'dicom')}
                          className="hidden"
                          id="dicom-upload"
                        />
                        <label htmlFor="dicom-upload" className="cursor-pointer">
                          <div className="mt-2">
                            {newStudy.dicom_files.length > 0 && (
                              <p className="text-sm text-green-600">
                                {newStudy.dicom_files.length} file(s) selected
                              </p>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Report Files
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="text-blue-600 underline cursor-pointer">Upload a file</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PDF, DOC, DOCX files up to 10MB</p>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileUpload(e.target.files, 'report')}
                          className="hidden"
                          id="report-upload"
                        />
                        <label htmlFor="report-upload" className="cursor-pointer">
                          <div className="mt-2">
                            {newStudy.report_files.length > 0 && (
                              <p className="text-sm text-green-600">
                                {newStudy.report_files.length} file(s) selected
                              </p>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setIsAddStudyOpen(false)}
                    className="px-6 py-2 border border-emerald-300 text-gray-700 rounded-lg hover:bg-emerald-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={isEditMode ? handleUpdateStudy : handleSubmitStudy}
                    className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                  >
                    {isEditMode ? 'Update Report' : 'Upload Study'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Staff Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Assign Staff to Study</h2>
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Doctor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Users className="w-4 h-4 inline mr-2" />
                    Assign Doctors (Optional - Multiple Allowed)
                  </label>
                  <div className="space-y-2">
                    {doctors.map((doctor) => (
                      <label key={doctor.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          value={doctor.id.toString()}
                          checked={assignmentForm.doctor_ids.includes(doctor.id.toString())}
                          onChange={(e) => handleDoctorSelection(e.target.value)}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{doctor.name}</div>
                          <div className="text-sm text-gray-600">{doctor.specialization}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Current Assignments Summary */}
                {(assignmentForm.radiologist_id || assignmentForm.doctor_ids.length > 0) && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Assignment Summary:</h4>
                    {assignmentForm.radiologist_id && (
                      <div className="text-sm text-blue-800 mb-1">
                        <User className="w-3 h-3 inline mr-1" />
                        Radiologist: {radiologists.find(r => r.id.toString() === assignmentForm.radiologist_id)?.name}
                      </div>
                    )}
                    {assignmentForm.doctor_ids.length > 0 && (
                      <div className="text-sm text-blue-800">
                        <Users className="w-3 h-3 inline mr-1" />
                        Doctors ({assignmentForm.doctor_ids.length}): {
                          assignmentForm.doctor_ids
                            .map(id => doctors.find(d => d.id.toString() === id)?.name)
                            .join(', ')
                        }
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setIsAssignModalOpen(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignStaff}
                    disabled={!assignmentForm.radiologist_id}
                    className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Assign Staff
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalStudyInterface;