"use client";
import React, { useState, useEffect, useContext } from 'react';
import { Calendar, Clock, Plus, Search, MoreHorizontal, CheckCircle, X, Upload, FileText, Edit, Trash2, UserPlus, User, Users, Check, FileUp, ChevronDown, ChevronRight, Eye, File, ScanLine } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
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

interface Patient {
  patient_id: string;
  name: string;
  email?: string;
  phone_number?: string;
}

interface Report {
  report_id: number;
  status: string;
  report_file_url?: string;
}

interface Study {
  study_id: number;
  patient_id: string;
  patient?: Patient;
  radiologist_id?: number;
  radiologist?: Radiologist;
  doctors?: Doctor[];
  date: string;
  time: string;
  modality?: string;
  report_id?: number;
  report?: Report;
  assertion_number?: number;
  description?: string;
  source?: string;
  isurgent: boolean;
  dicom_file_url?: string;
  body_part?: string;
  reason?: string;
  status?: string;
}

interface NewStudyForm {
  patient_id: string;
  patient_name: string;
  modality: string;
  server_type: string;
  assertion_number: string;
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
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedStudyId, setSelectedStudyId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [activeModality, setActiveModality] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [studyToEdit, setStudyToEdit] = useState<Study | null>(null);
  const [expandedStudyId, setExpandedStudyId] = useState<number | null>(null);
  const dicomurlx = process.env.DICOM_URL;
  

  const {user, isLoadingAuth, isLoggedIn, accessToken} = useContext(AuthContext);
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL; 
  const searchParams = useSearchParams();

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
      // First fetch the report data to get the file URL and determine file type
      const reportResponse = await axios.get(`${backendURL}/reports/${reportId}`);
      const reportData = reportResponse.data;
      
      const fileUrl = reportData.report_file_url;
      
      if (!fileUrl) {
        toast.error('Report file URL is missing');
        return;
      }
      
      // Check file type based on extension
      const fileExtension = fileUrl.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'pdf') {
        // For PDF files, open in a new tab
        window.open(`${backendURL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`, '_blank');
      } else {
        // For Word documents and other files, trigger download
        const fullUrl = `${backendURL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
        
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = fullUrl;
        link.setAttribute('download', ''); // This will force download instead of navigation
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

  // Update the initial value to match the required non-optional types
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [assignedTodayCount, setAssignedTodayCount] = useState<number>(0);
  const [reportedTodayCount, setReportedTodayCount] = useState<number>(0);
  const [radiologists, setRadiologists] = useState<Radiologist[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Record<string, any>>({});
  const router = useRouter();

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
      doctors: doctorsList.length ? doctorsList : undefined,
      // Ensure these properties exist
      patient: raw.patient || undefined,
      report: raw.report || undefined,
      status: raw.status || undefined
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

  useEffect(()=>{
    if(isLoadingAuth) return;
    if(!isLoggedIn){
      toast.error("You are not logged in");
      router.push("/")
    }
    else if(user.role != "radiologist"){
      toast.error("Access Denied");
      router.push("/")
    }
    setRadiologistID(user.id)
  },[isLoadingAuth]);

  useEffect(() => {
    const searchFromQuery = searchParams?.get('search');
    if (searchFromQuery && searchTerm !== searchFromQuery) {
      setSearchTerm(searchFromQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Function to fetch patient data
  const fetchPatients = async (patientIds: string[]) => {
    try {
      const idsToFetch = patientIds.filter(id => !patients[id]);
      if (idsToFetch.length === 0) return;

      // Fetch patients individually
      const fetchedPatients: Record<string, any> = {};
      for (const id of idsToFetch) {
        try {
          const response = await axios.get(`${backendURL}/patients/${id}`);
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
      if(radiologistID == "") return;
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${backendURL}/studies/radiologist/${radiologistID}`);
        const data = response.data;
        const normalized = data.map((s: any) => normalizeStudy(s));
        // Keep only studies assigned to the radiologist in the URL
        const filtered = radiologistID ? normalized.filter((s: Study) => s.radiologist_id?.toString() === radiologistID) : normalized;
        setStudies(filtered);
        
        // Extract unique patient IDs and fetch their details
        const studyPatientIds: string[] = [];
        normalized.forEach((s: Study) => {
          if (s.patient_id && typeof s.patient_id === 'string') {
            studyPatientIds.push(s.patient_id);
          }
        });
        
        const uniquePatientIds = Array.from(new Set(studyPatientIds));
        fetchPatients(uniquePatientIds);
      } catch (err) {
        console.error('Failed to fetch studies:', err);
        setError('Failed to load studies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudies();
  }, [radiologistID]);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        // Radiologists
        const radRes = await axios.get(`${backendURL}/radiologists`);
        const radData = radRes.data;
        const mappedRads = radData.map((r: any) => ({
          id: r.radiologist_id ?? r.id,
          name: r.name ?? `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim(),
          specialization: r.specialization ?? r.email ?? ''
        }));
        setRadiologists(mappedRads);

        // Doctors (dentists)
        const docRes = await axios.get(`${backendURL}/dentists`);
        const docData = docRes.data;
        const mappedDocs = docData.map((d: any) => ({
          id: d.dentist_id ?? d.id,
          name: d.name ?? `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim(),
          specialization: d.specialization ?? d.email ?? ''
        }));
        setDoctors(mappedDocs);
      } catch (err) {
        console.error('Error fetching staff:', err);
      }
    };

    fetchStaff();
  }, []);

  const tabs = ['1D', '3D', '1W', '1M', '1Y', 'ALL'];
  const modalities = ['All', 'CT', 'MRI', 'DX', 'IO', 'CR'];

  const handleAssignStaff = async () => {
    if (!selectedStudyId) return;

    try {
      const payload: any = {
        radiologist_id: assignmentForm.radiologist_id,
        //radiologist_id: assignmentForm.radiologist_id ? parseInt(assignmentForm.radiologist_id) : null,
        doctor_ids: assignmentForm.doctor_ids
      };

      const res = await axios.put(`${backendURL}/studies/${selectedStudyId}`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const updatedRaw = res.data;
      const updatedStudy: Study = normalizeStudy(updatedRaw);

      setStudies(prev => prev.map(study =>
        study.study_id === updatedStudy.study_id ? updatedStudy : study
      ));

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

  // Filter studies based on time period, modality, and search term
  const filteredStudies = studies.filter(study => {
    // Filter by time period based on selected tab
    const studyDate = new Date(study.date);
    const now = new Date();
    let dateMatch = true;
    if (activeTab !== 'ALL') {
      const diffMs = now.getTime() - studyDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (activeTab.endsWith('D')) {
        const days = parseInt(activeTab, 10);
        dateMatch = diffDays <= days;
      } else if (activeTab.endsWith('W')) {
        const weeks = parseInt(activeTab, 10);
        dateMatch = diffDays <= weeks * 7;
      } else if (activeTab.endsWith('M')) {
        const months = parseInt(activeTab, 10);
        dateMatch = diffDays <= months * 30;
      } else if (activeTab.endsWith('Y')) {
        const years = parseInt(activeTab, 10);
        dateMatch = diffDays <= years * 365;
      }
    }

    // Filter by modality if not 'All'
    const modalityMatch = activeModality === 'All' || study.modality === activeModality;

    // Filter by search term
    const searchMatch = searchTerm === '' ||
      (study.patient_id && study.patient_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (study.description && study.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (study.assertion_number && study.assertion_number.toString().includes(searchTerm));

    return dateMatch && modalityMatch && searchMatch;
  });

  const displayedStudies = filteredStudies.slice((currentPage - 1) * 10, currentPage * 10);
  const totalPages = Math.ceil(filteredStudies.length / 10);

  // Add a function to navigate to workspace with study
  const openInWorkspace = (studyId: number) => {
    router.push(`/radiologist/workspace?study_id=${studyId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 overflow-auto">
      {loading && (
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <p className="text-blue-700">Loading studies...</p>
        </div>
      )}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        {/*<div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl mt-6 md:mt-0 font-bold tracking-tight text-gray-900">
              DICOM studies
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome back! Here's what's happening with DICOM studies.
            </p>
          </div>
        </div>*/}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Assigned Today</div>
                <div className="text-3xl font-bold text-gray-900">{assignedTodayCount}</div>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Pending Review</div>
                <div className="text-3xl font-bold text-gray-900">{todayCount}</div>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Reported Today</div>
                <div className="text-3xl font-bold text-gray-900">{reportedTodayCount}</div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>


        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-4">
            {/* Time Period Tabs */}
            <div className="flex flex-wrap gap-2 items-center mb-4">
              <Calendar className="w-5 h-5 text-emerald-700 mr-2" />
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${activeTab === tab
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

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
              Patient Studies
            </h2>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Accession</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Modality</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Report</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Source AE</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Doctors</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayedStudies.map((study) => (
                  <React.Fragment key={study.study_id}>
                    <tr
                      className={`hover:bg-gray-50 cursor-pointer ${expandedStudyId === study.study_id ? 'bg-gray-50' : ''}`}
                      onClick={() => setExpandedStudyId(expandedStudyId === study.study_id ? null : study.study_id)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center">
                          {expandedStudyId === study.study_id ?
                            <ChevronDown className="w-4 h-4 mr-1 text-gray-500" /> :
                            <ChevronRight className="w-4 h-4 mr-1 text-gray-500" />
                          }
                          {study.patient_id}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {study.patient?.name || patients[study.patient_id]?.name || 'Unknown Patient'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{study.status}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">ACC-{study.assertion_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{study.modality}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{study.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatDate(study.date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{study.time}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{study.report?.status ?? 'No status'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{study.source}</td>
                      <td className="px-4 py-3 text-sm">
                        {study.doctors && study.doctors.length > 0 ? (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Users className="w-3 h-3" />
                            <span className="text-xs">{study.doctors.length} doctor(s)</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Not assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openInWorkspace(study.study_id)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="upload a Report"
                          >
                            <FileUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openAssignModal(study.study_id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Assign Staff"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedStudyId === study.study_id && (
                      <tr className="bg-gray-50 border-b">
                        <td colSpan={13} className="p-4">
                          <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Study Details */}
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm text-gray-700">Study Details</h4>
                                <div className="rounded-md bg-green-50 p-3">
                                  <p className="text-xs text-gray-600"><span className="font-medium">Status:</span> {study.status || 'Unknown'}</p>
                                  <p className="text-xs text-gray-600"><span className="font-medium">Report Status:</span> {study.report?.status || 'No Report'}</p>
                                  <p className="text-xs text-gray-600"><span className="font-medium">Description:</span> {study.description || 'No description'}</p>
                                </div>
                              </div>
                    
                              {/* Staff Assignment */}
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm text-gray-700">Staff Assignment</h4>
                                <div className="rounded-md bg-blue-50 p-3">
                                  <p className="text-xs text-gray-600">
                                    <span className="font-medium">Radiologist:</span> {study.radiologist ? study.radiologist.name : 'Not assigned'}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    <span className="font-medium">Doctors:</span> {study.doctors && study.doctors.length > 0
                                      ? study.doctors.map(d => d.name).join(', ')
                                      : 'None assigned'}
                                  </p>
                                </div>
                              </div>
                    
                              {/* Actions */}
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm text-gray-700">Actions</h4>
                                <div className="flex flex-col space-y-2">
                                  {study.dicom_file_url && (
                                    <button
                                      onClick={() => {
                                        openDicomInNewTab(study.dicom_file_url!);
                                      }}
                                      className="flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded transition-colors"
                                    >
                                      <ScanLine className="w-3 h-3" /> View DICOM
                                    </button>
                                  )}
                    
                                  {/* Modified button for report or workspace */}
                                  {study.report_id ? (
                                    <button
                                      onClick={() => {
                                        if (study.report?.status === 'finalized') {
                                          openReportFile(study.report_id!);
                                        } else {
                                          openInWorkspace(study.study_id);
                                        }
                                      }}
                                      className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors">
                                      {study.report?.status === 'finalized' ? (
                                        <>
                                          <File className="w-3 h-3" /> View Report
                                        </>
                                      ) : (
                                        <>
                                          <Eye className="w-3 h-3" /> Open in Workspace
                                        </>
                                      )}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => openInWorkspace(study.study_id)}
                                      className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors">
                                      <Eye className="w-3 h-3" /> Open in Workspace
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>                                    
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-gray-200">
            {displayedStudies.map((study) => (
              <div key={study.study_id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-gray-900">
                    {study.patient_id} - {study.patient?.name || patients[study.patient_id]?.name || 'Unknown Patient'}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openInWorkspace(study.study_id)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openAssignModal(study.study_id)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Modality: {study.modality}</div>
                  <div>Description: {study.description}</div>
                  <div>Date: {formatDate(study.date)} at {study.time}</div>
                  <div>Accession: ACC-{study.assertion_number}</div>
                  <div className="text-blue-600 underline cursor-pointer">Report_001.pdf</div>
                  {study.radiologist && (
                    <div className="text-green-600">Radiologist: {study.radiologist.name}</div>
                  )}
                  {study.doctors && study.doctors.length > 0 && (
                    <div className="text-blue-600">Doctors: {study.doctors.map(d => d.name).join(', ')}</div>
                  )}
                  <div className="flex flex-col space-y-2">
                    {study.dicom_file_url && (
                      <button
                        onClick={() => {
                          openDicomInNewTab(study.dicom_file_url!);
                        }}
                        className="flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded transition-colors"
                      >
                        <ScanLine className="w-3 h-3" /> View DICOM
                      </button>
                    )}
      
                    {/* Modified mobile button for report or workspace */}
                    {study.report_id ? (
                      <button
                        onClick={() => {
                          if (study.report?.status === 'finalized') {
                            openReportFile(study.report_id!);
                          } else {
                            openInWorkspace(study.study_id);
                          }
                        }}
                        className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors">
                        {study.report?.status === 'finalized' ? (
                          <>
                            <File className="w-3 h-3" /> View Report
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" /> Open in Workspace
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => openInWorkspace(study.study_id)}
                        className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors">
                        <Eye className="w-3 h-3" /> Open in Workspace
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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