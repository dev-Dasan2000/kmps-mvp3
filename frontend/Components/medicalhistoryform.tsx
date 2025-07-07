"use client"
import React, { useState, useEffect } from 'react';
import { Save, AlertTriangle, Plus, X, User, Phone, Mail, Calendar, Info } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface MedicalHistoryFormProps {
  patientId?: string;
  onSave?: () => void;
  fullHeight?: boolean;
}

interface MedicalQuestion {
  medical_question_id: number;
  question: string;
}

interface MedicalHistory {
  patient_id: string;
  medical_question_id: number;
  medical_question_answer: string | null;
  question: MedicalQuestion;
}

interface FormData {
  // Medical conditions - maps to medical_history.medical_question_answer
  hasHeartDisease: boolean;        // "Yes"/"No"
  hasDiabetes: boolean;           // "Yes"/"No"
  hasHypertension: boolean;       // "Yes"/"No"
  hasAsthma: boolean;            // "Yes"/"No"
  hasKidneyDisease: boolean;     // "Yes"/"No"
  hasLiverDisease: boolean;      // "Yes"/"No"
  hasBloodDisorder: boolean;     // "Yes"/"No"
  isPregnant: boolean;           // "Yes"/"No"
  // Lifestyle
  smokingStatus: string;         // Free text
  alcoholConsumption: string;    // Free text
  // Dental history
  lastDentalVisit: string;      // Free text
  dentalConcerns: string;       // Free text
  // Additional info
  medicationAllergies: string;  // Free text
  familyHistory: string;        // Free text
  additionalNotes: string;      // Free text
}

const MedicalHistoryForm: React.FC<MedicalHistoryFormProps> = ({ patientId, onSave, fullHeight }) => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<MedicalQuestion[]>([]);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([]);
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [formData, setFormData] = useState<FormData>({
    // Medical conditions
    hasHeartDisease: false,
    hasDiabetes: false,
    hasHypertension: false,
    hasAsthma: false,
    hasKidneyDisease: false,
    hasLiverDisease: false,
    hasBloodDisorder: false,
    isPregnant: false,
    // Lifestyle
    smokingStatus: '',
    alcoholConsumption: '',
    // Dental history
    lastDentalVisit: '',
    dentalConcerns: '',
    // Additional info
    medicationAllergies: '',
    familyHistory: '',
    additionalNotes: ''
  });

  const criticalConditions = [
    'Heart Disease', 'Diabetes', 'Kidney Disease', 
    'Liver Disease', 'Blood Disorders', 'Severe Hypertension'
  ];

  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    if (patientId) {
      fetchMedicalHistory();
    }
  }, [patientId]);

  // Question mapping - maps frontend fields to backend questions
  const questionFieldMap: Record<string, keyof FormData> = {
    'Do you have any heart disease?': 'hasHeartDisease',
    'Do you have diabetes?': 'hasDiabetes',
    'Do you have hypertension?': 'hasHypertension',
    'Do you have asthma?': 'hasAsthma',
    'Do you have any kidney disease?': 'hasKidneyDisease',
    'Do you have any liver disease?': 'hasLiverDisease',
    'Do you have any blood disorders?': 'hasBloodDisorder',
    'Are you pregnant?': 'isPregnant',
    'What is your smoking status?': 'smokingStatus',
    'What is your alcohol consumption?': 'alcoholConsumption',
    'When was your last dental visit?': 'lastDentalVisit',
    'Do you have any dental concerns?': 'dentalConcerns',
    'Do you have any medication allergies?': 'medicationAllergies',
    'Family medical history': 'familyHistory',
    'Additional notes': 'additionalNotes'
  };

  const fetchMedicalHistory = async () => {
    if (!patientId) {
      console.error('No patient ID provided');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Fetching medical questions...');
      const questionsResponse = await axios.get<MedicalQuestion[]>(`${backendURL}/medical-questions`);
      const questions = questionsResponse.data;
      console.log('Fetched questions:', questions);
      setQuestions(questions);

      console.log('Fetching medical history...');
      const historyResponse = await axios.get<MedicalHistory[]>(`${backendURL}/medical-history/${patientId}`);
      const history = historyResponse.data;
      console.log('Fetched history:', history);
      setMedicalHistory(history);

      // Create a map of question ID to answer
      const answerMap = history.reduce<Record<number, string>>((acc, item) => {
        acc[item.medical_question_id] = item.medical_question_answer || '';
        return acc;
      }, {});
      console.log('Answer map:', answerMap);

      // Map answers to form fields
      const mappedData = { ...formData };
      questions.forEach((q) => {
        const answer = answerMap[q.medical_question_id] || '';
        const formField = questionFieldMap[q.question];
        console.log(`Mapping question "${q.question}" to field "${formField}" with answer "${answer}"`);
        
        if (formField) {
          if (typeof formData[formField] === 'boolean') {
            (mappedData[formField] as boolean) = answer === 'Yes';
          } else {
            (mappedData[formField] as string) = answer;
          }
        }
      });

      console.log('Final form data:', mappedData);
      setFormData(mappedData);
    } catch (error: any) {
      console.error('Error fetching medical history:', error);
      toast.error('Failed to fetch medical history', {
        description: error.response?.data?.error || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (key: keyof FormData, value: any) => {
    console.log(`Form field "${key}" changed to:`, value);
    setFormData(prev => ({...prev, [key]: value}));
    setUnsavedChanges(true);
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsavedChanges]);

  const handleSave = async () => {
    if (!patientId) {
      console.error('No patient ID provided');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Starting save operation...');
      console.log('Current questions:', questions);
      console.log('Current form data:', formData);

      // Create/Update medical history records
      const updatePromises = questions.map(async (question) => {
        const formField = questionFieldMap[question.question];
        if (!formField) {
          console.log(`No form field mapping found for question: ${question.question}`);
          return null;
        }

        const answer = typeof formData[formField] === 'boolean' 
          ? (formData[formField] ? 'Yes' : 'No')
          : formData[formField].toString();

        console.log(`Saving answer for question "${question.question}":`, answer);

        try {
          // Try to update first
          console.log(`Attempting to update answer for question ${question.medical_question_id}...`);
          await axios.put(`${backendURL}/medical-history/${patientId}/${question.medical_question_id}`, {
            medical_question_answer: answer
          });
          console.log('Update successful');
        } catch (error: any) {
          // If update fails (record doesn't exist), create new record
          console.log(`Update failed, creating new record:`, error.response?.data);
          await axios.post(`${backendURL}/medical-history`, {
            patient_id: patientId,
            medical_question_id: question.medical_question_id,
            medical_question_answer: answer
          });
          console.log('Create successful');
        }
      });

      await Promise.all(updatePromises.filter((p): p is Promise<any> => p !== null));
      console.log('All updates completed successfully');

      setUnsavedChanges(false);
      toast.success('Medical history updated successfully');
      if (onSave) {
        onSave();
      }
    } catch (error: any) {
      console.error('Error saving medical history:', error);
      toast.error('Failed to update medical history', {
        description: error.response?.data?.error || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const hasCriticalConditions = () => {
    return formData.hasHeartDisease || formData.hasDiabetes || formData.hasKidneyDisease || 
           formData.hasLiverDisease || formData.hasBloodDisorder || 
           (formData.hasHypertension && formData.medicationAllergies.toLowerCase().includes('severe'));
  };

  return (
    <div className={`flex flex-col ${fullHeight ? 'h-full' : 'h-[calc(100vh-16rem)]'}`}>
      {/* Form Content */}
      <div className={`flex-1 ${fullHeight ? 'overflow-y-visible' : 'overflow-y-auto pr-2'}`}>
        <div className="space-y-6">
          {/* Critical Conditions Alert */}
          {hasCriticalConditions() && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                <p className="text-red-800 font-medium">
                  This patient has critical medical conditions that require special attention during treatment.
                </p>
              </div>
            </div>
          )}

          {/* Medical Conditions Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Medical Conditions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.hasHeartDisease}
                      onChange={(e) => handleFormChange('hasHeartDisease', e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Heart Disease</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.hasDiabetes}
                      onChange={(e) => handleFormChange('hasDiabetes', e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Diabetes</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.hasHypertension}
                      onChange={(e) => handleFormChange('hasHypertension', e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Hypertension</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.hasAsthma}
                      onChange={(e) => handleFormChange('hasAsthma', e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Asthma</span>
                  </label>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.hasKidneyDisease}
                      onChange={(e) => handleFormChange('hasKidneyDisease', e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Kidney Disease</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.hasLiverDisease}
                      onChange={(e) => handleFormChange('hasLiverDisease', e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Liver Disease</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.hasBloodDisorder}
                      onChange={(e) => handleFormChange('hasBloodDisorder', e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Blood Disorder</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isPregnant}
                      onChange={(e) => handleFormChange('isPregnant', e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Pregnancy</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Lifestyle Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Lifestyle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Smoking Status</label>
                <input
                  type="text"
                  value={formData.smokingStatus}
                  onChange={(e) => handleFormChange('smokingStatus', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Alcohol Consumption</label>
                <input
                  type="text"
                  value={formData.alcoholConsumption}
                  onChange={(e) => handleFormChange('alcoholConsumption', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Dental History Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Dental History</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Dental Visit</label>
                <input
                  type="text"
                  value={formData.lastDentalVisit}
                  onChange={(e) => handleFormChange('lastDentalVisit', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dental Concerns</label>
                <textarea
                  value={formData.dentalConcerns}
                  onChange={(e) => handleFormChange('dentalConcerns', e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Medication Allergies</label>
                <textarea
                  value={formData.medicationAllergies}
                  onChange={(e) => handleFormChange('medicationAllergies', e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Family Medical History</label>
                <textarea
                  value={formData.familyHistory}
                  onChange={(e) => handleFormChange('familyHistory', e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => handleFormChange('additionalNotes', e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 mr-2 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MedicalHistoryForm;