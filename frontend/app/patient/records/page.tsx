"use client";
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/context/auth-context';
import { Calendar, Clock, Plus, Search, ScanLine, MoreHorizontal, X, Upload, FileText, Edit, Trash2, UserPlus, User, Users, ChevronDown, ChevronRight, Eye, File } from 'lucide-react';
import { toast } from 'sonner';

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
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

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

  // Helper to open or download report files based on file type
  const openReportFile = async (reportId: number) => {
    try {
      // First fetch the report data to get the file URL and determine file type
      const reportResponse = await fetch(`${backendUrl}/reports/${reportId}`);
      if (!reportResponse.ok) {
        throw new Error(`Failed to fetch report: ${reportResponse.status}`);
      }
      
      const reportData = await reportResponse.json();
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

  // Get the authenticated user and loading state from context
  const { user, isLoadingAuth } = useContext(AuthContext);

  // Fetch studies for the specific patient
  useEffect(() => {
    const fetchStudies = async () => {
      if (isLoadingAuth) {
        console.log('Auth still loading...');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Get patient ID from the authenticated user
        console.log('User object:', user);
        const patientId = user?.id;
        console.log('Patient ID:', patientId);
        
        if (!patientId) {
          console.log('No patient ID found, user might not be logged in or not a patient');
          setError('Please log in to view patient records');
          setLoading(false);
          return;
        }
        const response = await fetch(`${backendUrl}/studies/patient/${patientId}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        const normalized = data.map((s: any) => normalizeStudy(s));
        setStudies(normalized);
        console.log(normalized);
      } catch (err) {
        console.error('Failed to fetch patient studies:', err);
        setError('Failed to load patient studies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudies();
  }, [user, isLoadingAuth]); 

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
      toast.error('Error assigning staff');
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
    <div className="min-h-screen bg-gray-50 p-6 overflow-auto relative">
    {/* Loading overlay */}
    {loading && (
      <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
        <div className="bg-blue-50 p-6 rounded-lg shadow-lg">
          <p className="text-blue-700 font-medium">Loading your medical records...</p>
        </div>
      </div>
    )}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl mt-6 md:mt-0 font-bold tracking-tight text-gray-900">
              My Medical Records
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome! Here you can view and manage your medical imaging records.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">My Medical Records</div>
                <div className="text-3xl font-bold text-gray-900">{studies.length}</div>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Recent Scans</div>
                <div className="text-3xl font-bold text-gray-900">{todayCount}</div>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Reports Available</div>
                <div className="text-3xl font-bold text-gray-900">
                  {studies.filter(s => s.report_id).length}
                </div>
              </div>
              <FileText className="w-8 h-8 text-indigo-500" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-4">

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
              My Medical Studies
            </h2>
            <p className="text-sm text-gray-500 mt-1">View and access your medical imaging studies and reports</p>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Study ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Modality</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Report Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Medical Team</th>
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
                          {study.study_id}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(study.date).toLocaleDateString('en-CA')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{study.time}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{study.modality}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{study.description || 'No description'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${study.report_id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {study.report_id ? 'Available' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-col gap-1">
                          {study.radiologist && (
                            <div className="flex items-center gap-1 text-green-600">
                              <User className="w-3 h-3" />
                              <span className="text-xs">Dr. {study.radiologist.name}</span>
                            </div>
                          )}
                          {study.doctors && study.doctors.length > 0 && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <Users className="w-3 h-3" />
                              <span className="text-xs">{study.doctors.length} doctor(s)</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (study.dicom_file_url) openDicomInNewTab(study.dicom_file_url); 
                            }}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                            title="View DICOM"
                          >
                            <ScanLine className="w-4 h-4" />
                          </button>
                          {study.report_id && (
                            <button
                              onClick={() => {
                                openReportFile(study.report_id!);
                              }}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="View Report"
                            >
                              <File className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedStudyId === study.study_id && (
                      <tr className="bg-gray-50 border-b">
                        <td colSpan={13} className="p-4">
                          <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Study Details */}
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm text-gray-700">Study Information</h4>
                                <div className="rounded-md bg-blue-50 p-3 space-y-1">
                                  <p className="text-xs text-gray-600"><span className="font-medium">Study ID:</span> {study.study_id}</p>
                                  <p className="text-xs text-gray-600"><span className="font-medium">Accession Number:</span> {study.assertion_number || 'Not available'}</p>
                                  <p className="text-xs text-gray-600"><span className="font-medium">Modality:</span> {study.modality || 'Unknown'}</p>
                                  <p className="text-xs text-gray-600"><span className="font-medium">Body Part:</span> {study.body_part || 'Not specified'}</p>
                                  <p className="text-xs text-gray-600"><span className="font-medium">Date:</span> {study.date} at {study.time}</p>
                                </div>
                              </div>

                              {/* Medical Team */}
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm text-gray-700">Your Medical Team</h4>
                                <div className="rounded-md bg-green-50 p-3 space-y-1">
                                  <p className="text-xs text-gray-600">
                                    <span className="font-medium">Radiologist:</span> {study.radiologist ? `Dr. ${study.radiologist.name}` : 'Pending assignment'}
                                    {study.radiologist && (
                                      <span className="block mt-1 text-gray-500">{study.radiologist.specialization}</span>
                                    )}
                                  </p>
                                  {study.doctors && study.doctors.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs font-medium text-gray-600 mb-1">Medical Doctors:</p>
                                      {study.doctors.map((doctor, index) => (
                                        <div key={index} className="ml-2 text-xs text-gray-600">
                                          • Dr. {doctor.name}
                                          <span className="block text-gray-500">{doctor.specialization}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* View Options */}
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm text-gray-700">View Options</h4>
                                <div className="rounded-md bg-gray-50 p-3 space-y-3">
                                  <div className="space-y-1">
                                    <p className="text-xs text-gray-600"><span className="font-medium">Reason for Study:</span> {study.reason || 'Not specified'}</p>
                                    <p className="text-xs text-gray-600"><span className="font-medium">Description:</span> {study.description || 'No description'}</p>
                                  </div>
                                  
                                  <div className="flex flex-col space-y-2">
                                    {study.dicom_file_url && (
                                      <button
                                        onClick={() => {
                                          openDicomInNewTab(study.dicom_file_url!);
                                        }}
                                        className="flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded transition-colors"
                                      >
                                        <ScanLine className="w-3 h-3" /> View Medical Images
                                      </button>
                                    )}

                                    {study.report_id && (
                                      <button
                                        onClick={() => {
                                          openReportFile(study.report_id!);
                                        }}
                                        className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors">
                                        <File className="w-3 h-3" /> View Medical Report
                                      </button>
                                    )}
                                  </div>
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
                      onClick={() => study.dicom_file_url && openDicomInNewTab(study.dicom_file_url)}
                      className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                      title="View DICOM"
                    >
                      <ScanLine className="w-4 h-4" />
                    </button>
                    {study.report_id && (
                      <button
                        onClick={() => window.open(`${backendUrl}/reports/${study.report_id}`, '_blank')}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        title="View Report"
                      >
                        <File className="w-4 h-4" />
                      </button>
                    )}
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* No modals needed for patient view */}
    </div>
    </>
  );
};
export default MedicalStudyInterface;