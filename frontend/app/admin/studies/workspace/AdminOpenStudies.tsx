"use client";

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { FileText, Film, User, Activity, Monitor, ScanLine, Eye, AlertTriangle, Check, X, ChevronDown } from 'lucide-react';
import { AuthContext } from '@/context/auth-context';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Types based on the database structure
interface Patient {
  patient_id: string;
  name: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  address?: string;
  blood_group?: string;
}

interface Doctor {
  id: number;
  name: string;
  specialization?: string;
}

interface Radiologist {
  radiologist_id: string;
  name: string;
  specialization?: string;
}

// Update the Study interface to include report property
interface Study {
  study_id: number;
  patient_id: string;
  patient?: Patient;
  radiologist_id?: string;
  radiologist?: Radiologist;
  doctors?: Doctor[];
  date: string;
  time: string;
  modality?: string;
  report_id?: number;
  assertion_number?: string;
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
    report_id?: number;
  };
}

// Interface for medical history and critical conditions
interface MedicalHistory {
  patient_id: string;
  medical_question_id: number;
  medical_question_answer: string;
  question: { 
    question_id: string;
    question: string;
  };
}

// Add interface for critical conditions
interface CriticalCondition {
  patientId: string;
  conditions: string[];
}

const AdminOpenStudies: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studyIdParam = searchParams.get('study_id');
  
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add state for critical conditions
  const [criticalConditions, setCriticalConditions] = useState<CriticalCondition[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  const { user, isLoggedIn, isLoadingAuth, apiClient } = useContext(AuthContext);
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const dicomurlx = process.env.NEXT_PUBLIC_DICOM_URL;
  
  // Load study if ID is in URL parameters
  useEffect(() => {
    if (studyIdParam) {
      fetchStudyById(parseInt(studyIdParam));
    } else {
      setIsLoading(false);
    }
  }, [studyIdParam]);

  // Add a function to open report file directly
  const openReportFile = async (reportId: number) => {
    try {
      // First fetch the report data to get the file URL
      const reportResponse = await apiClient.get(`/reports/${reportId}`);
      const reportData = reportResponse.data;
      
      const fileUrl = reportData.report_file_url;
      
      if (!fileUrl) {
        toast.error('Report file URL is missing');
        return;
      }
      
      // Open PDF in a new tab
      window.open(`${backendURL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`, '_blank');
    } catch (error) {
      console.error('Error opening report file:', error);
      toast.error('Failed to open report file');
    }
  };

  // Update fetchStudyById to include report data
  const fetchStudyById = async (studyId: number) => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/studies/${studyId}?include=report`);
      setSelectedStudy(response.data);
      
      // Fetch patient's critical conditions when a study is selected
      if (response.data.patient_id) {
        fetchPatientCriticalConditions(response.data.patient_id);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching study:', error);
      toast.error('Failed to load study');
      setIsLoading(false);
    }
  };

  // Function to update report status
  const updateReportStatus = async (newStatus: string) => {
    if (!selectedStudy || !selectedStudy.report_id) return;
    
    try {
      setUpdatingStatus(true);
      
      await apiClient.put(`/reports/${selectedStudy.report_id}`, {
        status: newStatus
      });
      
      // Update local state
      setSelectedStudy(prev => {
        if (!prev) return null;
        return {
          ...prev,
          report: {
            ...prev.report,
            status: newStatus
          }
        };
      });
      
      toast.success(`Report status updated to ${newStatus}`);
      setUpdatingStatus(false);
    } catch (error) {
      console.error('Error updating report status:', error);
      toast.error('Failed to update report status');
      setUpdatingStatus(false);
    }
  };

  // New function to fetch patient critical conditions
  const fetchPatientCriticalConditions = async (patientId: string) => {
    try {
      const response = await apiClient.get(`/medical-history/${patientId}`);

      if (response.status === 200) {
        // Check for critical conditions
        const criticalConditionsList: string[] = [];
        response.data.forEach((item: MedicalHistory) => {
          // Check for critical medical conditions
          if (item.medical_question_answer === 'Yes') {
            if (item.question.question.includes('heart disease')) {
              criticalConditionsList.push('Heart Disease');
            } else if (item.question.question.includes('diabetes')) {
              criticalConditionsList.push('Diabetes');
            } else if (item.question.question.includes('kidney disease')) {
              criticalConditionsList.push('Kidney Disease');
            } else if (item.question.question.includes('liver disease')) {
              criticalConditionsList.push('Liver Disease');
            } else if (item.question.question.includes('blood disorder')) {
              criticalConditionsList.push('Blood Disorder');
            } else if (item.question.question.includes('hypertension')) {
              criticalConditionsList.push('Hypertension');
            }
          }
        });

        if (criticalConditionsList.length > 0) {
          // Update critical conditions state
          setCriticalConditions(prev => {
            const filtered = prev.filter(c => c.patientId !== patientId);
            return [...filtered, { patientId, conditions: criticalConditionsList }];
          });
        } else {
          // Remove any existing critical conditions for this patient
          setCriticalConditions(prev => prev.filter(c => c.patientId !== patientId));
        }
      }
    } catch (error) {
      console.error('Error fetching critical conditions:', error);
    }
  };

  // Helper function to get critical conditions for a patient
  const getPatientCriticalConditions = (patientId: string): string[] => {
    const patientCondition = criticalConditions.find(c => c.patientId === patientId);
    return patientCondition?.conditions || [];
  };

  const openDicomViewer = (dicomUrl?: string) => {
    if (!dicomUrl) {
      toast.error('No DICOM file available');
      return;
    }

    try {
      const fullUrl = dicomUrl.startsWith('http') ? dicomUrl : `${backendURL}${dicomUrl}`;
      const dicomViewerUrl = `${dicomurlx || ''}/open-dicom?url=${encodeURIComponent(fullUrl)}`;
      window.open(dicomViewerUrl, '_blank');
    } catch (error) {
      console.error('Error opening DICOM viewer:', error);
      toast.error('Failed to open DICOM viewer');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString.split('T')[0]; // Fallback
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A';
    
    try {
      // Handle both full ISO strings and time-only strings
      const hasT = timeString.includes('T');
      const timePart = hasT ? timeString.split('T')[1] : timeString;
      
      return timePart.substring(0, 5); // Get HH:MM
    } catch (e) {
      return timeString; // Return as-is if parsing fails
    }
  };

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'completed':
      case 'finalized':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  useEffect(() => {
    if(isLoadingAuth) return;
    if(!isLoggedIn) {
      toast.error("You are not logged in");
      router.push("/")
    }
    else if(user.role != "admin") {
      toast.error("Access Denied");
      router.push("/")
    }
  }, [isLoadingAuth]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
        <h2 className="text-xl font-medium text-gray-700">Loading study details...</h2>
        <p className="text-gray-500 mt-2">Please wait while we fetch the information.</p>
      </div>
    );
  }

  if (!selectedStudy && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">No Study Selected</h2>
          <p className="text-gray-500 mb-6">
            Please select a study from the studies list to view details.
          </p>
          <Button 
            onClick={() => router.push('/admin/studies')}
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            Go to Studies List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Study Details</h1>
        <Button
          variant="outline"
          onClick={() => router.push('/admin/studies')}
        >
          Back to Studies
        </Button>
      </div>
      
      {selectedStudy && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Badge className={`${getStatusColor(selectedStudy.status)} px-3 py-1`}>
                {selectedStudy.status || 'Unknown Status'}
              </Badge>
              {selectedStudy.isurgent && (
                <Badge className="bg-red-500 text-white">URGENT</Badge>
              )}
            </div>
            
            {selectedStudy.dicom_file_url && (
              <Button 
                onClick={() => openDicomViewer(selectedStudy.dicom_file_url)}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                <Film className="h-4 w-4 mr-2" />
                Open DICOM Viewer
              </Button>
            )}
          </div>
          
          {/* Critical conditions alert */}
          {selectedStudy && getPatientCriticalConditions(selectedStudy.patient_id).length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-red-800 text-lg">Critical Medical Conditions</h3>
                  <p className="text-red-700 mt-1 mb-3">This patient has medical conditions that require special attention:</p>
                  <div className="flex flex-wrap gap-2">
                    {getPatientCriticalConditions(selectedStudy.patient_id).map((condition, idx) => (
                      <Badge key={idx} variant="outline" className="bg-white text-red-700 border-red-300 py-1.5 px-3">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Patient Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-emerald-600" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Name:</span>
                  <span>{selectedStudy.patient?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">ID:</span>
                  <span>{selectedStudy.patient_id}</span>
                </div>
                {selectedStudy.patient?.date_of_birth && (
                  <div className="flex justify-between">
                    <span className="font-medium">DOB:</span>
                    <span>{formatDate(selectedStudy.patient.date_of_birth)}</span>
                  </div>
                )}
                {selectedStudy.patient?.gender && (
                  <div className="flex justify-between">
                    <span className="font-medium">Gender:</span>
                    <span>{selectedStudy.patient.gender}</span>
                  </div>
                )}
                {selectedStudy.patient?.phone && (
                  <div className="flex justify-between">
                    <span className="font-medium">Phone:</span>
                    <span>{selectedStudy.patient.phone}</span>
                  </div>
                )}
                {selectedStudy.patient?.blood_group && (
                  <div className="flex justify-between">
                    <span className="font-medium">Blood Group:</span>
                    <span>{selectedStudy.patient.blood_group.toUpperCase()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Study Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-emerald-600" />
                  Study Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Study ID:</span>
                  <span>{selectedStudy.study_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Date:</span>
                  <span>{formatDate(selectedStudy.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Time:</span>
                  <span>{formatTime(selectedStudy.time)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Modality:</span>
                  <span>{selectedStudy.modality || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Body Part:</span>
                  <span>{selectedStudy.body_part || 'N/A'}</span>
                </div>
                {selectedStudy.assertion_number && (
                  <div className="flex justify-between">
                    <span className="font-medium">Assertion #:</span>
                    <span>{selectedStudy.assertion_number}</span>
                  </div>
                )}
                {selectedStudy.isurgent && (
                  <div className="mt-2">
                    <Badge className="bg-red-500 w-full justify-center">URGENT</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Doctor Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <ScanLine className="h-5 w-5 mr-2 text-emerald-600" />
                  Healthcare Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedStudy.radiologist && (
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500">Assigned Radiologist:</span>
                    <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                      <Avatar className="h-6 w-6 bg-emerald-100 text-emerald-700">
                        <span className="text-xs">{selectedStudy.radiologist.name.charAt(0)}</span>
                      </Avatar>
                      <span>{selectedStudy.radiologist.name}</span>
                    </div>
                  </div>
                )}

                {selectedStudy.doctors && selectedStudy.doctors.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500">Referring Doctors:</span>
                    <div className="space-y-1">
                      {selectedStudy.doctors.map(doctor => (
                        <div key={doctor.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                          <Avatar className="h-6 w-6 bg-blue-100 text-blue-700">
                            <span className="text-xs">{doctor.name.charAt(0)}</span>
                          </Avatar>
                          <span>{doctor.name}</span>
                          {doctor.specialization && (
                            <span className="text-xs text-gray-500">({doctor.specialization})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!selectedStudy.doctors || selectedStudy.doctors.length === 0) && 
                 !selectedStudy.radiologist && (
                  <p className="text-gray-500 text-center py-4">No healthcare team assigned</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Description and Reason */}
          {(selectedStudy.description || selectedStudy.reason) && (
            <Card>
              <CardHeader>
                <CardTitle>Clinical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedStudy.description && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Description</h4>
                    <p className="text-gray-600 p-3 bg-gray-50 rounded-md">{selectedStudy.description}</p>
                  </div>
                )}
                {selectedStudy.reason && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Reason for Study</h4>
                    <p className="text-gray-600 p-3 bg-gray-50 rounded-md">{selectedStudy.reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Report Section - With status update dropdown */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-emerald-600" />
                Report
              </CardTitle>
              
              {selectedStudy.report_id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={updatingStatus}>
                    <Button variant="outline" size="sm" className="ml-auto">
                      <span className="mr-1">Change Status</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => updateReportStatus('new')}
                      className="flex items-center gap-2"
                    >
                      <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                      New
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => updateReportStatus('draft')}
                      className="flex items-center gap-2"
                    >
                      <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                      Draft
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => updateReportStatus('finalized')}
                      className="flex items-center gap-2"
                    >
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      Finalized
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardHeader>
            <CardContent>
              {selectedStudy.report_id ? (
                <div className="p-4 border rounded-md">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-medium">Report #{selectedStudy.report_id}</h3>
                      <Badge variant="outline" className={`mt-1 ${getStatusColor(selectedStudy.report?.status)}`}>
                        {selectedStudy.report?.status || 'Unknown Status'}
                      </Badge>
                    </div>
                    
                    {selectedStudy.report?.report_file_url && (
                      <Button 
                        size="sm" 
                        onClick={() => openReportFile(selectedStudy.report_id!)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Open Report
                      </Button>
                    )}
                  </div>
                  
                  {updatingStatus ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="animate-spin h-4 w-4 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                      <span>Updating status...</span>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">
                      {selectedStudy.report?.report_file_url 
                        ? 'This report has an attached document. Click the button above to view it.' 
                        : 'This report does not have an attached document yet.'}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No report has been created for this study yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminOpenStudies;
