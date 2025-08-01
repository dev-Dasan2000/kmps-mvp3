"use client";
import React, { useState, useEffect, useContext } from 'react';
import { Calendar, Clock, Plus, Search, MoreHorizontal, X, Upload, FileText, Edit, Trash2, UserPlus, User, Users, ChevronDown, ChevronRight, Eye, File } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/auth-context';
import StorageCard from '@/components/StorageCard';
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
  profile_picture?: string;
}

interface Study {
  study_id: number;
  patient_id: string;
  patient?: Patient;
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
  status?: string; // Added status property
  report?: { // Added report property
    status?: string;
    id?: number;
  };
}

interface NewStudyForm {
  patient_id: string;
  patient_name: string;
  modality: string;
  server_type: string;
  assertion_number: string;
  description: string;
  dicom_files: File[];
  dicom_folder: File[];
  report_files: File[];
  upload_type: 'file' | 'folder';
}

interface AssignmentForm {
  radiologist_id: string;
  doctor_ids: string[];
}

// Add this interface near the top of the file with the other interfaces
interface DirectoryInputHTMLAttributes extends React.InputHTMLAttributes<HTMLInputElement> {
  webkitdirectory?: string;
  directory?: string;
}

export const dynamic = 'force-dynamic';

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
  const dicomurlx = process.env.NEXT_PUBLIC_DICOM_URL || 'http://localhost:4000';

  const { isLoadingAuth, user, isLoggedIn, apiClient } = useContext(AuthContext);
  const router = useRouter();

  // Add these state variables after the other state variables
  const [patientValidated, setPatientValidated] = useState(true);
  const [patientErrorMessage, setPatientErrorMessage] = useState('');

  // Helper to open or download report files based on file type
  const openReportFile = async (reportId: number) => {
    try {
      // First fetch the report data to get the file URL and determine file type
      const reportResponse = await apiClient.get(`/reports/${reportId}`);
      const reportData = reportResponse.data;

      const fileUrl = reportData.report_file_url;

      if (!fileUrl) {
        toast.error('Report file URL is missing');
        return;
      }

      // Check file type based on extension
      const fileExtension = fileUrl.split('.').pop()?.toLowerCase();

      //for pdf open in browser, others download
      if (fileExtension === 'pdf') {
        window.open(`${backendUrl}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`, '_blank');
      } else {
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

  const [newStudy, setNewStudy] = useState<NewStudyForm>({
    patient_id: '',
    patient_name: '',
    modality: '',
    server_type: '',
    assertion_number: '',
    description: '',
    dicom_files: [],
    dicom_folder: [],
    report_files: [],
    upload_type: 'file'
  });

  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>({
    radiologist_id: '',
    doctor_ids: []
  });

  const [studies, setStudies] = useState<Study[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [radiologists, setRadiologists] = useState<Radiologist[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isuploading, setisuploading] = useState(false);

  const openInWorkspace = (studyId: number) => {
    router.push(`/admin/studies/workspace?study_id=${studyId}`);
  };

  // Helper to convert API study payload into UI-friendly shape
  const normalizeStudy = (raw: any): Study => {
    const doctorsList: Doctor[] = (raw.dentistAssigns ?? []).map((da: any) => ({
      id: da.dentist?.dentist_id
        ? (typeof da.dentist.dentist_id === 'string' ? da.dentist.dentist_id : da.dentist.dentist_id.toString())
        : (da.dentist_id ?? '0'),
      name: da.dentist?.name ?? da.dentist?.email ?? 'Dentist',
      specialization: da.dentist?.specialization ?? ''
    }));

    // Include patient data if available in the study response
    const patientData = raw.patient ? {
      patient: {
        patient_id: raw.patient.patient_id || raw.patient_id,
        name: raw.patient.name || 'Unknown Patient',
        email: raw.patient.email,
        phone_number: raw.patient.phone_number
      }
    } : {};

    return {
      ...raw,
      ...patientData,
      doctors: doctorsList.length ? doctorsList : undefined
    } as Study;
  };

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isLoggedIn) {
      toast.error("Login Error", { description: "Please Login" });
      router.push("/");
    }
    else if (user.role != "admin") {
      toast.error("Access Denied", { description: "You do not have access to admin privilegdes" });
      router.push("/");
    }
  }, [isLoadingAuth])

  // Fetch today's study count
  useEffect(() => {
    const fetchTodayCount = async () => {
      try {
        const res = await apiClient.get(`/studies/today/count`);
        const data = res.data;
        setTodayCount(data.count);
      } catch (err) {
        console.error('Error fetching today count:', err);
      }
    };
    fetchTodayCount();
  }, []);

  // Search for patients by name or ID
  const searchPatients = async (term: string) => {
    if (term.length < 2) {
      setPatientSearchResults([]);
      return;
    }

    try {
      const response = await apiClient.get(`/patients/search?q=${encodeURIComponent(term)}`);
      const data = response.data;
      setPatientSearchResults(data);

      // If no patients were found matching the search term
      if (data.length === 0 && term.length > 2) {
        setPatientValidated(false);
        setPatientErrorMessage('No matching patients found. Please select a patient from the dropdown.');
      }
    } catch (err) {
      console.error('Error searching patients:', err);
      setPatientSearchResults([]);
    }
  };

  // Fetch patients from the backend
  const fetchPatients = async (patientIds: string[]) => {
    try {
      // Only fetch patients that we don't already have in state
      const idsToFetch = patientIds.filter(id => !patients[id]);
      if (idsToFetch.length === 0) return;

      // Fetch patients one by one (can handle potential 404s for individual patients)
      const fetchedPatients: Record<string, Patient> = {};

      for (const id of idsToFetch) {
        try {
          const response = await apiClient.get(`/patients/${id}`);
          const patient = response.data;
          fetchedPatients[patient.patient_id || id] = patient;
        } catch (err) {
          console.error(`Error fetching patient ${id}:`, err);
        }
      }

      setPatients(prev => ({
        ...prev,
        ...fetchedPatients
      }));
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
        setStudies(normalized);

        // Extract unique patient IDs and fetch patient data
        // We know that patient_id is always a string in our data model
        const patientIds = normalized
          .map((study: Study) => study.patient_id)
          .filter(Boolean) as string[];

        // Remove duplicates while maintaining type
        const uniquePatientIds = [...new Set(patientIds)];
        fetchPatients(uniquePatientIds);

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
        const radRes = await apiClient.get(`/radiologists`);
        const radData = radRes.data;
        const mappedRads = radData.map((r: any) => ({
          id: r.radiologist_id ?? r.id,
          name: r.name ?? `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim(),
          specialization: r.specialization ?? r.email ?? ''
        }));
        setRadiologists(mappedRads);

        // Doctors (dentists)
        const docRes = await apiClient.get(`/dentists`);
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

  const handleFileUpload = (files: FileList | null, type: 'dicom' | 'report' | 'dicom_folder') => {
    if (!files) return;

    const fileArray = Array.from(files);

    // Validate DICOM files (.dcm or .DCM extension)
    if (type === 'dicom' || type === 'dicom_folder') {
      const invalidFiles = fileArray.filter(file => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        return extension !== 'dcm';
      });

      if (invalidFiles.length > 0) {
        toast.error('Invalid file type', {
          description: 'Only .dcm or .DCM files are allowed for DICOM uploads'
        });
        return;
      }
    }

    // Update state based on upload type
    setNewStudy(prev => {
      if (type === 'dicom') {
        return {
          ...prev,
          dicom_files: fileArray,
          upload_type: 'file'
        };
      } else if (type === 'dicom_folder') {
        return {
          ...prev,
          dicom_folder: fileArray,
          upload_type: 'folder'
        };
      } else {
        return {
          ...prev,
          report_files: fileArray
        };
      }
    });
  };

  // Helper function to handle directory selection
  const handleDirectoryUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    handleFileUpload(files, 'dicom_folder');
  };

  const handleSubmitStudy = async () => {
    try {
      // Check if patient is properly selected
      if (!newStudy.patient_id) {
        setPatientValidated(false);
        setPatientErrorMessage('Please select a patient from the dropdown');
        toast.error('Patient selection required');
        return;
      }

      setisuploading(true);
      setError(null);
      console.log('Submitting study:', newStudy);

      // Step 1: Validate required DICOM file or folder
      if (newStudy.upload_type === 'file' && newStudy.dicom_files.length === 0) {
        toast.error('Please upload a DICOM file before submitting the study');
        setError('DICOM file is required');
        setisuploading(false);
        return;
      } else if (newStudy.upload_type === 'folder' && newStudy.dicom_folder.length === 0) {
        toast.error('Please upload DICOM files from a folder before submitting the study');
        setError('DICOM folder files are required');
        setisuploading(false);
        return;
      }

      // Step 2: Upload DICOM file(s)
      let dicomFileUrl = '';
      try {
        if (newStudy.upload_type === 'file') {
          // Single file upload
          const dicomFormData = new FormData();
          dicomFormData.append('file', newStudy.dicom_files[0]);

          const dicomResponse = await apiClient.post(`/files`, dicomFormData);
          const dicomData = dicomResponse.data;
          dicomFileUrl = dicomData.url;
          console.log('DICOM file uploaded successfully:', dicomFileUrl);
        } else {
          // Folder upload
          const folderFormData = new FormData();

          // Process files to maintain folder structure
          for (const file of newStudy.dicom_folder) {
            // Extract relative path from file webkitRelativePath or use fallback
            const relativePath = (file as any).webkitRelativePath || '';
            const folderPath = relativePath.split('/').slice(0, -1).join('/');

            // Format for backend: folderpath|filename
            folderFormData.append('files', file, `${folderPath}|${file.name}`);
          }

          const folderResponse = await apiClient.post(`/files/folder`, folderFormData);
          const folderData = folderResponse.data;
          // Use the first URL as the main reference URL
          dicomFileUrl = folderData.urls[0] || '';
          console.log('DICOM folder uploaded successfully:', folderData.urls);
        }
      } catch (error) {
        console.error('Error uploading DICOM files:', error);
        if (apiClient.isAxiosError(error) && error.response) {
          setError(`Failed to upload DICOM files: ${error.response.data.message || error.message}`);
        } else {
          setError('Failed to upload DICOM files. Please try again.');
        }
        setisuploading(false);
        return;
      }

      // Step 3: Upload report file if available
      let reportFileUrl = '';
      if (newStudy.report_files.length > 0) {
        try {
          const reportFormData = new FormData();
          reportFormData.append('file', newStudy.report_files[0]);

          const reportResponse = await apiClient.post(`/files`, reportFormData);
          const reportData = reportResponse.data;
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
        const studyResponse = await apiClient.post(`/studies`, studyPayload);
        const newStudyData = studyResponse.data;
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
          dicom_folder: [],
          report_files: [],
          upload_type: 'file'
        });

        // Step 4: Create new report record in reports table
        const ReportResponse = await apiClient.post(`/reports`, {
          report_file_url: reportFileUrl,
          status: 'new',
          study_id: newStudyData.study_id,
        });

        const reportData = ReportResponse.data;
        console.log('Report created successfully:', reportData);

        // Step 5: Update study with report ID
        const updateStudyResponse = await apiClient.put(`/studies/${newStudyData.study_id}`, {
          report_id: reportData.report_id,
        });

        const updatedStudyData = updateStudyResponse.data;
        console.log('Study updated successfully:', updatedStudyData);
        toast.success("Study Updated Successfully");
      } catch (error) {
        console.error('Error creating study:', error);
        if (apiClient.isAxiosError(error) && error.response) {
          setError(`Failed to create study: ${error.response.data.message || error.message}`);
        } else {
          setError('Failed to create study. Please try again.');
        }
        setisuploading(false);
      }
    } catch (error) {
      console.error('Unexpected error in study submission:', error);
      const errorMessage = apiClient.isAxiosError(error) && error.response
        ? `An error occurred: ${error.response.data.message || error.message}`
        : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      setisuploading(false);
    } finally {
      setisuploading(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedStudyId) return;
    setLoading(true);
    try {
      const payload: any = {
        radiologist_id: assignmentForm.radiologist_id,
        doctor_ids: assignmentForm.doctor_ids
      };

      const res = await apiClient.put(`/studies/${selectedStudyId}`, payload);
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
      toast.error('Failed to assign staff. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudy = async (studyId: number) => {
    if (!confirm('Are you sure you want to delete this study? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.delete(`/studies/${studyId}`);

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
      patient_name: study.patient?.name || '',
      modality: study.modality || '',
      server_type: study.source || '',
      assertion_number: study.assertion_number?.toString() || '',
      description: study.description || '',
      dicom_files: [],
      dicom_folder: [],
      report_files: [],
      upload_type: 'file'
    });
    setPatientSearchTerm(
      study.patient
        ? `${study.patient.name} (${study.patient_id})`
        : study.patient_id
    );
    setIsAddStudyOpen(true);
  };

  // Set up edit mode when studyToEdit changes
  useEffect(() => {
    if (studyToEdit) {
      setNewStudy({
        patient_id: studyToEdit.patient_id,
        patient_name: studyToEdit.patient?.name || '',
        modality: studyToEdit.modality || '',
        server_type: studyToEdit.source || '',
        assertion_number: studyToEdit.assertion_number?.toString() || '',
        description: studyToEdit.description || '',
        dicom_files: [],
        dicom_folder: [],
        report_files: [],
        upload_type: 'file'
      });
      setPatientSearchTerm(
        studyToEdit.patient
          ? `${studyToEdit.patient.name} (${studyToEdit.patient_id})`
          : studyToEdit.patient_id
      );
    }
  }, [studyToEdit]);

  // Reset form when opening/closing
  useEffect(() => {
    if (!isAddStudyOpen) {
      setNewStudy({
        patient_id: '',
        patient_name: '',
        modality: '',
        server_type: '',
        assertion_number: '',
        description: '',
        dicom_files: [],
        dicom_folder: [],
        report_files: [],
        upload_type: 'file'
      });
      setPatientSearchTerm('');
      setPatientSearchResults([]);
      setShowPatientDropdown(false);
      setIsEditMode(false);
      setStudyToEdit(null);
    }
  }, [isAddStudyOpen]);

  // Handle the actual update of a study
  const handleUpdateStudy = async () => {
    try {
      setisuploading(true);
      setError(null);
      console.log('Updating study:', newStudy, studyToEdit);

      if (!studyToEdit) {
        setError('No study to edit');
        setLoading(false);
        return;
      }

      // Step 1: Handle DICOM file if a new one was uploaded
      let dicomFileUrl = studyToEdit.dicom_file_url || '';
      if (newStudy.upload_type === 'file' && newStudy.dicom_files.length > 0) {
        try {
          // Delete the old DICOM file if it exists
          if (studyToEdit.dicom_file_url) {
            try {
              // Extract the file name from the URL
              const fileName = studyToEdit.dicom_file_url.split('/').pop();
              if (fileName) {
                const deleteResponse = await apiClient.delete(`/files/${fileName}`);

                if (deleteResponse.status !== 200) {
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

          const dicomResponse = await apiClient.post(`/files`, dicomFormData);
          const dicomData = dicomResponse.data;
          dicomFileUrl = dicomData.url;
          console.log('DICOM file uploaded successfully:', dicomFileUrl);
          setisuploading(false);
        } catch (error) {
          console.error('Error uploading DICOM file:', error);
          setError('Failed to upload DICOM file. Please try again.');
          setisuploading(false);
          return;
        }
      } else if (newStudy.upload_type === 'folder' && newStudy.dicom_folder.length > 0) {
        try {
          // Delete the old DICOM file if it exists
          if (studyToEdit.dicom_file_url) {
            try {
              // Extract the file name from the URL
              const fileName = studyToEdit.dicom_file_url.split('/').pop();
              if (fileName) {
                const deleteResponse = await apiClient.delete(`/files/${fileName}`);

                if (deleteResponse.status !== 200) {
                  console.warn(`Warning: Could not delete old DICOM file: ${deleteResponse.status}`);
                }
              }
            } catch (error) {
              console.error('Error deleting old DICOM file:', error);
            }
          }

          // Upload the new DICOM folder
          const folderFormData = new FormData();

          // Process files to maintain folder structure
          for (const file of newStudy.dicom_folder) {
            // Extract relative path from file webkitRelativePath or use fallback
            const relativePath = (file as any).webkitRelativePath || '';
            const folderPath = relativePath.split('/').slice(0, -1).join('/');

            // Format for backend: folderpath|filename
            folderFormData.append('files', file, `${folderPath}|${file.name}`);
          }

          const folderResponse = await apiClient.post(`/files/folder`, folderFormData);
          const folderData = folderResponse.data;
          // Use the first URL as the main reference URL
          dicomFileUrl = folderData.urls[0] || '';
          console.log('DICOM folder uploaded successfully:', folderData.urls);
        } catch (error) {
          console.error('Error uploading DICOM folder:', error);
          setError('Failed to upload DICOM folder. Please try again.');
          setisuploading(false);
          return;
        }
      }

      // Step 2: Handle report file if a new one was uploaded
      let reportFileUrl = '';
      // If there's an existing report, get its file URL
      if (studyToEdit.report_id) {
        try {
          const reportResponse = await apiClient.get(`/reports/${studyToEdit.report_id}`);
          const reportData = reportResponse.data;
          reportFileUrl = reportData.report_file_url || '';
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
                const deleteResponse = await apiClient.delete(`/files/${fileName}`);

                if (deleteResponse.status !== 200) {
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

          const reportResponse = await apiClient.post(`/files`, reportFormData);
          const reportData = reportResponse.data;
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
      const studyResponse = await apiClient.put(`/studies/${studyToEdit.study_id}`, studyPayload);
      const updatedStudyData = studyResponse.data;
      console.log('Study updated successfully:', updatedStudyData);
      setisuploading(false);

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
          ? `/reports/${studyToEdit.report_id}`
          : `/reports`;

        const reportResponse = await apiClient.request({
          method: reportMethod,
          url: reportEndpoint,
          data: reportPayload
        });

        const reportData = reportResponse.data;
        console.log(`Report ${reportMethod === 'POST' ? 'created' : 'updated'} successfully:`, reportData);
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
        dicom_folder: [],
        report_files: [],
        upload_type: 'file'
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
            <StorageCard />
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
                    className="w-full pl-10 pr-10 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2 top-[50%] -translate-y-[50%] text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
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
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-24">ID</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-48">Name</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-24">Status</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-32">Accession</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-24">Modality</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-48">Description</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-28">Date</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-20">Time</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-24">Report</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-32">Source AE</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-36">Radiologist</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-32">Doctors</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayedStudies.map((study) => (
                    <React.Fragment key={study.study_id}>
                      <tr
                        className={`hover:bg-gray-50 cursor-pointer ${expandedStudyId === study.study_id ? 'bg-gray-50' : ''}`}
                        onClick={() => setExpandedStudyId(expandedStudyId === study.study_id ? null : study.study_id)}
                      >
                        <td className="px-3 py-3 text-xs text-gray-900 truncate" title={study.patient_id}>
                          <div className="flex items-center">
                            {expandedStudyId === study.study_id ?
                              <ChevronDown className="w-3 h-3 mr-1 flex-shrink-0 text-gray-500" /> :
                              <ChevronRight className="w-3 h-3 mr-1 flex-shrink-0 text-gray-500" />
                            }
                            <span className="truncate">{study.patient_id}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-900 truncate" title={study.patient?.name || patients[study.patient_id]?.name || 'Unknown Patient'}>
                          {study.patient?.name || patients[study.patient_id]?.name || 'Unknown Patient'}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-900 truncate">
                          <span className={`px-2 py-1 rounded-full text-xs ${study.status === 'completed' ? 'bg-green-100 text-green-800' :
                              study.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {study.status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-900 font-mono">ACC-{study.assertion_number}</td>
                        <td className="px-3 py-3 text-xs text-gray-900 font-medium">{study.modality || 'N/A'}</td>
                        <td className="px-3 py-3 text-xs text-gray-600 truncate max-w-xs" title={study.description}>
                          {study.description || 'No description'}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-900 whitespace-nowrap">
                          {study.date ? new Date(study.date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-900 whitespace-nowrap">
                          {study.time || 'N/A'}
                        </td>
                        <td className="px-3 py-3 text-xs">
                          <span className={`px-2 py-1 rounded-full ${study.report?.status === 'signed' ? 'bg-green-100 text-green-800' :
                              study.report?.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {study.report?.status || 'No report'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-600 font-mono">{study.source || 'N/A'}</td>
                        <td className="px-3 py-3 text-xs">
                          {study.radiologist ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <User className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{study.radiologist.name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">Not assigned</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs">
                          {study.doctors && study.doctors.length > 0 ? (
                            <div className="flex items-center gap-1 text-blue-600">
                              <Users className="w-3 h-3 flex-shrink-0" />
                              <span>{study.doctors.length} doctor(s)</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not assigned</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditStudy(study.study_id); }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Study"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteStudy(study.study_id); }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete Study"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); openAssignModal(study.study_id); }}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Assign Staff"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
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
                                          openReportFile(study.report_id!);
                                        }}
                                        className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors">
                                        <File className="w-3 h-3" /> Open Report
                                      </button>
                                    )}
                                    {study.report_id ? (
                                      <button
                                        onClick={() => {
                                            openInWorkspace(study.study_id);
                                        }}
                                        className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors">
                                          <>
                                            <Eye className="w-3 h-3" /> Open Study
                                          </>
                                      </button>
                                    ) : (
                                      <p>No Report Available</p>
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

        {/* Add New Study Modal */}
        {isAddStudyOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
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
                      Patient ID <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex flex-col">
                      <div className="relative">
                        <Search className="absolute left-3 top-[50%] -translate-y-[50%] text-gray-400 h-4 w-4 pointer-events-none" />
                        <input
                          type="text"
                          value={patientSearchTerm}
                          onChange={(e) => {
                            const value = e.target.value;
                            setPatientSearchTerm(value);

                            // Reset patientId if the input field is cleared or modified
                            if (!value || (newStudy.patient_id && !value.includes(newStudy.patient_id))) {
                              setNewStudy(prev => ({
                                ...prev,
                                patient_id: '',
                                patient_name: ''
                              }));
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
                            if (!newStudy.patient_id && patientSearchTerm.length > 0) {
                              setPatientValidated(false);
                              setPatientErrorMessage('Please select a patient from the dropdown list');
                            }
                          }}
                          onBlur={() => setTimeout(() => {
                            setShowPatientDropdown(false);
                            // Check if a valid patient was selected
                            if (!newStudy.patient_id && patientSearchTerm.length > 0) {
                              setPatientValidated(false);
                              setPatientErrorMessage('Please select a patient from the dropdown list');
                            }
                          }, 200)}
                          placeholder="Search by patient name or ID..."
                          className={`w-full pl-10 pr-10 py-2 border ${!patientValidated ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent`}
                        />
                        {patientSearchTerm && (
                          <button
                            type="button"
                            onClick={() => {
                              setPatientSearchTerm("");
                              setNewStudy(prev => ({
                                ...prev,
                                patient_id: '',
                                patient_name: ''
                              }));
                              setPatientValidated(false);
                              setPatientErrorMessage('');
                            }}
                            className="absolute right-2 top-[50%] -translate-y-[50%] text-gray-400 hover:text-gray-600 transition-colors p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {!patientValidated && patientErrorMessage && (
                        <div className="text-red-500 text-xs mt-1">{patientErrorMessage}</div>
                      )}
                      {showPatientDropdown && patientSearchResults.length > 0 && (
                        <div className="absolute z-10 mt-[42px] w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                          {patientSearchResults.map((patient) => (
                            <div
                              key={patient.patient_id}
                              className="cursor-pointer hover:bg-gray-100 px-4 py-2 text-sm text-gray-700"
                              onMouseDown={(e) => {
                                e.preventDefault(); // Prevent onBlur from firing before onClick
                                setNewStudy(prev => ({
                                  ...prev,
                                  patient_id: patient.patient_id,
                                  patient_name: patient.name
                                }));
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
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          DICOM Upload Method
                        </label>
                        <div className="flex border border-teal-500 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setNewStudy(prev => ({ ...prev, upload_type: 'file' }))}
                            className={`px-3 py-1 text-xs ${newStudy.upload_type === 'file' ? 'bg-teal-500 text-white' : 'bg-white text-teal-700'}`}
                          >
                            Single File
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewStudy(prev => ({ ...prev, upload_type: 'folder' }))}
                            className={`px-3 py-1 text-xs ${newStudy.upload_type === 'folder' ? 'bg-teal-500 text-white' : 'bg-white text-teal-700'}`}
                          >
                            Folder
                          </button>
                        </div>
                      </div>
                    </div>

                    {newStudy.upload_type === 'file' ? (
                      <>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          DICOM File
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
                          <p className="text-xs text-gray-500">Only .dcm or .DCM files allowed</p>
                          <input
                            type="file"
                            accept=".dcm,.DCM"
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
                      </>
                    ) : (
                      <>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          DICOM Folder
                        </label>
                        <div
                          className="border-2 border-dashed border-blue-200 bg-blue-50 rounded-lg p-6 text-center relative"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-500 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            <path d="M12 11v6"></path>
                            <path d="M9 14h6"></path>
                          </svg>
                          <p className="text-sm text-gray-600 mb-2">
                            <label htmlFor="folder-upload" className="text-blue-600 underline cursor-pointer">Select a folder</label> containing DICOM files
                          </p>
                          <p className="text-xs text-gray-500">Only .dcm or .DCM files will be uploaded</p>
                          <input
                            type="file"
                            id="folder-upload"
                            onChange={handleDirectoryUpload}
                            webkitdirectory=""
                            directory=""
                            multiple
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                            {...{} as DirectoryInputHTMLAttributes}
                          />
                          <div className="mt-2">
                            {newStudy.dicom_folder.length > 0 && (
                              <div className="text-sm text-green-600">
                                <p>{newStudy.dicom_folder.length} file(s) selected from folder</p>
                                <p className="text-xs">Folder structure will be preserved</p>
                                {newStudy.dicom_folder.length > 0 && newStudy.dicom_folder.length <= 5 && (
                                  <ul className="text-left mt-2 text-xs">
                                    {Array.from(newStudy.dicom_folder).map((file, index) => {
                                      const relativePath = (file as any).webkitRelativePath || file.name;
                                      return (
                                        <li key={index} className="truncate">{relativePath}</li>
                                      );
                                    })}
                                  </ul>
                                )}
                                {newStudy.dicom_folder.length > 5 && (
                                  <p className="text-xs mt-1">Showing first 5 of {newStudy.dicom_folder.length} files</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
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
                      disabled={isuploading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={isEditMode ? handleUpdateStudy : handleSubmitStudy}
                      disabled={isuploading}
                      className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:bg-emerald-400 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isuploading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {isEditMode ? 'Saving...' : 'Uploading...'}
                        </>
                      ) : (
                        isEditMode ? 'Save Changes' : 'Upload Study'
                      )}
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