'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, User, Mail, Phone, Upload, X, Camera, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

// Types
interface SecurityQuestion {
  security_question_id: number;
  question: string;
}

interface SecurityQuestionAnswer {
  questionId: string;
  answer: string;
}

interface ReceptionistFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  profilePicture: File | null;
  securityQuestions: SecurityQuestionAnswer[];
}

const ReceptionistSignUp: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string>('');

  const [formData, setFormData] = useState<ReceptionistFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    profilePicture: null,
    securityQuestions: [
      { questionId: '', answer: '' },
      { questionId: '', answer: '' },
      { questionId: '', answer: '' }
    ]
  });

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Fetch security questions on component mount
  useEffect(() => {
    const fetchSecurityQuestions = async () => {
      try {
        const response = await fetch(`${backendURL}/security-questions`);
        if (!response.ok) throw new Error('Failed to fetch security questions');
        const data = await response.json();
        setSecurityQuestions(data);
      } catch (err) {
        console.error('Error fetching security questions:', err);
        setError('Failed to load security questions. Please refresh the page to try again.');
      }
    };

    fetchSecurityQuestions();
  }, []);

  const handleInputChange = (field: keyof ReceptionistFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSecurityQuestionChange = (index: number, field: keyof SecurityQuestionAnswer, value: string) => {
    setFormData(prev => ({
      ...prev,
      securityQuestions: prev.securityQuestions.map((sq, i) => 
        i === index ? { ...sq, [field]: value } : sq
      )
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setUploadError('');
    
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setUploadError('Please upload a valid image file (JPEG, PNG, or GIF)');
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        setUploadError('File size must be less than 5MB');
        return;
      }
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        profilePicture: file
      }));
    }
  };

  const removeProfilePicture = () => {
    setFormData(prev => ({
      ...prev,
      profilePicture: null
    }));
    setProfileImagePreview(null);
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const validateStep1 = (): boolean => {
    const stringFields: (keyof ReceptionistFormData)[] = ['name', 'email', 'password', 'confirmPassword', 'phoneNumber'];
    return stringFields.every(field => {
      const value = formData[field];
      return typeof value === 'string' && value.trim() !== '';
    }) && 
    formData.password === formData.confirmPassword &&
    formData.password.length >= 8;
  };

  const validateStep2 = (): boolean => {
    return formData.securityQuestions.every(sq => sq.questionId && sq.answer.trim() !== '');
  };

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [generatedId, setGeneratedId] = useState('');

  const handleSubmit = async () => {
    if (!validateStep2()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 1. Create the receptionist
      const receptionistData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phoneNumber,
      };

      // Create receptionist
      const receptionistResponse = await fetch(`${backendURL}/receptionists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receptionistData),
      });

      if (!receptionistResponse.ok) {
        const errorData = await receptionistResponse.json();
        throw new Error(errorData.error || 'Failed to create receptionist account');
      }

      const receptionist = await receptionistResponse.json();
      
      // Store the generated ID for display
      setGeneratedId(receptionist.receptionist_id);

      // 2. Save security questions answers
      const securityPromises = formData.securityQuestions.map(async (sq) => {
        if (!sq.questionId || !sq.answer) return null;
        
        return fetch(`${backendURL}/receptionist-security-questions-answers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            receptionist_id: receptionist.receptionist_id,
            security_question_id: parseInt(sq.questionId),
            answer: sq.answer,
          }),
        });
      });

      await Promise.all(securityPromises);
      
      // Mark registration as successful
      setRegistrationSuccess(true);
      
      // Clear form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        profilePicture: null,
        securityQuestions: Array(3).fill({ questionId: '', answer: '' })
      });
      setProfileImagePreview(null);
      
    } catch (error) {
      console.error('Registration failed:', error);
      setError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableQuestions = (currentIndex: number): SecurityQuestion[] => {
    const selectedIds = formData.securityQuestions
      .map((sq, index) => index !== currentIndex ? sq.questionId : null)
      .filter((id): id is string => id !== null && id !== '');
    
    return securityQuestions.filter(q => !selectedIds.includes(q.security_question_id.toString()));
  };

  const progressValue = (currentStep / 2) * 100;

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-6 max-w-md w-full bg-white rounded-lg shadow-md text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-3 text-xl font-semibold text-gray-900">Registration Successful!</h2>
          <p className="mt-2 text-gray-600">
            Your receptionist ID is: <span className="font-bold">{generatedId}</span>
          </p>
          <p className="mt-2 text-gray-600">
            An email has been sent to {formData.email} with your login details.
            Please check your inbox and keep your ID safe.
          </p>
          <div className="mt-6">
            <Button 
              onClick={() => router.push('/')}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-6 max-w-md w-full bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <Button onClick={() => setError('')} className="w-full">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep} of 2
            </span>
            <span className="text-sm font-medium text-gray-600">
              {currentStep === 1 ? 'Basic Information' : 'Security Questions'}
            </span>
          </div>
          <Progress value={progressValue} className="h-2 bg-emerald-200" />
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-6 md:p-8">
            {currentStep === 1 ? (
              // Step 1: Basic Information
              <div>
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-3xl font-bold text-center text-emerald-900">Create Receptionist Account</CardTitle>
                  <CardDescription className="text-center mb-8">
                    Enter your information to join as a receptionist
                  </CardDescription>
                </CardHeader>

                <div className="space-y-6">
                  

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Full Name <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Jane Smith"
                      className="focus-visible:ring-emerald-200"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Email Address <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="jane.smith@email.com"
                      className="focus-visible:ring-emerald-200"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      Phone Number <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="focus-visible:ring-emerald-200"
                    />
                  </div>

                  {/* Password */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password <span className="text-red-500 font-bold">*</span></Label>
                      <div className="relative">
                        <Input
                          id="password"
                          required
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="••••••••"
                          className="focus-visible:ring-emerald-200 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">Minimum 8 characters</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500 font-bold">*</span></Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          placeholder="••••••••"
                          className="focus-visible:ring-emerald-200 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Validation Alerts */}
                  {formData.password && formData.password.length < 8 && (
                    <Alert variant="destructive">
                      <AlertDescription>Password must be at least 8 characters long</AlertDescription>
                    </Alert>
                  )}

                  {formData.password !== formData.confirmPassword && formData.confirmPassword && (
                    <Alert variant="destructive">
                      <AlertDescription>Passwords do not match</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleNext}
                    disabled={!validateStep1()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    size="lg"
                  >
                    Continue to Security Questions
                  </Button>
                </div>
              </div>
            ) : (
              // Step 2: Security Questions
              <div>
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-3xl font-bold text-center text-emerald-900">Security Questions</CardTitle>
                  <CardDescription className="text-center">
                    Please select and answer three security questions. These will help protect your account.
                  </CardDescription>
                </CardHeader>

                <div className="space-y-6">
                  {formData.securityQuestions.map((securityQuestion, index) => (
                    <Card key={index} className="bg-emerald-50 border-emerald-100">
                      <CardHeader>
                        <CardTitle className="text-lg text-emerald-900">Question {index + 1}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Select a security question</Label>
                          <select
                            value={securityQuestion.questionId}
                            onChange={(e) => handleSecurityQuestionChange(index, 'questionId', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="">Select a security question</option>
                            {getAvailableQuestions(index).map(q => (
                              <option key={q.security_question_id} value={q.security_question_id.toString()}>{q.question}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>Your Answer</Label>
                          <Input
                            type="text"
                            value={securityQuestion.answer}
                            onChange={(e) => handleSecurityQuestionChange(index, 'answer', e.target.value)}
                            placeholder="Enter your answer"
                            disabled={!securityQuestion.questionId}
                            className="focus-visible:ring-emerald-200"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="w-full sm:w-auto"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    
                    <Button
                      onClick={handleSubmit}
                      disabled={!validateStep2()}
                      className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700"
                      size="lg"
                    >
                      Complete Registration
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReceptionistSignUp;