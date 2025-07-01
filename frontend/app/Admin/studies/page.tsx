"use client";
import React, { useState, useEffect, useContext } from 'react';
import { Calendar, Clock, Plus, Search, MoreHorizontal, X, Upload, FileText, Edit, Trash2, UserPlus, User, Users, ChevronDown, ChevronRight, Eye, File } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/auth-context';
import StorageCard from '@/components/StorageCard';

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
  const [isAddStudyOpen, setIsAddStudyOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedStudyId, setSelectedStudyId] = useState<number | null>(null);
  const [studyToEdit, setStudyToEdit] = useState<Study | null>(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [activeModality, setActiveModality] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedStudyId, setExpandedStudyId] = useState<number | null>(null);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const {isLoadingAuth, user, isLoggedIn} = useContext(AuthContext);
  const router = useRouter();

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
          fetch('http://localhost:4000/open-dicom', {
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
  const [radiologists, setRadiologists] = useState<Radiologist[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

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

  useEffect(()=>{
    if(isLoadingAuth) return;
    if(!isLoggedIn){
      toast.error("Login Error",{description:"Please Login"});
      router.push("/");
    }
    else if(user.role != "admin"){
      toast.error("Access Denied",{description:"You do not have access to admin privilegdes"});
      router.push("/");
    }
  },[isLoadingAuth])

  // Fetch today's study count
  useEffect(() => {
    const fetchTodayCount = async () => {
      try {
        const res = await fetch(`${backendUrl}/studies/today/count`);
        if (res.ok) {
          const data = await res.json();
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

  // Fetch studies from the backend
  useEffect(() => {
    const fetchStudies = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${backendUrl}/studies`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        const normalized = data.map((s: any) => normalizeStudy(s));
        setStudies(normalized);
        console.log(normalized);
      } catch (err) {
        console.error('Failed to fetch studies:', err);
        setError('Failed to load studies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudies();
  }, []);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        // Radiologists
        const radRes = await fetch(`${backendUrl}/radiologists`);
        if (radRes.ok) {
          const data = await radRes.json();
          const mapped = data.map((r: any) => ({
            id: r.radiologist_id ?? r.id,
            name: r.name ?? `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim(),
            specialization: r.specialization ?? r.email ?? ''
          }));
          setRadiologists(mapped);
        }

        // Doctors (dentists)
        const docRes = await fetch(`${backendUrl}/dentists`);
        if (docRes.ok) {
          const data = await docRes.json();
          const mapped = data.map((d: any) => ({
            id: d.dentist_id ?? d.id,
            name: d.name ?? `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim(),
            specialization: d.specialization ?? d.email ?? ''
          }));
          setDoctors(mapped);
        }
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

  const handleSubmitStudy = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Submitting study:', newStudy);

      // Step 1: Validate required DICOM file
      if (newStudy.dicom_files.length === 0) {
        setError('DICOM file is required');
        setLoading(false);
        return;
      }

      // Step 2: Upload DICOM file first
      let dicomFileUrl = '';
      try {
        const dicomFormData = new FormData();
        dicomFormData.append('file', newStudy.dicom_files[0]);

        const dicomResponse = await fetch(`${backendUrl}/files`, {
          method: 'POST',
          body: dicomFormData
        });

        if (!dicomResponse.ok) {
          throw new Error(`DICOM file upload failed with status: ${dicomResponse.status}`);
        }

        const dicomData = await dicomResponse.json();
        dicomFileUrl = dicomData.url;
        console.log('DICOM file uploaded successfully:', dicomFileUrl);
      } catch (error) {
        console.error('Error uploading DICOM file:', error);
        setError('Failed to upload DICOM file. Please try again.');
        setLoading(false);
        return;
      }

      // Step 3: Upload report file if available
      let reportFileUrl = '';
      if (newStudy.report_files.length > 0) {
        try {
          const reportFormData = new FormData();
          reportFormData.append('file', newStudy.report_files[0]);

          const reportResponse = await fetch(`${backendUrl}/files`, {
            method: 'POST',
            body: reportFormData
          });

          if (!reportResponse.ok) {
            throw new Error(`Report file upload failed with status: ${reportResponse.status}`);
          }

          const reportData = await reportResponse.json();
          reportFileUrl = reportData.url;
          console.log('Report file uploaded successfully:', reportFileUrl);
        } catch (error) {
          console.error('Error uploading report file:', error);
          // Report is optional, so we can continue without it
          console.warn('Continuing without report file');
        }
      }

      // Step 4: Create new study object with file URLs
      const studyPayload = {
        patient_id: newStudy.patient_id,
        date: new Date().toISOString(), // Use full ISO string for Prisma DateTime
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modality: newStudy.modality,
        assertion_number: parseInt(newStudy.assertion_number) || Math.floor(Math.random() * 1000000),
        description: newStudy.description,
        dicom_file_url: dicomFileUrl,
        source: newStudy.server_type || 'MANUAL-UPLOAD', // Use selected Source AE if available
        isurgent: false
      };

      // Step 5: Submit study to backend
      try {
        const studyResponse = await fetch(`${backendUrl}/studies`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(studyPayload)
        });

        if (!studyResponse.ok) {
          throw new Error(`Study creation failed with status: ${studyResponse.status}`);
        }
        const newStudyData = await studyResponse.json();
        console.log('Study created successfully:', newStudyData);

        // Update studies list with the new study
        setStudies(prev => [normalizeStudy(newStudyData), ...prev]);

        // Close modal and reset form
        setIsAddStudyOpen(false);
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

        // Step 4: Create new report reocrd in reports table
        const ReportResponse = await fetch(`${backendUrl}/reports`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            {
              report_file_url: reportFileUrl,
              status: 'new',
              study_id: newStudyData.study_id,
            }
          )
        });

        if (!ReportResponse.ok) {
          throw new Error(`Report creation failed with status: ${ReportResponse.status}`);
        }
        const reportData = await ReportResponse.json();
        console.log('Report created successfully:', reportData);

        // Step 5: Update study with report ID
        const updateStudyResponse = await fetch(`${backendUrl}/studies/${newStudyData.study_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            {
              report_id: reportData.report_id,
            }
          )
        });

        if (!updateStudyResponse.ok) {
          throw new Error(`Study update failed with status: ${updateStudyResponse.status}`);
        }
        const updatedStudyData = await updateStudyResponse.json();
        console.log('Study updated successfully:', updatedStudyData);
      } catch (error) {
        console.error('Error creating study:', error);
        setError('Failed to create study. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected error in study submission:', error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedStudyId) return;
    try {
      const payload: any = {
        radiologist_id: assignmentForm.radiologist_id,
        doctor_ids: assignmentForm.doctor_ids
      };

      const res = await fetch(`${backendUrl}/studies/${selectedStudyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to assign staff');
      }

      const updatedRaw = await res.json();
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
      toast.error('Failed to assign staff. Please try again.');
    }
  };

  const handleDeleteStudy = async (studyId: number) => {
    if (!confirm('Are you sure you want to delete this study? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/studies/${studyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete study: ${response.statusText}`);
      }

      // Only update the UI if the backend deletion was successful
      setStudies(prev => prev.filter(study => study.study_id !== studyId));

      // Show success message
      toast.success('Study deleted successfully');
    } catch (error) {
      console.error('Error deleting study:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`Error deleting study: ${errorMessage}`);
    }
  };

  const handleEditStudy = (studyId: number) => {
    const study = studies.find(s => s.study_id === studyId);
    if (!study) return;

    setStudyToEdit(study);
    setIsEditMode(true);
    setNewStudy({
      patient_id: study.patient_id,
      patient_name: '', // Assuming we don't have this in the Study type yet
      modality: study.modality,
      server_type: study.source,
      assertion_number: study.assertion_number.toString(),
      description: study.description,
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
      console.log('Updating study:', newStudy, studyToEdit);

      if (!studyToEdit) {
        setError('No study to edit');
        setLoading(false);
        return;
      }

      // Step 1: Handle DICOM file if a new one was uploaded
      let dicomFileUrl = studyToEdit.dicom_file_url || '';
      if (newStudy.dicom_files.length > 0) {
        try {
          // Delete the old DICOM file if it exists
          if (studyToEdit.dicom_file_url) {
            try {
              // Extract the file name from the URL
              const fileName = studyToEdit.dicom_file_url.split('/').pop();
              if (fileName) {
                const deleteResponse = await fetch(`${backendUrl}/files/${fileName}`, {
                  method: 'DELETE'
                });

                if (!deleteResponse.ok) {
                  console.warn(`Warning: Could not delete old DICOM file: ${deleteResponse.status}`);
                }
              }
            } catch (error) {
              console.error('Error deleting old DICOM file:', error);
            }
          }

          // Upload the new DICOM file
          const dicomFormData = new FormData();
          dicomFormData.append('file', newStudy.dicom_files[0]);

          const dicomResponse = await fetch(`${backendUrl}/files`, {
            method: 'POST',
            body: dicomFormData
          });

          if (!dicomResponse.ok) {
            throw new Error(`DICOM file upload failed with status: ${dicomResponse.status}`);
          }

          const dicomData = await dicomResponse.json();
          dicomFileUrl = dicomData.url;
          console.log('DICOM file uploaded successfully:', dicomFileUrl);
        } catch (error) {
          console.error('Error uploading DICOM file:', error);
          setError('Failed to upload DICOM file. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Step 2: Handle report file if a new one was uploaded
      let reportFileUrl = '';
      // If there's an existing report, get its file URL
      if (studyToEdit.report_id) {
        try {
          const reportResponse = await fetch(`${backendUrl}/reports/${studyToEdit.report_id}`);
          if (reportResponse.ok) {
            const reportData = await reportResponse.json();
            reportFileUrl = reportData.report_file_url || '';
          }
        } catch (error) {
          console.error('Error fetching existing report:', error);
        }
      }

      if (newStudy.report_files.length > 0) {
        try {
          // Delete the old report file if it exists
          if (reportFileUrl) {
            try {
              const fileName = reportFileUrl.split('/').pop();
              if (fileName) {
                const deleteResponse = await fetch(`${backendUrl}/files/${fileName}`, {
                  method: 'DELETE'
                });

                if (!deleteResponse.ok) {
                  console.warn(`Warning: Could not delete old report file: ${deleteResponse.status}`);
                }
              }
            } catch (error) {
              console.error('Error deleting old report file:', error);
            }
          }

          // Upload the new report file
          const reportFormData = new FormData();
          reportFormData.append('file', newStudy.report_files[0]);

          const reportResponse = await fetch(`${backendUrl}/files`, {
            method: 'POST',
            body: reportFormData
          });

          if (!reportResponse.ok) {
            throw new Error(`Report file upload failed with status: ${reportResponse.status}`);
          }

          const reportData = await reportResponse.json();
          reportFileUrl = reportData.url;
          console.log('Report file uploaded successfully:', reportFileUrl);
        } catch (error) {
          console.error('Error uploading report file:', error);
          // Report is optional, so we can continue without it
          console.warn('Continuing without report file');
        }
      }

      // Step 3: Update study in the database
      const studyPayload = {
        patient_id: newStudy.patient_id,
        date: studyToEdit.date, // Keep original date
        time: studyToEdit.time, // Keep original time
        modality: newStudy.modality,
        assertion_number: parseInt(newStudy.assertion_number) || studyToEdit.assertion_number,
        description: newStudy.description,
        dicom_file_url: dicomFileUrl,
        source: newStudy.server_type || studyToEdit.source,
        isurgent: studyToEdit.isurgent
      };

      // Update study via PUT request
      const studyResponse = await fetch(`${backendUrl}/studies/${studyToEdit.study_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studyPayload)
      });

      if (!studyResponse.ok) {
        throw new Error(`Study update failed with status: ${studyResponse.status}`);
      }

      const updatedStudyData = await studyResponse.json();
      console.log('Study updated successfully:', updatedStudyData);

      // Step 4: Update or create report if needed
      if (reportFileUrl) {
        // Safe access to report status with a type assertion if needed
        let reportStatus = 'new';
        if (studyToEdit.report_id && studyToEdit.report) {
          reportStatus = studyToEdit.report.status || 'new';
        }

        const reportPayload = {
          report_file_url: reportFileUrl,
          status: reportStatus,
          study_id: updatedStudyData.study_id,
        };

        const reportMethod = studyToEdit.report_id ? 'PUT' : 'POST';
        const reportEndpoint = studyToEdit.report_id
          ? `${backendUrl}/reports/${studyToEdit.report_id}`
          : `${backendUrl}/reports`;

        const reportResponse = await fetch(reportEndpoint, {
          method: reportMethod,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reportPayload)
        });

        if (!reportResponse.ok) {
          console.error(`Report ${reportMethod} failed with status: ${reportResponse.status}`);
        } else {
          const reportData = await reportResponse.json();
          console.log(`Report ${reportMethod === 'POST' ? 'created' : 'updated'} successfully:`, reportData);
        }
      }

      // Step 5: Update studies list with the updated study
      setStudies(prev => prev.map(study =>
        study.study_id === updatedStudyData.study_id ? normalizeStudy(updatedStudyData) : study
      ));

      // Show success message
      toast.success('Study updated successfully');

      // Step 6: Reset state and close modal
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
      console.error('Error updating study:', error);
      setError('Failed to update study. Please try again.');
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
            <p className="text-gray-600 mt-2">
              Welcome back! Here's what's happening with DICOM studies.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Studies Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm flex items-center gap-4 justify-between">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="w-7 h-7 text-blue-600" />
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">Total Studies</div>
              <div className="text-3xl font-bold text-gray-900">{studies.length}</div>
            </div>
          </div>

          {/* Today's Scans Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm flex items-center gap-4 justify-between">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <Clock className="w-7 h-7 text-green-600" />
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">Today's Scans</div>
              <div className="text-3xl font-bold text-gray-900">{todayCount}</div>
            </div>
          </div>

          {/* Storage Usage Card */}
          <StorageCard/>
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
                <button
                  onClick={() => setIsAddStudyOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                >
                  <Plus className="w-4 h-4" />
                  New Study
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
                      <td className="px-4 py-3 text-sm text-gray-900">John Doe</td>
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
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditStudy(study.study_id); }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit Study"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteStudy(study.study_id); }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete Study"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openAssignModal(study.study_id); }}
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
                                      <Eye className="w-3 h-3" /> View DICOM
                                    </button>
                                  )}


                                  {study.report_id && (
                                    <button
                                      onClick={() => {
                                        window.open(`${backendUrl}/reports/${study.report_id}`, '_blank');
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
                  <div className="font-medium text-gray-900">{study.patient_id} - John Doe</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditStudy(study.study_id)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteStudy(study.study_id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
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
                        <Eye className="w-3 h-3" /> View DICOM
                      </button>
                    )}
      
                    {study.report_id && (
                      <button
                        onClick={() => {
                          window.open(`${backendURL}/reports/${study.report_id}`, '_blank');
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

      {/* Add New Study Modal */}
      {isAddStudyOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">{isEditMode ? 'Edit Study' : 'Add New Study'}</h2>
                <button
                  onClick={() => setIsAddStudyOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Patient Information */}
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
                      Source AE
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
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleFileUpload(e.dataTransfer.files, 'dicom');
                    }}
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      <label htmlFor="dicom-upload" className="text-blue-600 underline cursor-pointer">Upload a file</label> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">DCM, DOC, DOCX files up to 10MB</p>
                    <input
                      type="file"
                      multiple
                      accept=".dcm,.doc,.docx"
                      onChange={(e) => handleFileUpload(e.target.files, 'dicom')}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      id="dicom-upload"
                    />
                    <div className="mt-2">
                      {newStudy.dicom_files.length > 0 && (
                        <div className="text-sm text-green-600">
                          <p>{newStudy.dicom_files.length} file(s) selected</p>
                          <ul className="text-left mt-2">
                            {Array.from(newStudy.dicom_files).map((file, index) => (
                              <li key={index} className="truncate">{file.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Files
                  </label>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleFileUpload(e.dataTransfer.files, 'report');
                    }}
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      <label htmlFor="report-upload" className="text-blue-600 underline cursor-pointer">Upload a file</label> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX files up to 10MB</p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload(e.target.files, 'report')}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      id="report-upload"
                    />
                    <div className="mt-2">
                      {newStudy.report_files.length > 0 && (
                        <div className="text-sm text-green-600">
                          <p>{newStudy.report_files.length} file(s) selected</p>
                          <ul className="text-left mt-2">
                            {Array.from(newStudy.report_files).map((file, index) => (
                              <li key={index} className="truncate">{file.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

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
                    {isEditMode ? 'Save Changes' : 'Upload Study'}
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
    </>
  );
};

export default MedicalStudyInterface;