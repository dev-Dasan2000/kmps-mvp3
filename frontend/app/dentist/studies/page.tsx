"use client";
import React, { useState, useEffect , useContext} from 'react';
import { Calendar, Clock, Plus, Search, MoreHorizontal, ScanLine, X, Upload, FileText, Edit, Trash2, UserPlus, User, Users, ChevronDown, ChevronRight, Eye, File } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/auth-context';
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
  radiologist_id: string;
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
}

interface AssignmentForm {
  radiologist_id: string;
  doctor_ids: string[];
}

const MedicalStudyInterface: React.FC = () => {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedStudyId, setSelectedStudyId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [activeModality, setActiveModality] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedStudyId, setExpandedStudyId] = useState<number | null>(null);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  const dicomurlx = process.env.DICOM_URL;

  // Helper: open DICOM viewer in a new tab using POST (required by backend)
  const openDicomInNewTab = (dicomUrl: string) => {
    if (!dicomUrl) return;

    const fullUrl = dicomUrl.startsWith('http') ? dicomUrl : `${backendUrl}${dicomUrl}`;
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
      const reportResponse = await axios.get(`${backendUrl}/reports/${reportId}`);
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
        window.open(`${backendUrl}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`, '_blank');
      } else {
        // For Word documents and other files, trigger download
        const fullUrl = `${backendUrl}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
        
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

  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>({
    radiologist_id: '',
    doctor_ids: []
  });

  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [radiologists, setRadiologists] = useState<Radiologist[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Record<string, any>>({});

  // Get current user from auth context
  const { user, isLoggedIn, isLoadingAuth, accessToken } = useContext(AuthContext);
  const router = useRouter();

  useEffect(()=>{
    if(isLoadingAuth) return;
    if(!isLoggedIn){
      toast.error("Login Error", {description:"Please Login"});
      router.push("/");
    }
    else if(user.role != "dentist"){
      toast.error("Access Denied", {description:"You do not have admin priviledges"});
      router.push("/");
    }
  },[isLoadingAuth]);

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

  // Fetch today's study count
  useEffect(() => {
    const fetchTodayCount = async () => {
      try {
        const res = await axios.get(`${backendUrl}/studies/today/count`);
        if (res.status === 200) {
          const data = res.data;
          setTodayCount(data.count);
        } else {
          console.error('Failed to fetch today count:', res.status);
        }
      } catch (err) {
        console.error('Error fetching today count:', err);
      }
    };
    fetchTodayCount();
  }, []);

  // Function to fetch patient data
  const fetchPatients = async (patientIds: string[]) => {
    try {
      const idsToFetch = patientIds.filter(id => !patients[id]);
      if (idsToFetch.length === 0) return;

      // Fetch patients individually
      const fetchedPatients: Record<string, any> = {};
      for (const id of idsToFetch) {
        try {
          const response = await axios.get(`${backendUrl}/patients/${id}`);
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

  // Fetch studies assigned to the current dentist
  useEffect(() => {
    const fetchStudies = async () => {
      if (!user?.id || isLoadingAuth) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch studies assigned to this dentist
        const response = await axios.get(`${backendUrl}/studies/dentist/${user.id}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true // Include cookies for authentication
        });

        const data = response.data;
        const normalized = data.map((s: any) => normalizeStudy(s));
        setStudies(normalized);

        // Extract unique patient IDs and fetch their details
        const patientIds = Array.from(new Set(normalized.map((s: Study) => s.patient_id)));
        fetchPatients(patientIds);

        // Update today's count
        const today = new Date().toISOString().split('T')[0];
        const todaysStudies = normalized.filter((study: Study) =>
          study.date.startsWith(today)
        );
        setTodayCount(todaysStudies.length);

      } catch (err) {
        console.error('Failed to fetch studies:', err);
        setError('Failed to load studies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudies();
  }, [user?.id, isLoadingAuth]);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        // Radiologists
        const radRes = await axios.get(`${backendUrl}/radiologists`);
        const radData = radRes.data;
        const mappedRads = radData.map((r: any) => ({
          id: r.radiologist_id ?? r.id,
          name: r.name ?? `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim(),
          specialization: r.specialization ?? r.email ?? ''
        }));
        setRadiologists(mappedRads);

        // Doctors (dentists)
        const docRes = await axios.get(`${backendUrl}/dentists`);
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
        doctor_ids: assignmentForm.doctor_ids
      };

      const res = await axios.put(`${backendUrl}/studies/${selectedStudyId}`, payload, {
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
      const errorMessage = axios.isAxiosError(error) && error.response
        ? `Error assigning staff: ${error.response.data.message || error.message}`
        : 'Error assigning staff';
      toast.error(errorMessage);
    }
  };

  const handleDeleteStudy = async (studyId: number) => {
    if (!confirm('Are you sure you want to delete this study? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${backendUrl}/studies/${studyId}`);

      // Only update the UI if the backend deletion was successful
      setStudies(prev => prev.filter(study => study.study_id !== studyId));

      // Show success message
      toast.success('Study deleted successfully');
    } catch (error) {
      console.error('Error deleting study:', error);
      const errorMessage = axios.isAxiosError(error) && error.response
        ? `Error deleting study: ${error.response.data.message || error.message}`
        : error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`Error deleting study: ${errorMessage}`);
    }
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

  return (
    <>
    <div className="min-h-screen bg-gray-50 p-6 overflow-auto">
      {loading && (
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <p className="text-blue-700">Loading studies...</p>
        </div>
      )}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl mt-6 md:mt-0 font-bold tracking-tight text-gray-900">
              DICOM studies
            </h1>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Total Studies</div>
                <div className="text-3xl font-bold text-gray-900">{studies.length}</div>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Today's Scans</div>
                <div className="text-3xl font-bold text-gray-900">{todayCount}</div>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
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
                  <th className="px-4 py-3 text-left text-sm font-medium">Radiologist</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Doctors</th>
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
                      <td className="px-4 py-3 text-sm text-gray-900">{study.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{study.time}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{study.report?.status ?? 'No status'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{study.source}</td>
                      <td className="px-4 py-3 text-sm">
                        {study.radiologist ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <User className="w-3 h-3" />
                            <span className="text-xs">{study.radiologist.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Not assigned</span>
                        )}
                      </td>
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
                    </tr>
                    {expandedStudyId === study.study_id && (
                      <tr className="bg-gray-50 border-b">
                        <td colSpan={13} className="p-4">
                          <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {/* Study Details */}
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm text-gray-700">Patient Information</h4>
                                <div className="rounded-md bg-blue-50 p-3">
                                  <p className="text-xs text-gray-600"><span className="font-medium">Name:</span> {study.patient?.name || patients[study.patient_id]?.name || 'Unknown Patient'}</p>
                                  <p className="text-xs text-gray-600"><span className="font-medium">Patient ID:</span> {study.patient_id}</p>
                                </div>
                              </div>

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


                                  {study.report_id && (
                                    <button
                                      onClick={() => {
                                        openReportFile(study.report_id!);
                                      }}
                                      className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors">
                                      <File className="w-3 h-3" /> Open Report
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
                  <div className="font-medium text-gray-900">{study.patient_id} - {study.patient?.name || 'Unknown Patient'}</div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Modality: {study.modality}</div>
                  <div>Description: {study.description}</div>
                  <div>Date: {study.date} at {study.time}</div>
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
      
                    {study.report_id && (
                      <button
                        onClick={() => {
                          openReportFile(study.report_id!);
                        }}
                      className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors">
                        <File className="w-3 h-3" /> Open Report
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
                {/* Radiologist Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <User className="w-4 h-4 inline mr-2" />
                    Assign Radiologist (Required - One Only)
                  </label>
                  <div className="space-y-2">
                    {radiologists.map((radiologist) => (
                      <label key={radiologist.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                        <input
                          type="radio"
                          name="radiologist"
                          value={radiologist.id.toString()}
                          checked={assignmentForm.radiologist_id === radiologist.id.toString()}
                          onChange={(e) => setAssignmentForm(prev => ({
                            ...prev,
                            radiologist_id: e.target.value
                          }))}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{radiologist.name}</div>
                          <div className="text-sm text-gray-600">{radiologist.specialization}</div>
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
    </>
  );
};

export default MedicalStudyInterface;