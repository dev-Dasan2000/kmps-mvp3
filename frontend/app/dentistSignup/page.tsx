'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ArrowLeft, User, Mail, Phone, Clock, DollarSign, Calendar, Globe, Upload, X, Camera, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';


// Types
interface SecurityQuestion {
  security_question_id: number;
  id: number; // For backward compatibility with existing code
  question: string;
}

interface SecurityQuestionAnswer {
  questionId: string;
  answer: string;
}

interface DentistFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  language: string;
  serviceTypes: string;
  workDaysFrom: string;
  workDaysTo: string;
  workTimeFrom: string;
  workTimeTo: string;
  appointmentDuration: string;
  appointmentFee: string;
  profilePicture: File | null;
  securityQuestions: SecurityQuestionAnswer[];
}

const DentistSignUp: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const router = useRouter();
  
  const [formData, setFormData] = useState<DentistFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    language: '',
    serviceTypes: '',
    workDaysFrom: '',
    workDaysTo: '',
    workTimeFrom: '',
    workTimeTo: '',
    appointmentDuration: '',
    appointmentFee: '',
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
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [generatedId, setGeneratedId] = useState('');

  useEffect(() => {
    const fetchSecurityQuestions = async () => {
      try {
        const response = await fetch(`${backendURL}/security-questions`);
        if (!response.ok) {
          throw new Error('Failed to fetch security questions');
        }
        const data: SecurityQuestion[] = await response.json();
        // Map the data to include both id and security_question_id for backward compatibility
        const questions = data.map(q => ({
          ...q,
          id: q.security_question_id // Add id for backward compatibility
        }));
        setSecurityQuestions(questions);
      } catch (err) {
        console.error('Error fetching security questions:', err);
        setError('Failed to load security questions. Please try again later.');
      }
    };

    fetchSecurityQuestions();
  }, []);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleInputChange = (field: keyof DentistFormData, value: string) => {
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
    const required: (keyof DentistFormData)[] = ['name', 'email', 'password', 'confirmPassword'];
    const hasRequiredFields = required.every(field => formData[field].trim() !== '');
    const passwordsMatch = formData.password === formData.confirmPassword;
    const passwordLengthValid = formData.password.length >= 8;
    
    return hasRequiredFields && passwordsMatch && passwordLengthValid;
  };

  const validateStep2 = (): boolean => {
    return formData.securityQuestions.every(sq => sq.questionId && sq.answer.trim() !== '');
  };

  const getPasswordErrors = (): string[] => {
    const errors: string[] = [];
    if (formData.password && formData.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (formData.password !== formData.confirmPassword && formData.confirmPassword) {
      errors.push('Passwords do not match');
    }
    return errors;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // First, create the dentist
      const { securityQuestions: securityAnswers, profilePicture, ...dentistData } = formData;
      
      // Prepare dentist data in the exact format expected by the backend
      const dentistPayload = {
        email: dentistData.email.trim().toLowerCase(),
        password: dentistData.password,
        name: dentistData.name.trim(),
        phone_number: dentistData.phoneNumber,
        language: dentistData.language || '',
        service_types: dentistData.serviceTypes || 'general',
        work_days_from: dentistData.workDaysFrom || 'Monday',
        work_days_to: dentistData.workDaysTo || 'Friday',
        work_time_from: dentistData.workTimeFrom || '08:00',
        work_time_to: dentistData.workTimeTo || '17:00',
        appointment_duration: dentistData.appointmentDuration || '30',
        appointment_fee: dentistData.appointmentFee ? parseFloat(dentistData.appointmentFee) : 0,
      };

      // Create dentist
      const receptionistResponse = await fetch(`${backendURL}/dentists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dentistPayload),
      });

      if (!receptionistResponse.ok) {
        const errorData = await receptionistResponse.json();
        throw new Error(errorData.error || 'Failed to create dentist account');
      }

      const dentist = await receptionistResponse.json();
      const dentistId = dentist.dentist_id;
      
      // Store the generated ID for display
      setGeneratedId(dentistId);

      // Upload profile picture if exists
      if (profilePicture) {
        const formData = new FormData();
        formData.append('image', profilePicture);
        
        const uploadResponse = await fetch(`${backendURL}/photos`, {
          method: 'POST',
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json();
          // Update dentist with profile picture URL
          await fetch(`${backendURL}/dentists/${dentistId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              profile_picture: url,
            }),
          });
        }
      }

      // Save security questions answers
      const securityQuestionPromises = securityAnswers.map(async (sq) => {
        if (!sq.questionId || !sq.answer.trim()) return null;
        
        return fetch(`${backendURL}/dentist-security-questions-answers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dentist_id: dentistId,
            security_question_id: parseInt(sq.questionId),
            answer: sq.answer.trim(),
          }),
        });
      });

      await Promise.all(securityQuestionPromises);
      
      // Mark registration as successful
      setRegistrationSuccess(true);
      
      // Clear form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        language: '',
        serviceTypes: 'general',
        workDaysFrom: 'Monday',
        workDaysTo: 'Friday',
        workTimeFrom: '08:00',
        workTimeTo: '17:00',
        appointmentDuration: '30',
        appointmentFee: '',
        profilePicture: null,
        securityQuestions: Array(3).fill({ questionId: '', answer: '' })
      });
      setProfileImagePreview(null);
      
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
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
  const passwordErrors = getPasswordErrors();

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
            Your dentist ID is: <span className="font-bold">{generatedId}</span>
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
                  <CardTitle className="text-3xl font-bold text-center">Create Your Account</CardTitle>
                  <CardDescription className="text-center mb-8">
                    Enter your professional information to get started
                  </CardDescription>
                </CardHeader>

                <div className="space-y-6">
                  {/* Profile Picture Upload */}
                  <div className="space-y-4">
                    <Label className="flex items-center">
                      <Camera className="w-4 h-4 mr-2" />
                      Profile Picture
                    </Label>
                    <div className="flex flex-col items-center space-y-4">
                      {/* Image Preview */}
                      <div className="relative">
                        {profileImagePreview ? (
                          <div className="relative">
                            <img
                              src={profileImagePreview}
                              alt="Profile preview"
                              className="w-32 h-32 rounded-full object-cover border-4 border-emerald-200 shadow-lg"
                            />
                            <button
                              type="button"
                              onClick={removeProfilePicture}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-32 h-32 rounded-full border-4 border-dashed border-emerald-300 flex items-center justify-center bg-emerald-50">
                            <Camera className="w-8 h-8 text-emerald-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* Upload Button */}
                      <div className="text-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={triggerFileUpload}
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {profileImagePreview ? 'Change Picture' : 'Upload Picture'}
                        </Button>
                        <p className="text-sm text-gray-500 mt-2">
                          JPG, PNG or GIF. Max size 5MB.
                        </p>
                      </div>
                      
                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      
                      {/* Upload Error */}
                      {uploadError && (
                        <Alert variant="destructive" className="max-w-md">
                          <AlertDescription>{uploadError}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Full Name <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Dr. John Smith"
                      className="focus-visible:ring-emerald-200"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Email Address <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="john.smith@email.com"
                      className="focus-visible:ring-emerald-200"
                    />
                  </div>

                  {/* Password */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Input
                          id="password"
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
                      <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
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

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="focus-visible:ring-emerald-200"
                    />
                  </div>

                  {/* Language & Service Types */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="language" className="flex items-center">
                        <Globe className="w-4 h-4 mr-2" />
                        Language
                      </Label>
                      <Input
                        id="language"
                        type="text"
                        value={formData.language}
                        onChange={(e) => handleInputChange('language', e.target.value)}
                        placeholder="English, Spanish, French..."
                        className="focus-visible:ring-emerald-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serviceTypes">Service Types</Label>
                      <Input
                        id="serviceTypes"
                        type="text"
                        value={formData.serviceTypes}
                        onChange={(e) => handleInputChange('serviceTypes', e.target.value)}
                        placeholder="General, Orthodontics, etc."
                        className="focus-visible:ring-emerald-200"
                      />
                    </div>
                  </div>

                  {/* Work Days */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Work Days From
                      </Label>
                      <Select value={formData.workDaysFrom} onValueChange={(value) => handleInputChange('workDaysFrom', value)}>
                        <SelectTrigger className="focus:ring-emerald-200">
                          <SelectValue placeholder="Select Day" />
                        </SelectTrigger>
                        <SelectContent>
                          {daysOfWeek.map(day => (
                            <SelectItem key={day} value={day}>{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Work Days To</Label>
                      <Select value={formData.workDaysTo} onValueChange={(value) => handleInputChange('workDaysTo', value)}>
                        <SelectTrigger className="focus:ring-emerald-200">
                          <SelectValue placeholder="Select Day" />
                        </SelectTrigger>
                        <SelectContent>
                          {daysOfWeek.map(day => (
                            <SelectItem key={day} value={day}>{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Work Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="workTimeFrom" className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Work Time From
                      </Label>
                      <Input
                        id="workTimeFrom"
                        type="time"
                        value={formData.workTimeFrom}
                        onChange={(e) => handleInputChange('workTimeFrom', e.target.value)}
                        className="focus-visible:ring-emerald-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workTimeTo">Work Time To</Label>
                      <Input
                        id="workTimeTo"
                        type="time"
                        value={formData.workTimeTo}
                        onChange={(e) => handleInputChange('workTimeTo', e.target.value)}
                        className="focus-visible:ring-emerald-200"
                      />
                    </div>
                  </div>

                  {/* Appointment Duration & Fee */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Appointment Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={formData.appointmentDuration}
                        onChange={(e) => handleInputChange('appointmentDuration', e.target.value)}
                        placeholder="30"
                        className="focus-visible:ring-emerald-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fee" className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Appointment Fee
                      </Label>
                      <Input
                        id="fee"
                        type="number"
                        step="0.01"
                        value={formData.appointmentFee}
                        onChange={(e) => handleInputChange('appointmentFee', e.target.value)}
                        placeholder="100.00"
                        className="focus-visible:ring-emerald-200"
                      />
                    </div>
                  </div>

                  {passwordErrors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1">
                          {passwordErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
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
                  <CardTitle className="text-3xl font-bold text-center">Security Questions</CardTitle>
                  <CardDescription className="text-center">
                    Please select and answer three security questions. These will help protect your account.
                  </CardDescription>
                </CardHeader>

                <div className="space-y-6">
                  {formData.securityQuestions.map((securityQuestion, index) => (
                    <Card key={index} className="bg-emerald-50 border-emerald-100">
                      <CardHeader>
                        <CardTitle className="text-lg text-emerald-900">
                          Question {index + 1} <span className="text-red-500 ml-1">*</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>
                            Select a security question <span className="text-red-500 ml-1">*</span>
                          </Label>
                          <Select 
                            value={securityQuestion.questionId} 
                            onValueChange={(value) => handleSecurityQuestionChange(index, 'questionId', value)}
                          >
                            <SelectTrigger className="focus:ring-emerald-500">
                              <SelectValue placeholder="Select a security question" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableQuestions(index).map(q => (
                                <SelectItem key={q.id} value={q.id.toString()}>{q.question}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>
                            Your Answer <span className="text-red-500 ml-1">*</span>
                          </Label>
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
                      disabled={!validateStep2() || isLoading}
                      className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700"
                      size="lg"
                    >
                      {isLoading ? 'Processing...' : 'Complete Registration'}
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

export default DentistSignUp;