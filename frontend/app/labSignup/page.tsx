"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Lock,
  Stethoscope,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

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

interface LabSignupData {
  name: string;
  password: string;
  confirmPassword: string;
  contact_person: string;
  contact_number: string;
  email: string;
  address: string;
  specialties: string[];
  securityQuestions: SecurityQuestionAnswer[];
}

interface FormErrors {
  [key: string]: string;
}

const LabSignupForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<LabSignupData>({
    name: '',
    password: '',
    confirmPassword: '',
    contact_person: '',
    contact_number: '',
    email: '',
    address: '',
    specialties: [],
    securityQuestions: [
      { questionId: '', answer: '' },
      { questionId: '', answer: '' },
      { questionId: '', answer: '' }
    ]
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestion[]>([]);
  const [generatedId, setGeneratedId] = useState('');

  const router = useRouter();

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const commonSpecialties = [
    'Pathology', 'Hematology', 'Microbiology', 'Biochemistry',
    'Immunology', 'Molecular Biology', 'Cytology', 'Histopathology',
    'Clinical Chemistry', 'Serology', 'Parasitology', 'Virology'
  ];

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
        setErrors(prev => ({ ...prev, securityQuestions: 'Failed to load security questions. Please try again later.' }));
      }
    };

    fetchSecurityQuestions();
  }, [backendURL]);

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    // Lab name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Laboratory name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Laboratory name must be at least 2 characters';
    }

    // Contact person validation
    if (!formData.contact_person.trim()) {
      newErrors.contact_person = 'Contact person is required';
    } else if (formData.contact_person.trim().length < 2) {
      newErrors.contact_person = 'Contact person name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone number validation
    const phoneRegex = /^(?:\+94|0)?7\d{8}$/;
    if (!formData.contact_number.trim()) {
      newErrors.contact_number = 'Contact number is required';
    } else if (!phoneRegex.test(formData.contact_number.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.contact_number = 'Please enter a valid phone number';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.trim().length < 10) {
      newErrors.address = 'Please provide a complete address';
    }

    // Specialties validation
    if (formData.specialties.length === 0) {
      newErrors.specialties = 'Please select at least one specialty';
    }

    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    return formData.securityQuestions.every(sq => sq.questionId && sq.answer.trim() !== '');
  };

  const handleInputChange = (field: keyof LabSignupData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSecurityQuestionChange = (index: number, field: keyof SecurityQuestionAnswer, value: string) => {
    setFormData(prev => ({
      ...prev,
      securityQuestions: prev.securityQuestions.map((sq, i) =>
        i === index ? { ...sq, [field]: value } : sq
      )
    }));
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));

    if (errors.specialties) {
      setErrors(prev => ({ ...prev, specialties: '' }));
    }
  };

  const handleAddCustomSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty('');

      if (errors.specialties) {
        setErrors(prev => ({ ...prev, specialties: '' }));
      }
    }
  };

  const handleRemoveSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const handleNext = () => {
    const isValid = validateStep1();
    if (isValid) {
      setCurrentStep(2);
    } else {
      // Only set errors if validation fails
      const newErrors: FormErrors = {};

      // Lab name validation
      if (!formData.name.trim()) {
        newErrors.name = 'Laboratory name is required';
      } else if (formData.name.trim().length < 2) {
        newErrors.name = 'Laboratory name must be at least 2 characters';
      }

      // Contact person validation
      if (!formData.contact_person.trim()) {
        newErrors.contact_person = 'Contact person is required';
      } else if (formData.contact_person.trim().length < 2) {
        newErrors.contact_person = 'Contact person name must be at least 2 characters';
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim()) {
        newErrors.email = 'Email address is required';
      } else if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }

      // Phone number validation
      const phoneRegex = /^(?:\+94|0)?7\d{8}$/;
      if (!formData.contact_number.trim()) {
        newErrors.contact_number = 'Contact number is required';
      } else if (!phoneRegex.test(formData.contact_number.replace(/[\s\-\(\)]/g, ''))) {
        newErrors.contact_number = 'Please enter a valid phone number';
      }

      // Password validation
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      }

      // Confirm password validation
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      // Address validation
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
      } else if (formData.address.trim().length < 10) {
        newErrors.address = 'Please provide a complete address';
      }

      // Specialties validation
      if (formData.specialties.length === 0) {
        newErrors.specialties = 'Please select at least one specialty';
      }

      setErrors(newErrors);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const getAvailableQuestions = (currentIndex: number): SecurityQuestion[] => {
    const selectedIds = formData.securityQuestions
      .map((sq, index) => index !== currentIndex ? sq.questionId : null)
      .filter((id): id is string => id !== null && id !== '');

    return securityQuestions.filter(q => !selectedIds.includes(q.security_question_id.toString()));
  };

  const handleSubmit = async () => {
    if (!validateStep2()) {
      setErrors(prev => ({ ...prev, securityQuestions: 'Please answer all security questions' }));
      return;
    }

    setIsSubmitting(true);

    try {
      const { securityQuestions: securityAnswers, ...labData } = formData;

      const submissionData = {
        name: labData.name.trim(),
        password: labData.password,
        contact_person: labData.contact_person.trim(),
        contact_number: labData.contact_number.trim(),
        email: labData.email.trim().toLowerCase(),
        address: labData.address.trim(),
        specialties: labData.specialties.join(', ')
      };

      // Create lab account
      const response = await axios.post(`${backendURL}/labs`, {
        name: submissionData.name,
        password: submissionData.password,
        contact_person: submissionData.contact_person,
        email: submissionData.email,
        address: submissionData.address,
        specialties: submissionData.specialties
      },
        {
          headers: {
            "content-type": "application/json"
          }
        }
      );

      if (response.status !== 201) {
        throw new Error(response.data.error || 'Failed to create lab account');
      }

      const labId = response.data.lab_id;
      setGeneratedId(labId);

      // Save security questions answers
      const securityPromises = securityAnswers
        .filter(sq => sq.questionId && sq.answer.trim())
        .map(sq => {
          return axios.post(`${backendURL}/lab-security-question-answers`, {
            lab_id: labId,
            security_question_id: parseInt(sq.questionId),
            answer: sq.answer.trim()
          });
        });

      await Promise.all(securityPromises);

      setSubmitSuccess(true);

      // Clear form
      setFormData({
        name: '',
        password: '',
        confirmPassword: '',
        contact_person: '',
        contact_number: '',
        email: '',
        address: '',
        specialties: [],
        securityQuestions: [
          { questionId: '', answer: '' },
          { questionId: '', answer: '' },
          { questionId: '', answer: '' }
        ]
      });

      toast.success("Account Creation Successful");

    } catch (error) {
      console.error('Registration error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          toast.error("Registration Failed", {
            description: "This email is already registered. Please use a different email."
          });
          setErrors(prev => ({ ...prev, email: 'This email is already registered' }));
        } else {
          const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to create lab account';
          setErrors(prev => ({ ...prev, general: errorMessage }));
          toast.error("Registration Failed", {
            description: errorMessage
          });
        }
      } else if (error instanceof Error) {
        setErrors(prev => ({ ...prev, general: error.message }));
        toast.error("Registration Failed", {
          description: error.message
        });
      } else {
        setErrors(prev => ({ ...prev, general: 'An unexpected error occurred' }));
        toast.error("Registration Failed", {
          description: "An unexpected error occurred during registration"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressValue = (currentStep / 2) * 100;

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-6 max-w-md w-full bg-white rounded-lg shadow-md text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="mt-3 text-xl font-semibold text-gray-900">Registration Successful!</h2>
          <p className="mt-2 text-gray-600">
            Your lab ID is: <span className="font-bold">{generatedId}</span>
          </p>
          <p className="mt-2 text-gray-600">
            An email has been sent to {formData.email} with your login details.
            Please check your inbox and keep your ID safe.
          </p>
          <div className="mt-6">
            <Button
              onClick={() => router.push('/')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 px-4 bg-white">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-800">Join as Lab Partner</h1>
          <p className="text-center text-gray-600 mt-1">
            Create your laboratory account and start managing your operations
          </p>
        </div>

        <Card className="shadow-md border border-gray-200 rounded-lg overflow-hidden">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Laboratory Registration</h2>

            {currentStep === 1 ? (
              // Step 1: Basic Information
              <div>
                <div className="flex items-center mb-6">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  <span className="font-medium">Basic Information</span>
                </div>

                <div className="space-y-5">
                  {/* Laboratory Name and Contact Person in one row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lab-name" className="block mb-1 text-sm">
                        Laboratory Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="lab-name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter laboratory name"
                        className={`${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.name && (
                        <div className="text-red-500 text-xs mt-1">{errors.name}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="contact-person" className="block mb-1 text-sm">
                        Contact Person <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contact-person"
                        value={formData.contact_person}
                        onChange={(e) => handleInputChange('contact_person', e.target.value)}
                        placeholder="Enter contact person name"
                        className={`${errors.contact_person ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.contact_person && (
                        <div className="text-red-500 text-xs mt-1">{errors.contact_person}</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 mt-4">
                    <h3 className="text-sm font-medium">Contact Information</h3>

                    {/* Email and Phone in one row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email" className="block mb-1 text-sm flex items-center">
                          <Mail className="w-4 h-4 mr-1 text-gray-500" />
                          Email Address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="Enter email address"
                          className={`${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.email && (
                          <div className="text-red-500 text-xs mt-1">{errors.email}</div>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="contact-number" className="block mb-1 text-sm flex items-center">
                          <Phone className="w-4 h-4 mr-1 text-gray-500" />
                          Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="contact-number"
                          value={formData.contact_number}
                          onChange={(e) => handleInputChange('contact_number', e.target.value)}
                          placeholder="Enter phone number"
                          className={`${errors.contact_number ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.contact_number && (
                          <div className="text-red-500 text-xs mt-1">{errors.contact_number}</div>
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <Label htmlFor="address" className="block mb-1 text-sm flex items-center">
                        <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                        Address <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Enter complete address"
                        className={`${errors.address ? 'border-red-500' : 'border-gray-300'} min-h-[80px]`}
                      />
                      {errors.address && (
                        <div className="text-red-500 text-xs mt-1">{errors.address}</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 mt-4">
                    <h3 className="text-sm font-medium">Security</h3>

                    {/* Password and Confirm Password in one row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="password" className="block mb-1 text-sm flex items-center">
                          <Lock className="w-4 h-4 mr-1 text-gray-500" />
                          Password <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="Create a strong password"
                          className={`${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.password && (
                          <div className="text-red-500 text-xs mt-1">{errors.password}</div>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="confirm-password" className="block mb-1 text-sm flex items-center">
                          <Lock className="w-4 h-4 mr-1 text-gray-500" />
                          Confirm Password <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          placeholder="Confirm your password"
                          className={`${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.confirmPassword && (
                          <div className="text-red-500 text-xs mt-1">{errors.confirmPassword}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="space-y-3 mt-4">
                    <Label className="block text-sm flex items-center">
                      <Stethoscope className="w-4 h-4 mr-1 text-gray-500" />
                      Specialties <span className="text-red-500">*</span>
                    </Label>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {commonSpecialties.map((specialty) => (
                        <div key={specialty} className="flex items-center space-x-2">
                          <Checkbox
                            id={specialty}
                            checked={formData.specialties.includes(specialty)}
                            onCheckedChange={() => handleSpecialtyToggle(specialty)}
                            className="text-green-600 border-gray-300 rounded"
                          />
                          <Label
                            htmlFor={specialty}
                            className="text-sm cursor-pointer"
                          >
                            {specialty}
                          </Label>
                        </div>
                      ))}
                    </div>

                    {/* Custom Specialty Input */}
                    <div className="flex space-x-2 mt-2">
                      <Input
                        value={newSpecialty}
                        onChange={(e) => setNewSpecialty(e.target.value)}
                        placeholder="Add custom specialty"
                        className="flex-1 border-gray-300"
                      />
                      <Button
                        type="button"
                        onClick={handleAddCustomSpecialty}
                        disabled={!newSpecialty.trim()}
                        className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Selected Specialties */}
                    {formData.specialties.length > 0 && (
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-2">
                          {formData.specialties.map((specialty) => (
                            <Badge
                              key={specialty}
                              className="bg-green-50 text-green-700 border border-green-200 flex items-center gap-1 pl-2"
                            >
                              {specialty}
                              <button
                                type="button"
                                onClick={() => handleRemoveSpecialty(specialty)}
                                className="ml-1 rounded-full hover:bg-green-100 focus:outline-none"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {errors.specialties && (
                      <div className="text-red-500 text-xs">{errors.specialties}</div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white"
                >
                  Continue to Security Questions
                </Button>
              </div>
            ) : (
              // Step 2: Security Questions
              <div>
                <div className="flex items-center mb-6">
                  <Lock className="h-5 w-5 mr-2 text-green-600" />
                  <span className="font-medium">Security Questions</span>
                </div>

                <p className="text-sm text-gray-600 mb-6">
                  Please select and answer three security questions to help protect your account
                </p>

                <div className="space-y-6">
                  {formData.securityQuestions.map((securityQuestion, index) => (
                    <Card key={index} className="bg-green-50 border-green-100">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-green-800">
                          Question {index + 1} <span className="text-red-500 ml-1">*</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-0">
                        <div className="space-y-2">
                          <Label className="text-xs">
                            Select a security question <span className="text-red-500 ml-1">*</span>
                          </Label>
                          <Select
                            value={securityQuestion.questionId}
                            onValueChange={(value) => handleSecurityQuestionChange(index, 'questionId', value)}
                          >
                            <SelectTrigger className="focus:ring-green-500 border-gray-300 text-sm">
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
                          <Label className="text-xs">
                            Your Answer <span className="text-red-500 ml-1">*</span>
                          </Label>
                          <Input
                            type="text"
                            value={securityQuestion.answer}
                            onChange={(e) => handleSecurityQuestionChange(index, 'answer', e.target.value)}
                            placeholder="Enter your answer"
                            disabled={!securityQuestion.questionId}
                            className="focus-visible:ring-green-200 border-gray-300 text-sm"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {errors.securityQuestions && (
                    <Alert variant="destructive" className="bg-red-50 text-red-800 border-red-200">
                      <AlertDescription>
                        {errors.securityQuestions}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="border-gray-300 hover:bg-gray-50 text-gray-700"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>

                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isSubmitting ? 'Processing...' : 'Create Lab Account'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-4 text-sm text-gray-600">
          Already have an account? <a href="/" className="text-green-600 hover:underline">Sign in here</a>
        </div>
      </div>
    </div>
  );
};

export default LabSignupForm;