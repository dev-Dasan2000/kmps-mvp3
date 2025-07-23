'use client'

import React, { useState, useEffect, useRef, useContext, useCallback, useMemo } from 'react'
import { Search, User, FileText, Calendar, Phone, Mail, Download, Upload, AlertCircle, Activity, X, ArrowLeft, Plus, ClipboardCheck, Eye, FileSignature, CheckCircle, Trash2, AlertTriangle } from 'lucide-react'
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
import MedicalHistoryForm from '@/components/medicalhistoryform'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import router from 'next/router'

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

interface ConsentForm {
  form_id: number;
  patient_id: string;
  dentist_id: string;
  procedure_details: string;
  explanation_given: string;
  sign: string;
  status: string;
  created_date: string;
  signed_date: string;
}

// Add new interface for critical conditions
interface CriticalCondition {
  patientId: string;
  conditions: string[];
}

// ConsentFormContent component to prevent unnecessary re-renders
const ConsentFormContent = React.memo(({
  selectedPatient,
  user,
  onSubmit,
  onClose,
  submitting
}: {
  selectedPatient: Patient | null,
  user: any,
  onSubmit: (procedureDetails: string, explanationGiven: string) => void,
  onClose: () => void,
  submitting: boolean
}) => {
  const [procedureDetails, setProcedureDetails] = useState('');
  const [explanationGiven, setExplanationGiven] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(procedureDetails, explanationGiven);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${true ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
              }`}>
              <User className="w-5 h-5" />
            </div>
            <span className="text-xs mt-2 text-gray-600">Details</span>
          </div>
          <div className="flex-1 h-0.5 mx-4 bg-gray-200" />
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${procedureDetails ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
              }`}>
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs mt-2 text-gray-600">Procedure</span>
          </div>
          <div className="flex-1 h-0.5 mx-4 bg-gray-200" />
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${explanationGiven ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
              }`}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-xs mt-2 text-gray-600">Risks & Explanation</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left side - Form */}
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              Patient & Doctor Information
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700">Patient Name</Label>
                <Input
                  value={selectedPatient?.name || ''}
                  disabled
                  className="mt-1.5 bg-gray-50"
                />
              </div>
              <div>
                <Label className="text-gray-700">Doctor Name</Label>
                <Input
                  value={user?.name || ''}
                  disabled
                  className="mt-1.5 bg-gray-50"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              Procedure Details
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700">
                  Procedure Description
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Textarea
                  value={procedureDetails}
                  onChange={(e) => setProcedureDetails(e.target.value)}
                  placeholder="Describe the dental procedure in detail..."
                  className="mt-1.5 h-28 resize-none"
                />
                <p className="text-sm text-gray-500 mt-1.5">
                  Include specific details about the procedure, techniques, and materials to be used.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-gray-500" />
              Patient Explanation
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700">
                  Explanation Given to Patient
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Textarea
                  value={explanationGiven}
                  onChange={(e) => setExplanationGiven(e.target.value)}
                  placeholder="Document the explanation provided to the patient..."
                  className="mt-1.5 h-28 resize-none"
                />
                <p className="text-sm text-gray-500 mt-1.5">
                  Detail the information shared with the patient about benefits, risks, and alternatives.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Consent Information */}
        <div className="space-y-5">
          <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Consent Context</h4>
                <p className="text-sm text-blue-700 leading-relaxed">
                  This consent form documents the patient's agreement to undergo the specified dental procedure
                  after being fully informed of the risks, benefits, and alternatives.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-100">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Risk Factors
            </h4>
            <div className="space-y-3">
              {[
                'Potential complications during or after the procedure',
                'Possible side effects from anesthesia or medications',
                'Recovery time and post-procedure care requirements',
                'Alternative treatment options'
              ].map((risk, index) => (
                <div key={index} className="flex items-start gap-2.5 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="mt-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  </div>
                  <p className="text-sm text-gray-700">{risk}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-100">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Requirements Checklist
            </h4>
            <div className="space-y-3">
              {[
                'Clear explanation of the procedure',
                'Documentation of patient understanding',
                'Signature from both patient and doctor',
                'Date of consent'
              ].map((requirement, index) => (
                <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <Checkbox
                    id={`req-${index}`}
                    checked={!!procedureDetails && !!explanationGiven}
                    disabled
                  />
                  <label
                    htmlFor={`req-${index}`}
                    className="text-sm text-gray-700 cursor-pointer select-none"
                  >
                    {requirement}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="px-4"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={submitting || !procedureDetails || !explanationGiven}
          className="bg-emerald-500 hover:bg-emerald-600 px-4"
        >
          {submitting ? 'Submitting...' : 'Submit Consent Form'}
        </Button>
      </div>
    </form>
  );
});

ConsentFormContent.displayName = 'ConsentFormContent';

// SignConsentDialog component
const SignConsentDialog = React.memo(({
  isOpen,
  onClose,
  onSign,
  submitting
}: {
  isOpen: boolean,
  onClose: () => void,
  onSign: (doctorName: string) => void,
  submitting: boolean
}) => {
  const [doctorName, setDoctorName] = useState('');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Sign Consent Form</DialogTitle>
          <DialogDescription>
            Please enter your name to sign this consent form.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Patient's Name</Label>
            <Input
              placeholder="Enter your full name"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSign(doctorName)}
            disabled={!doctorName || submitting}
          >
            {submitting ? 'Signing...' : 'Sign Form'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

SignConsentDialog.displayName = 'SignConsentDialog';

// ViewConsentFormDialog component
const ViewConsentFormDialog = React.memo(({
  isOpen,
  onClose,
  form
}: {
  isOpen: boolean,
  onClose: () => void,
  form: any
}) => {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            Consent Form - {form?.patient?.name}
          </DialogTitle>
          <DialogDescription className="text-gray-500 mt-1.5">
            Patient ID: {form?.patient_id}
          </DialogDescription>
          <div className="flex items-center gap-2 mt-2">
            {form?.status === 'signed' ? (
              <Badge className="bg-emerald-100 text-emerald-700">
                Signed on {formatDate(form?.signed_date)}
              </Badge>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-700">
                Not Signed
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient and Doctor Information */}
          <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              Patient & Doctor Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700">Patient Name</h4>
                <p className="text-gray-600 mt-1">{form?.patient?.name}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Doctor Name</h4>
                <p className="text-gray-600 mt-1">{form?.dentist?.name}</p>
              </div>
            </div>
          </div>

          {/* Consent Context */}
          <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Consent Context</h4>
                <p className="text-sm text-blue-700 leading-relaxed">
                  This consent form documents the patient's agreement to undergo the specified dental procedure
                  after being fully informed of the risks, benefits, and alternatives. The patient acknowledges
                  understanding of the procedure and its implications.
                </p>
              </div>
            </div>
          </div>

          {/* Procedure Details */}
          <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              Procedure Details
            </h3>
            <p className="text-gray-600 whitespace-pre-wrap">{form?.procedure_details}</p>
          </div>

          {/* Risk Areas */}
          <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Risk Areas
            </h3>
            <div className="space-y-3">
              {[
                'Potential complications during or after the procedure',
                'Possible side effects from anesthesia or medications',
                'Recovery time and post-procedure care requirements',
                'Alternative treatment options',
                'Infection risks and preventive measures',
                'Potential impact on existing conditions',
                'Post-procedure limitations and restrictions'
              ].map((risk, index) => (
                <div key={index} className="flex items-start gap-2.5 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="mt-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  </div>
                  <p className="text-sm text-gray-700">{risk}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation Given */}
          <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-gray-500" />
              Explanation Given
            </h3>
            <p className="text-gray-600 whitespace-pre-wrap">{form?.explanation_given}</p>
          </div>

          {/* Requirements Checklist */}
          <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Requirements Checklist
            </h3>
            <div className="space-y-3">
              {[
                'Clear explanation of the procedure provided',
                'All risks and complications discussed',
                'Alternative treatment options presented',
                'Patient questions addressed and answered',
                'Post-procedure care instructions explained',

                'Follow-up appointment schedule discussed'
              ].map((requirement, index) => (
                <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <Checkbox
                    id={`req-${index}`}
                    checked={true}
                    disabled
                  />
                  <label
                    htmlFor={`req-${index}`}
                    className="text-sm text-gray-700 cursor-pointer select-none"
                  >
                    {requirement}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Signature Information */}
          {form?.status === 'signed' && (
            <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Signature Information
              </h3>
              <div className="space-y-2">
                <div>
                  <h4 className="font-medium text-gray-700">Signed By</h4>
                  <p className="text-gray-600 mt-1">{form?.sign}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Signed Date</h4>
                  <p className="text-gray-600 mt-1">{formatDate(form?.signed_date)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form Metadata */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div>Created: {formatDate(form?.created_date)}</div>
              <div>Form ID: {form?.form_id}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

ViewConsentFormDialog.displayName = 'ViewConsentFormDialog';

// ConsentFormsList component
const ConsentFormsList = React.memo(({
  consentForms,
  onSign,
  onView,
  onDelete
}: {
  consentForms: any[],
  onSign: (formId: string) => void,
  onView: (form: any) => void,
  onDelete: (formId: string) => void
}) => {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Sort consent forms: signed forms first, then by date
  const sortedForms = [...consentForms].sort((a, b) => {
    // First sort by signed status
    if (a.status === 'signed' && b.status !== 'signed') return -1;
    if (a.status !== 'signed' && b.status === 'signed') return 1;

    // Then sort by date (newest first)
    const dateA = new Date(a.created_date).getTime();
    const dateB = new Date(b.created_date).getTime();
    return dateB - dateA;
  });

  return (
    <div className="space-y-4">
      {sortedForms.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No consent forms available
        </div>
      ) : (
        sortedForms.map((form) => (
          <div
            key={form.form_id}
            className={`bg-white rounded-lg border ${form.status === 'signed' ? 'border-emerald-200' : 'border-gray-200'
              } p-6 space-y-4`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Consent Form
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Created on {formatDate(form.created_date)}
                </p>
                {form.status === 'signed' && (
                  <p className="text-sm text-emerald-600 mt-1">
                    Signed by: {form.sign}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {form.status === 'signed' ? (
                  <Badge className="bg-emerald-100 text-emerald-700">
                    Signed on {formatDate(form.signed_date)}
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-700">
                    Not Signed
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Procedure Details</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">
                  {form.procedure_details}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Explanation Given</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">
                  {form.explanation_given}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(form)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(form.form_id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
              {form.status !== 'signed' && (
                <Button
                  size="sm"
                  onClick={() => onSign(form.form_id)}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  Sign Form
                </Button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
});

ConsentFormsList.displayName = 'ConsentFormsList';

export default function DentistDashboard({ params }: DashboardProps) {

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isLoadingAuth, isLoggedIn, apiClient } = useContext(AuthContext);

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
  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false);
  const [isUploadReportDialogOpen, setIsUploadReportDialogOpen] = useState(false);
  const [isDetailsOverlayOpen, setIsDetailsOverlayOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportName, setReportName] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isUploadingReport, setIsUploadingReport] = useState(false);
  const [editingNote, setEditingNote] = useState<SOAPNote | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<number | null>(null);
  const [consentForms, setConsentForms] = useState<ConsentForm[]>([]);
  const [view, setView] = useState<'list' | 'create' | null>(null);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  const [signingForm, setSigningForm] = useState(false);
  const [submittingConsentForm, setSubmittingConsentForm] = useState(false);
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [isViewFormOpen, setIsViewFormOpen] = useState(false);
  const [isDeletingForm, setIsDeletingForm] = useState(false);
  // Add state for critical conditions
  const [criticalConditions, setCriticalConditions] = useState<CriticalCondition[]>([]);

  // Open create form
  const openCreateForm = useCallback(() => {
    setView('create');
  }, []);

  // Close dialog
  const closeDialog = useCallback(() => {
    setView(null);
  }, []);

  // Fetch consent forms
  const fetchConsentForms = useCallback(async (patientId: string) => {
    try {
      const response = await apiClient.get(`/consent-forms/patient/${patientId}`);
      if (response.status === 200) {
        setConsentForms(response.data);
      }
    } catch (error) {
      console.error('Error fetching consent forms:', error);
      toast.error('Failed to fetch consent forms');
    }
  }, [backendURL]);

  // Handle consent form submit
  const handleConsentFormSubmit = useCallback(async (procedureDetails: string, explanationGiven: string) => {
    if (!selectedPatient || !user?.id) return;

    setSubmittingConsentForm(true);
    try {
      const response = await apiClient.post(`/consent-forms`, {
        patient_id: selectedPatient.patient_id,
        dentist_id: user.id,
        procedure_details: procedureDetails,
        explanation_given: explanationGiven,
        status: 'pending'
      });

      if (response.status === 201) {
        toast.success('Consent form submitted successfully');
        await fetchConsentForms(selectedPatient.patient_id);
        closeDialog();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit consent form');
    } finally {
      setSubmittingConsentForm(false);
    }
  }, [selectedPatient, user, backendURL, fetchConsentForms, closeDialog]);

  // Handle form signing
  const handleSignForm = useCallback(async (doctorName: string) => {
    if (!selectedFormId) return;

    setSigningForm(true);
    try {
      const response = await apiClient.put(`/consent-forms/${selectedFormId}`, {
        status: 'signed',
        sign: doctorName,
        signed_date: new Date().toISOString().split('T')[0]
      });

      if (response.status === 200) {
        toast.success('Consent form signed successfully');
        if (selectedPatient) {
          await fetchConsentForms(selectedPatient.patient_id);
        }
        setIsSignDialogOpen(false);
      }
    } catch (error) {
      console.error('Error signing consent form:', error);
      toast.error('Failed to sign consent form');
    } finally {
      setSigningForm(false);
      setSelectedFormId(null);
    }
  }, [selectedFormId, backendURL, selectedPatient, fetchConsentForms]);

  // Handle sign button click
  const handleSignClick = useCallback((formId: string) => {
    setSelectedFormId(formId);
    setIsSignDialogOpen(true);
  }, []);

  // Handle view form
  const handleViewForm = useCallback(async (form: any) => {
    try {
      // Fetch complete consent form data including patient details
      const response = await apiClient.get(`/consent-forms/${form.form_id}`);
      if (response.status === 200) {
        setSelectedForm(response.data);
        setIsViewFormOpen(true);
      }
    } catch (error) {
      console.error('Error fetching consent form details:', error);
      toast.error('Failed to fetch consent form details');
      setIsViewFormOpen(false);
    }
  }, [backendURL]);

  // Handle delete form
  const handleDeleteForm = useCallback(async (formId: string) => {
    if (!confirm('Are you sure you want to delete this consent form?')) return;

    setIsDeletingForm(true);
    try {
      const response = await apiClient.delete(`/consent-forms/${formId}`);
      if (response.status === 200) {
        toast.success('Consent form deleted successfully');
        if (selectedPatient) {
          await fetchConsentForms(selectedPatient.patient_id);
        }
      }
    } catch (error) {
      console.error('Error deleting consent form:', error);
      toast.error('Failed to delete consent form');
    } finally {
      setIsDeletingForm(false);
    }
  }, [backendURL, selectedPatient, fetchConsentForms]);

  // Form handlers
  const handleProcedureChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // setProcedureDetails(e.target.value); // This state is removed
  }, []);

  const handleExplanationChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // setExplanationGiven(e.target.value); // This state is removed
  }, []);

  const handleSubmitConsentForm = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    // if (!procedureDetails || !explanationGiven || !selectedPatient || !user?.id) return; // This state is removed

    setSubmittingConsentForm(true);
    try {
      const response = await apiClient.post(`/consent-forms`, {
        patient_id: selectedPatient?.patient_id, // Use selectedPatient?.patient_id
        dentist_id: user?.id,
        procedure_details: newNoteText, // Use newNoteText
        explanation_given: newNoteText, // Use newNoteText
        status: 'pending',
        created_date: new Date().toISOString(),
      });

      if (response.status === 201) {
        toast.success('Consent form submitted successfully');
        await fetchConsentForms(selectedPatient?.patient_id || ''); // Use selectedPatient?.patient_id
        setIsAddNoteDialogOpen(false);
        setNewNoteText('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit consent form');
    } finally {
      setSubmittingConsentForm(false);
    }
  }, [newNoteText, selectedPatient, user, backendURL, fetchConsentForms]);

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const response = await apiClient.get(
        `/appointments/fordentist/patients/${user?.id}`
      );
      if (response.status == 500) {
        throw new Error("Internal Server Error");
      }
      setFetchedPatients(response.data);

      // Fetch critical conditions for all patients
      for (const patient of response.data) {
        fetchPatientCriticalConditions(patient.patient_id);
      }
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setLoadingPatients(false);
    }
  };

  // New function to fetch only critical conditions
  const fetchPatientCriticalConditions = async (patient_id: string) => {
    try {
      const response = await apiClient.get(
        `/medical-history/${patient_id}`
      );

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
            const filtered = prev.filter(c => c.patientId !== patient_id);
            return [...filtered, { patientId: patient_id, conditions: criticalConditionsList }];
          });
        } else {
          // Remove any existing critical conditions for this patient
          setCriticalConditions(prev => prev.filter(c => c.patientId !== patient_id));
        }
      }
    } catch (error) {
      console.error('Error fetching critical conditions:', error);
    }
  };

  const fetchPatientMedicalHistory = async (patient_id: string) => {
    setLoadingMedicalHistory(true);
    try {
      const response = await apiClient.get(
        `/medical-history/${patient_id}`
      );
      if (response.status == 500) {
        throw new Error("Internal Server Error");
      }
      setMedicalHistory(response.data);

      // Update critical conditions when medical history is fetched
      fetchPatientCriticalConditions(patient_id);
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
      const response = await apiClient.get(
        `/medical-reports/forpatient/${patient_id}`
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
      const response = await apiClient.get(
        `/soap-notes/forpatient/${patient_id}`
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
      await apiClient.delete(`/soap-notes/${noteId}`);
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
      await apiClient.delete(`/medical-reports/${reportId}`);
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
        await apiClient.put(`/soap-notes/${editingNote.note_id}`, {
          dentist_id: user?.id,
          patient_id: selectedPatient.patient_id,
          note: newNoteText.trim(),
        });
        toast.success('Note updated successfully');
      } else {
        // Create new note
        await apiClient.post(`/soap-notes`, {
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

      const responseurl = await apiClient.post(
        `/files`,
        formData,
        {
          withCredentials: true,
        }
      );

      if (responseurl.status != 201) {
        throw new Error("Error Uploading File");
      }

      const response = await apiClient.post(
        `/medical-reports`,
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
    fetchPatientMedicalHistory(patient.patient_id);
    fetchPatientMedicalReports(patient.patient_id);
    fetchPatientSOAPNotes(patient.patient_id);
    fetchConsentForms(patient.patient_id);
  };

  const closeMobileOverlay = () => {
    setIsMobileOverlayOpen(false)
  }

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientMedicalHistory(selectedPatient.patient_id);
      fetchPatientMedicalReports(selectedPatient.patient_id);
      fetchPatientSOAPNotes(selectedPatient.patient_id);
      fetchConsentForms(selectedPatient.patient_id);
    } else {
      setMedicalHistory([]);
      setMedicalReport([]);
      setSoapNote([]);
      setConsentForms([]);
    }
  }, [selectedPatient, fetchConsentForms]);

  useEffect(() => {
    if (!user) return;
    fetchPatients();
  }, [user]);

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

  const PatientDetailsContent = () => (
    <div className="space-y-6 p-6">
      <Tabs defaultValue="details" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="medical-history">Medical History</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="soap-notes">SOAP Notes</TabsTrigger>
          <TabsTrigger value="consent-forms">Consent Forms</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Critical conditions alert */}
              {selectedPatient && getPatientCriticalConditions(selectedPatient.patient_id).length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-red-800 text-lg">Critical Medical Conditions</h3>
                      <p className="text-red-700 mt-1 mb-3">This patient has medical conditions that require special attention:</p>
                      <div className="flex flex-wrap gap-2">
                        {getPatientCriticalConditions(selectedPatient.patient_id).map((condition, idx) => (
                          <Badge key={idx} variant="outline" className="bg-white text-red-700 border-red-300 py-1.5 px-3">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

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

        <TabsContent value="medical-history" className="mt-0 h-full">
          <div className="h-full">
            {loadingMedicalHistory ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <MedicalHistoryForm
                patientId={selectedPatient?.patient_id}
                onSave={() => {
                  // Refetch medical history after saving to update critical conditions
                  if (selectedPatient) {
                    fetchPatientMedicalHistory(selectedPatient.patient_id);
                  }
                }}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Medical Reports
            </h3>
            <Button
              className='bg-emerald-500 hover:bg-emerald-600 mb-2'
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

        <TabsContent value="soap-notes">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">SOAP Notes</h3>
            <Button
              className='bg-emerald-500 hover:bg-emerald-600 mb-2'
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

        <TabsContent value="consent-forms" className="mt-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Consent Forms</h2>
              <Button
                onClick={openCreateForm}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                New Consent Form
              </Button>
            </div>

            <ConsentFormsList
              consentForms={consentForms}
              onSign={handleSignClick}
              onView={handleViewForm}
              onDelete={handleDeleteForm}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )

  const OverlayPatientDetailsContent = () => (
    <div className="h-full flex flex-col">
      {/* Patient Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative h-16 w-16 rounded-full overflow-hidden bg-blue-100 flex-shrink-0">
            {selectedPatient?.profile_picture ? (
              <img
                src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${selectedPatient.profile_picture}`}
                alt={selectedPatient.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) {
                    fallback.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div className="absolute inset-0 flex items-center justify-center bg-blue-100 text-blue-700 font-medium text-xl">
              {selectedPatient?.name
                ? selectedPatient.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                : '?'}
            </div>
          </div>
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

            {/* Display critical conditions */}
            {selectedPatient && getPatientCriticalConditions(selectedPatient.patient_id).length > 0 && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800">Critical Medical Conditions</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {getPatientCriticalConditions(selectedPatient.patient_id).map((condition, idx) => (
                        <Badge key={idx} variant="outline" className="bg-white text-red-700 border-red-300">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stacked Content Sections */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Patient Information */}
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

        {/* Medical History */}
        <Card className="flex-grow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Medical History
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <Tabs defaultValue="view" className="h-full">
              <TabsList className="mb-4">
                <TabsTrigger value="view">View History</TabsTrigger>
                <TabsTrigger value="edit">Edit History</TabsTrigger>
              </TabsList>
              <TabsContent value="view" className="h-[calc(100%-3rem)]">
                <div className="space-y-4 h-full overflow-y-auto">
                  {selectedPatient && medicalHistory.map((history, index) => (
                    <div key={`${history.patient_id}-${history.medical_question_id}`}
                      className={`border-l-4 pl-4 py-2 ${history.medical_question_answer?.toLowerCase() === 'yes' &&
                        history.question?.question.toLowerCase().includes('disease')
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-blue-500'
                        }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{history.question?.question}</p>
                          <p className={`mt-1 ${history.medical_question_answer?.toLowerCase() === 'yes' &&
                            history.question?.question.toLowerCase().includes('disease')
                            ? 'text-orange-700 font-medium'
                            : 'text-gray-600'
                            }`}>
                            {history.medical_question_answer}
                          </p>
                        </div>
                        {history.medical_question_answer?.toLowerCase() === 'yes' &&
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
              </TabsContent>
              <TabsContent value="edit" className="h-[calc(100%-3rem)]">
                {selectedPatient && (
                  <div className="h-full">
                    <MedicalHistoryForm
                      patientId={selectedPatient.patient_id}
                      onSave={() => {
                        fetchPatientMedicalHistory(selectedPatient.patient_id);
                      }}
                      fullHeight={true}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Medical Reports */}
        <div>
          <div className="flex justify-between items-center mb-4">
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
        </div>

        {/* SOAP Notes */}
        <div>
          <div className="flex justify-between items-center mb-4">
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
        </div>

        {/* Consent Template 
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Consent Template
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
                <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No consent template available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>*/}

        {/* Medical Reports 
      <div>
        <div className="flex justify-between items-center mb-4">
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
      </div>*/}

        {/* Consent Forms Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Consent Forms
            </CardTitle>
            <Button
              className='bg-emerald-500 hover:bg-emerald-600'
              size="sm"
              onClick={openCreateForm}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Consent Form
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedPatient && consentForms.length > 0 ? (
                <ConsentFormsList
                  consentForms={consentForms}
                  onSign={handleSignClick}
                  onView={handleViewForm}
                  onDelete={handleDeleteForm}
                />
              ) : (
                <div className="text-center py-6">
                  <FileSignature className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No consent forms available</p>
                  <Button
                    className='bg-emerald-500 hover:bg-emerald-600'
                    size="sm"
                    onClick={openCreateForm}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Consent Form
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Full Screen Details Overlay
  const renderDetailsOverlay = () => (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Overlay Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <h2 className="text-xl font-semibold">Patient Details</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDetailsOverlayOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Overlay Content */}
      <div className="flex-1 overflow-auto p-6">
        <OverlayPatientDetailsContent />
      </div>
    </div>
  );

  // Memoize the ConsentFormDialog component
  const ConsentFormDialog = useMemo(() => {
    if (!view) return null;

    return (
      <Dialog open={true} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-[85%] sm:w-[1100px] overflow-y-auto max-h-[85vh]">
          {view === 'create' ? (
            <>
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-2xl font-semibold text-gray-900">New Consent Form</DialogTitle>
                <p className="text-sm text-gray-500">Please fill in the details below to create a new consent form.</p>
              </DialogHeader>

              <ConsentFormContent
                selectedPatient={selectedPatient}
                user={user}
                onSubmit={handleConsentFormSubmit}
                onClose={closeDialog}
                submitting={submittingConsentForm}
              />
            </>
          ) : (
            <>
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-2xl font-semibold text-gray-900">Consent Forms</DialogTitle>
                <p className="text-sm text-gray-500">List of consent forms for {selectedPatient?.name}</p>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Consent Forms</h2>
                  <Button
                    onClick={openCreateForm}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    New Consent Form
                  </Button>
                </div>

                <ConsentFormsList
                  consentForms={consentForms}
                  onSign={handleSignClick}
                  onView={handleViewForm}
                  onDelete={handleDeleteForm}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  }, [view, selectedPatient, user, handleConsentFormSubmit, submittingConsentForm, closeDialog, consentForms, handleSignClick, openCreateForm, handleViewForm, handleDeleteForm]);

  // Add helper function to get critical conditions for a patient
  const getPatientCriticalConditions = (patientId: string): string[] => {
    const patientCondition = criticalConditions.find(c => c.patientId === patientId);
    return patientCondition?.conditions || [];
  };

  return (
    <div className="h-screen bg-gray-100">
      {isDetailsOverlayOpen && selectedPatient && renderDetailsOverlay()}
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
                className="pl-10 pr-8"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1">
            <div className="p-2">
              {filteredPatients.map((patient) => (
                <Card
                  key={patient.patient_id}
                  className={`mb-2 cursor-pointer transition-colors hover:bg-gray-50 ${selectedPatient?.patient_id === patient.patient_id ? 'ring-2 ring-emerald-500' : ''}`}
                  onClick={() => handlePatientSelect(patient)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 rounded-full overflow-hidden bg-blue-100 flex-shrink-0">
                        {patient.profile_picture ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${patient.profile_picture}`}
                            alt={patient.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) {
                                fallback.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-100 text-blue-700 font-medium text-sm">
                          {patient.name
                            ? patient.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                            : '?'}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{patient.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{patient.email}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {patient.blood_group && (
                            <Badge variant="secondary" className="text-xs">
                              {patient.blood_group}
                            </Badge>
                          )}
                          {/* Display critical conditions warning */}
                          {getPatientCriticalConditions(patient.patient_id).length > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Critical Condition
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="bg-white p-3 shadow-lg border border-gray-200 rounded-lg max-w-xs">
                                  <div className="space-y-2">
                                    <p className="font-medium text-red-700">Critical Medical Conditions:</p>
                                    <ul className="list-disc pl-4 text-sm text-gray-700">
                                      {getPatientCriticalConditions(patient.patient_id).map((condition, idx) => (
                                        <li key={idx}>{condition}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {/* Only show history badge if this patient is selected and has history */}
                          {selectedPatient?.patient_id === patient.patient_id && medicalHistory.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Activity className="h-3 w-3 mr-1" />
                              History
                            </Badge>
                          )}
                          {/* Only show reports badge if this patient is selected and has reports */}
                          {selectedPatient?.patient_id === patient.patient_id && medicalReport.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              Reports
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        {/* An overlay will appear */}
                        <Button
                          variant="ghost"
                          className='h-10 w-10 cursor-pointer'
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedPatient?.patient_id !== patient.patient_id) {
                              handlePatientSelect(patient);
                            }
                            setIsDetailsOverlayOpen(true);
                          }}
                        >
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        </Button>
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

      <Dialog open={isAddNoteDialogOpen} onOpenChange={setIsAddNoteDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAddNote}>
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
                <Label htmlFor="note-text">
                  Note {editingNote && <span className="text-xs text-gray-500 ml-1">(editing)</span>}
                </Label>
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
                  type="button"
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
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Report Dialog */}
      <Dialog open={isUploadReportDialogOpen} onOpenChange={setIsUploadReportDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUploadReport}>
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
                  type="button"
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
          </form>
        </DialogContent>
      </Dialog>


      {/* Consent Form Dialog */}
      {ConsentFormDialog}

      {/* Sign Consent Dialog */}
      <SignConsentDialog
        isOpen={isSignDialogOpen}
        onClose={() => {
          setIsSignDialogOpen(false);
          setSelectedFormId(null);
        }}
        onSign={handleSignForm}
        submitting={signingForm}
      />

      {/* View Consent Form Dialog */}
      <ViewConsentFormDialog
        isOpen={isViewFormOpen}
        onClose={() => {
          setIsViewFormOpen(false);
          setSelectedForm(null);
        }}
        form={selectedForm}
      />
    </div>
  )
}