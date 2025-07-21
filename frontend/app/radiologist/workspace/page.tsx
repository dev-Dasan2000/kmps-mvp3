"use client";

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Search, Calendar, Clock, FileText, Film, User, Activity, Monitor, ScanLine, Eye, AlertTriangle } from 'lucide-react';
import { AuthContext } from '@/context/auth-context';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import axios from 'axios';

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

// Custom debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const RadiologistWorkspace: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studyIdParam = searchParams.get('study_id');
  
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms debounce
  const [searchResults, setSearchResults] = useState<Study[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Add state for critical conditions
  const [criticalConditions, setCriticalConditions] = useState<CriticalCondition[]>([]);
  
  const { user, isLoggedIn, accessToken } = useContext(AuthContext);
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const dicomurlx = process.env.NEXT_PUBLIC_DICOM_URL;
  const radiologistId = user?.id;
  
  // Load study if ID is in URL parameters
  useEffect(() => {
    if (studyIdParam) {
      fetchStudyById(parseInt(studyIdParam));
    }
  }, [studyIdParam]);

  // Effect to fetch search results when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm.trim() && radiologistId) {
      searchStudies(debouncedSearchTerm);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, radiologistId]);

  const fetchStudyById = async (studyId: number) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${backendURL}/studies/${studyId}`);
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

  // New function to fetch patient critical conditions
  const fetchPatientCriticalConditions = async (patientId: string) => {
    try {
      const response = await axios.get(`${backendURL}/medical-history/${patientId}`);

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

  const searchStudies = async (term: string) => {
    if (!term.trim() || !radiologistId) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await axios.get(`${backendURL}/studies/search/radiologist/${radiologistId}`, {
        params: { term }
      });
      setSearchResults(response.data);
      setIsSearching(false);
    } catch (error) {
      console.error('Error searching studies:', error);
      toast.error('Failed to search studies');
      setIsSearching(false);
    }
  };

  const openStudy = (studyId: number) => {
    router.push(`/radiologist/workspace?study_id=${studyId}`);
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

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Radiologist Workspace</h1>
      
      {!selectedStudy ? (
        <Card>
          <CardHeader>
            <CardTitle>Search Studies</CardTitle>
            <CardDescription>
              Search by patient name, ID, assertion number, or description
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2 mb-6">
              <Input
                placeholder="Search studies by patient name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              {isSearching && (
                <div className="text-sm text-emerald-600 flex items-center">
                  Searching...
                </div>
              )}
            </div>

            <div className="space-y-4">
              {searchResults.length === 0 ? (
                searchTerm ? (
                  isSearching ? (
                    <p className="text-center text-gray-500 py-8">Searching...</p>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No results found. Try a different search term.</p>
                  )
                ) : (
                  <p className="text-center text-gray-500 py-8">Type to search for studies.</p>
                )
              ) : (
                <div className="space-y-2">
                  {searchResults.map((study) => {
                    const patientCriticalConditions = getPatientCriticalConditions(study.patient_id);
                    const hasCriticalConditions = patientCriticalConditions.length > 0;
                    
                    return (
                      <div 
                        key={study.study_id}
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => openStudy(study.study_id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900 flex items-center gap-2">
                              {study.patient?.name || 'Unknown Patient'} 
                              {study.isurgent && <Badge className="bg-red-500">URGENT</Badge>}
                              {hasCriticalConditions && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Medical Alert
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-white p-3 shadow-lg border border-gray-200 rounded-lg max-w-xs">
                                      <div className="space-y-2">
                                        <p className="font-medium text-red-700">Critical Medical Conditions:</p>
                                        <ul className="list-disc pl-4 text-sm text-gray-700">
                                          {patientCriticalConditions.map((condition, idx) => (
                                            <li key={idx}>{condition}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </h3>
                            <p className="text-sm text-gray-500">ID: {study.patient_id}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {study.modality || 'Unknown Modality'} • {study.body_part || 'N/A'}
                            </p>
                          </div>
                          <div className="text-sm text-gray-500 text-right">
                            <div className="flex items-center justify-end">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(study.date)}
                            </div>
                            <div className="flex items-center justify-end mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTime(study.time)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedStudy(null);
                router.push('/radiologist/workspace');
              }}
            >
              Back to Search
            </Button>
            
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

          {/* Report Section - Would show existing report or form to create one */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-emerald-600" />
                Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedStudy.report_id ? (
                <div className="p-4 border rounded-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Report #{selectedStudy.report_id}</h3>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        router.push(`/radiologist/reports?studyId=${selectedStudy.study_id}`);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Report
                    </Button>
                  </div>
                  <p className="text-gray-500 italic">Click the button above to view the full report.</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No report has been created for this study yet.</p>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-500" 
                    onClick={() => {
                      router.push(`/radiologist/reports?studyId=${selectedStudy.study_id}`);
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Create Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RadiologistWorkspace;
