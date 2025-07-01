'use client'

import React, { useState, useEffect, useRef, useContext } from 'react'
import { Search, User, FileText, Calendar, Phone, Mail, Download, Upload, AlertCircle, Activity, X, ArrowLeft, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import axios from 'axios'
import { AuthContext } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner';

interface Patient {
  patient_id: string
  name: string
  email: string
  phone_number?: string
  profile_picture?: string
  blood_group?: string
  date_of_birth?: string
  gender?: string
  address?: string
  NIC?: string
}

interface Dentist {
  dentist_id: string
  name: string
  email: string
  phone_number?: string
  profile_picture?: string
  service_types?: string
  work_days_from?: string
  work_days_to?: string
  work_time_from?: string
  work_time_to?: string
  appointment_fee?: number
}

interface SOAPNote {
  note_id: number
  patient_id: string
  note: string
  date?: string
}

interface MedicalHistory {
  patient_id: string
  medical_question_id: number
  medical_question_answer: string
  question: { question_id: string, question: string }
}

interface MedicalReport {
  report_id: number
  patient_id: string
  record_url: string
  record_name?: string
}

interface DashboardProps {
  params: {
    dentistId: string
  }
}

// Dialog Component
const Dialog = ({ open, onOpenChange, children }: { open: boolean, onOpenChange: (open: boolean) => void, children: React.ReactNode }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children }: { children: React.ReactNode }) => (
  <div className="p-6">
    {children}
  </div>
);

const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">
    {children}
  </div>
);

const DialogTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-semibold text-gray-900">
    {children}
  </h2>
);

// Mock data - replace with actual API calls
const mockDentist: Dentist = {
  dentist_id: "D001",
  name: "Dr. Sarah Johnson",
  email: "sarah.johnson@dental.com",
  phone_number: "+1-555-0123",
  service_types: "General Dentistry, Orthodontics",
  work_days_from: "Monday",
  work_days_to: "Friday",
  work_time_from: "09:00",
  work_time_to: "17:00",
  appointment_fee: 150.00
}

export default function DentistDashboard({ params }: DashboardProps) {

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useContext(AuthContext);

  const [searchTerm, setSearchTerm] = useState('')
  const [dentist, setDentist] = useState<Dentist | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMobileOverlayOpen, setIsMobileOverlayOpen] = useState(false)
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingMedicalHistory, setLoadingMedicalHistory] = useState(false);
  const [loadingMedicalReports, setLoadingMedicalReports] = useState(false);
  const [loadingSOAPNotes, setLoadingSOAPNotes] = useState(false);
  const [fetchedPatients, setFetchedPatients] = useState<Patient[]>([]);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([]);
  const [medicalReport, setMedicalReport] = useState<MedicalReport[]>([]);
  const [soapNote, setSoapNote] = useState<SOAPNote[]>([]);

  // Dialog states
  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false);
  const [isUploadReportDialogOpen, setIsUploadReportDialogOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportName, setReportName] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isUploadingReport, setIsUploadingReport] = useState(false);
  const [editingNote, setEditingNote] = useState<SOAPNote | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<number | null>(null);

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const response = await axios.get(
        `${backendURL}/appointments/fordentist/patients/${user?.id}`
      );
      if (response.status == 500) {
        throw new Error("Internal Server Error");
      }
      setFetchedPatients(response.data);
    }
    catch (err: any) {
     toast.error(err.message);
    }
    finally {
      setLoadingPatients(false);
    }
  };

  const fetchPatientMedicalHistory = async (patient_id: string) => {
    setLoadingMedicalHistory(true);
    try {
      const response = await axios.get(
        `${backendURL}/medical-history/${patient_id}`
      );
      if (response.status == 500) {
        throw new Error("Internal Server Error");
      }
      setMedicalHistory(response.data);
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setLoadingMedicalHistory(false);
    }
  };

  const fetchPatientMedicalReports = async (patient_id: string) => {
    setLoadingMedicalReports(true);
    try {
      const response = await axios.get(
        `${backendURL}/medical-reports/forpatient/${patient_id}`
      );
      if (response.status == 500) {
        throw new Error("Internal Server Error");
      }
      setMedicalReport(response.data);
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setLoadingMedicalReports(false);
    }
  };

  const fetchPatientSOAPNotes = async (patient_id: string) => {
    setLoadingSOAPNotes(true);
    try {
      const response = await axios.get(
        `${backendURL}/soap-notes/forpatient/${patient_id}`
      );
      if (response.status == 500) {
        throw new Error("Internal Server Error");
      }
      setSoapNote(response.data);
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setLoadingSOAPNotes(false);
    }
  }

  // Add/Edit SOAP Note function
  const [activeTab, setActiveTab] = useState('details');

  // Handle edit SOAP note
  const handleEditNote = (note: SOAPNote) => {
    setEditingNote(note);
    setNewNoteText(note.note);
    setIsAddNoteDialogOpen(true);
  };

  // Handle delete SOAP note
  const handleDeleteNote = async (noteId: number) => {
    if (!selectedPatient || !confirm('Are you sure you want to delete this note?')) return;
    
    setDeletingNoteId(noteId);
    try {
      await axios.delete(`${backendURL}/soap-notes/${noteId}`);
      await fetchPatientSOAPNotes(selectedPatient.patient_id);
      toast.success('Note deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete note');
    } finally {
      setDeletingNoteId(null);
    }
  };

  // Handle delete medical report
  const handleDeleteReport = async (reportId: number) => {
    if (!selectedPatient || !confirm('Are you sure you want to delete this report? This action cannot be undone.')) return;
    
    setDeletingReportId(reportId);
    try {
      await axios.delete(`${backendURL}/medical-reports/${reportId}`);
      await fetchPatientMedicalReports(selectedPatient.patient_id);
      toast.success('Report deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete report');
    } finally {
      setDeletingReportId(null);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedPatient || !newNoteText.trim()) {
      toast.error('Please select a patient and enter a note');
      return;
    }

    setIsSubmittingNote(true);
    try {
      if (editingNote) {
        // Update existing note
        await axios.put(`${backendURL}/soap-notes/${editingNote.note_id}`, {
          dentist_id: user?.id,
          patient_id: selectedPatient.patient_id,
          note: newNoteText.trim(),
        });
        toast.success('Note updated successfully');
      } else {
        // Create new note
        await axios.post(`${backendURL}/soap-notes`, {
          dentist_id: user?.id,
          patient_id: selectedPatient.patient_id,
          note: newNoteText.trim(),
        });
        toast.success('Note added successfully');
      }

      // Refresh SOAP notes and reset form
      await fetchPatientSOAPNotes(selectedPatient.patient_id);
      setNewNoteText('');
      setEditingNote(null);
      // Close dialog after successful submission
      setTimeout(() => setIsAddNoteDialogOpen(false), 300);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to save note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
      setReportName(nameWithoutExtension);
    }
  };

  // Upload Report function
  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedPatient || !selectedFile || !reportName.trim()) {
     toast.error('Please select a patient and enter a report name');
      return;
    }

    setIsUploadingReport(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const responseurl = await axios.post(
        `${backendURL}/files`,
        formData,
        {
          withCredentials: true,
        }
      );

      if (responseurl.status != 201) {
        throw new Error("Error Uploading File");
      }

      const response = await axios.post(
        `${backendURL}/medical-reports`,
        {
          patient_id: selectedPatient.patient_id,
          record_url: responseurl.data.url,
          record_name: reportName || selectedFile.name.split(".")[0]
        }
      );
      if (response.status != 201) {
        throw new Error("Error Creating Record");
      }

      await fetchPatientMedicalReports(selectedPatient.patient_id);
      toast.success('Report uploaded successfully');
      // Close dialog after successful upload
      setTimeout(() => {
        setIsUploadReportDialogOpen(false);
        setSelectedFile(null);
        setReportName('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 300);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploadingReport(false);
    }
  };

  const handleFileDownload = async (record_url: string) => {
    try {
      const fileUrl = `${backendURL}${record_url}`;
      const link = document.createElement('a');

      link.href = fileUrl;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Error downloading file');
    }
  };

  const filteredPatients = fetchedPatients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsMobileOverlayOpen(true);
    setActiveTab('details');
  }

  const closeMobileOverlay = () => {
    setIsMobileOverlayOpen(false)
  }

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientMedicalHistory(selectedPatient.patient_id);
      fetchPatientMedicalReports(selectedPatient.patient_id);
      fetchPatientSOAPNotes(selectedPatient.patient_id);
    }
    else {
      setMedicalHistory([]);
      setMedicalReport([]);
      setSoapNote([]);
    }
  }, [selectedPatient]);

  useEffect(() => {
    if (!user) return;
    fetchPatients();
  }, [user]);

  const PatientDetailsContent = () => (
    <div className="h-full flex flex-col">
      {/* Patient Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={selectedPatient?.profile_picture} />
            <AvatarFallback className="text-lg">
              {selectedPatient?.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{selectedPatient?.name}</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span>{selectedPatient?.email}</span>
              </div>
              {selectedPatient?.phone_number && (
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{selectedPatient.phone_number}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Patient Details */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history" className="lg:hidden">History</TabsTrigger>
            <TabsTrigger value="history" className="hidden lg:block">Medical History</TabsTrigger>
            <TabsTrigger value="reports" className="lg:hidden">Reports</TabsTrigger>
            <TabsTrigger value="reports" className="hidden lg:block">Medical Reports</TabsTrigger>
            <TabsTrigger value="notes" className="lg:hidden">Notes</TabsTrigger>
            <TabsTrigger value="notes" className="hidden lg:block">SOAP Notes</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-6">
            <TabsContent value="details" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                      <p className="text-gray-900">{selectedPatient?.date_of_birth || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Gender</label>
                      <p className="text-gray-900">{selectedPatient?.gender || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Blood Group</label>
                      <p className="text-gray-900">{selectedPatient?.blood_group || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">NIC</label>
                      <p className="text-gray-900">{selectedPatient?.NIC || 'Not provided'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">Address</label>
                      <p className="text-gray-900">{selectedPatient?.address || 'Not provided'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Medical History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedPatient && medicalHistory.map((history, index) => (
                      <div key={`${history.patient_id}-${history.medical_question_id}`} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{history.question?.question}</p>
                            <p className="text-gray-600 mt-1">{history.medical_question_answer}</p>
                          </div>
                          {history.medical_question_answer.toLowerCase().includes('yes') &&
                            history.question?.question.toLowerCase().includes('disease') && (
                              <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                            )}
                        </div>
                      </div>
                    ))}
                    {selectedPatient && medicalHistory.length === 0 && (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No medical history available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4 mt-0">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Medical Reports
                </h3>
                <Button
                  className='bg-emerald-500 hover:bg-emerald-600'
                  size="sm"
                  onClick={() => setIsUploadReportDialogOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Report
                </Button>
              </div>
              <div className="grid gap-4">
                {selectedPatient && medicalReport.map((report) => (
                  <Card key={report.report_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{report.record_name}</h4>
                            <p className="text-xs text-gray-500">
                              {new URL(`${backendURL}${report.record_url}`).pathname.split('/').pop()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteReport(report.report_id);
                            }}
                            disabled={deletingReportId === report.report_id}
                          >
                            {deletingReportId === report.report_id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            className='hover:bg-emerald-100' 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileDownload(report.record_url);
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {selectedPatient && medicalReport.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No medical reports available</p>
                      <Button
                        className='bg-emerald-500 hover:bg-emerald-600'
                        variant="outline"
                        size="sm"
                        onClick={() => setIsUploadReportDialogOpen(true)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload First Report
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4 mt-0">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">SOAP Notes</h3>
                <Button
                  className='bg-emerald-500 hover:bg-emerald-600'
                  size="sm"
                  onClick={() => setIsAddNoteDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
              <div className="space-y-4">
                {selectedPatient && soapNote.map((note) => (
                  <Card key={note.note_id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm text-gray-500">
                          {note.date}
                        </span>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-blue-500 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditNote(note);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-red-500 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.note_id);
                            }}
                            disabled={deletingNoteId === note.note_id}
                          >
                            {deletingNoteId === note.note_id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-900 whitespace-pre-wrap">{note.note}</p>
                    </CardContent>
                  </Card>
                ))}
                {selectedPatient && soapNote.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No SOAP notes available for this patient</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex flex-1 p-4 gap-4 overflow-hidden">
        {/* Sidebar - Patient List */}
        <div className={`${isMobileOverlayOpen ? 'hidden' : 'flex'} lg:flex w-full lg:w-96 bg-emerald-50 border rounded-3xl border-emerald-200 flex-col overflow-hidden`}>
          <div className="p-4 border-b border-emerald-200 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {filteredPatients.map((patient) => (
                <Card
                  key={patient.patient_id}
                  className={`mb-2 cursor-pointer transition-colors hover:bg-gray-50 ${selectedPatient?.patient_id === patient.patient_id ? 'ring-2 ring-emerald-500' : ''
                    }`}
                  onClick={() => handlePatientSelect(patient)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={patient.profile_picture} />
                        <AvatarFallback>
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{patient.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{patient.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {patient.blood_group && (
                            <Badge variant="secondary" className="text-xs">
                              {patient.blood_group}
                            </Badge>
                          )}
                          {medicalHistory.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Activity className="h-3 w-3 mr-1" />
                              History
                            </Badge>
                          )}
                          {medicalReport.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              Reports
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - Desktop */}
        <div className={`${isMobileOverlayOpen ? 'hidden' : 'hidden'} lg:flex flex-1 overflow-hidden`}>
          {selectedPatient ? (
            <div className="w-full p-6 overflow-hidden">
              <PatientDetailsContent />
            </div>
          ) : (
            <div className="w-full flex items-center justify-center">
              <div className="text-center">
                <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Patient</h3>
                <p className="text-gray-500">Choose a patient from the list to view their details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOverlayOpen && selectedPatient && (
        <div className="lg:hidden fixed inset-0 bg-white z-50 flex flex-col">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <Button
              variant="ghost"
              size="sm"
              onClick={closeMobileOverlay}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Patients
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeMobileOverlay}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile Content */}
          <div className="flex-1 overflow-hidden p-4">
            <PatientDetailsContent />
          </div>
        </div>
      )}

      {/* Desktop Patient Details */}
      {!isMobileOverlayOpen && selectedPatient && (
        <div className="hidden lg:block fixed inset-y-0 right-0 w-2/3 bg-white border-l border-gray-200 z-40">
          <div className="h-full p-6 overflow-hidden">
            <PatientDetailsContent />
          </div>
        </div>
      )}

      {/* Add SOAP Note Dialog */}
      <Dialog open={isAddNoteDialogOpen} onOpenChange={setIsAddNoteDialogOpen}>
        <form onSubmit={handleAddNote}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingNote ? 'Edit' : 'Add'} SOAP Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="patient-name">Patient</Label>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {selectedPatient?.name}
                </p>
              </div>
              <div>
                <Label htmlFor="note-text">Note {editingNote && <span className="text-xs text-gray-500 ml-1">(editing)</span>}</Label>
                <Textarea
                  id="note-text"
                  placeholder="Enter SOAP note details..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  rows={6}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddNoteDialogOpen(false);
                    setNewNoteText('');
                  }}
                  disabled={isSubmittingNote}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingNote || !newNoteText.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  {isSubmittingNote 
                    ? editingNote ? 'Updating...' : 'Adding...' 
                    : editingNote ? 'Update Note' : 'Add Note'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </form>
      </Dialog>

      {/* Upload Report Dialog */}
      <Dialog open={isUploadReportDialogOpen} onOpenChange={setIsUploadReportDialogOpen}>
        <form onSubmit={handleUploadReport}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Medical Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="patient-name">Patient</Label>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {selectedPatient?.name}
                </p>
              </div>
              <div>
                <Label htmlFor="report-name">Report Name</Label>
                <Input
                  id="report-name"
                  type="text"
                  placeholder="Enter report name..."
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="file-upload">Select File</Label>
                <div className="mt-1">
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-emerald-50 file:text-emerald-700
                      hover:file:bg-emerald-100"
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsUploadReportDialogOpen(false);
                    setSelectedFile(null);
                    setReportName('');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={isUploadingReport}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUploadingReport || !selectedFile || !reportName.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  {isUploadingReport ? 'Uploading...' : 'Upload Report'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </form>
      </Dialog>
    </div>
  )
}