"use client";
import React, { useState } from 'react';
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
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Lock,
  Stethoscope,
  Plus,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface LabSignupData {
  name: string;
  password: string;
  confirmPassword: string;
  contact_person: string;
  contact_number: string;
  email: string;
  address: string;
  specialties: string[];
}

interface FormErrors {
  [key: string]: string;
}

const LabSignupForm: React.FC = () => {
  const [formData, setFormData] = useState<LabSignupData>({
    name: '',
    password: '',
    confirmPassword: '',
    contact_person: '',
    contact_number: '',
    email: '',
    address: '',
    specialties: []
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState('');

  const router = useRouter();

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const commonSpecialties = [
    'Pathology', 'Hematology', 'Microbiology', 'Biochemistry',
    'Immunology', 'Molecular Biology', 'Cytology', 'Histopathology',
    'Clinical Chemistry', 'Serology', 'Parasitology', 'Virology'
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Lab name validation
    if (!formData.name.trim()) {
      console.log("Validation failed: Laboratory name is empty");
      newErrors.name = 'Laboratory name is required';
    } else if (formData.name.trim().length < 2) {
      console.log("Validation failed: Laboratory name too short");
      newErrors.name = 'Laboratory name must be at least 2 characters';
    }

    // Contact person validation
    if (!formData.contact_person.trim()) {
      console.log("Validation failed: Contact person is empty");
      newErrors.contact_person = 'Contact person is required';
    } else if (formData.contact_person.trim().length < 2) {
      console.log("Validation failed: Contact person name too short");
      newErrors.contact_person = 'Contact person name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      console.log("Validation failed: Email is empty");
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email)) {
      console.log("Validation failed: Invalid email format");
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone number validation
    const phoneRegex = /^(?:\+94|0)?7\d{8}$/;
    if (!formData.contact_number.trim()) {
      console.log("Validation failed: Contact number is empty");
      newErrors.contact_number = 'Contact number is required';
    } else if (!phoneRegex.test(formData.contact_number.replace(/[\s\-\(\)]/g, ''))) {
      console.log("Validation failed: Invalid phone number format");
      newErrors.contact_number = 'Please enter a valid phone number';
    }

    // Password validation
    if (!formData.password) {
      console.log("Validation failed: Password is empty");
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      console.log("Validation failed: Password too short");
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      console.log("Validation failed: Password missing required character types");
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      console.log("Validation failed: Confirm password is empty");
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      console.log("Validation failed: Passwords do not match");
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Address validation
    if (!formData.address.trim()) {
      console.log("Validation failed: Address is empty");
      newErrors.address = 'Address is required';
    } else if (formData.address.trim().length < 10) {
      console.log("Validation failed: Address too short");
      newErrors.address = 'Please provide a complete address';
    }

    // Specialties validation
    if (formData.specialties.length === 0) {
      console.log("Validation failed: No specialties selected");
      newErrors.specialties = 'Please select at least one specialty';
    }

    setErrors(newErrors);

    const isValid = Object.keys(newErrors).length === 0;
    if (!isValid) {
      console.log("Form is invalid. Errors:", newErrors);
    }
    return isValid;
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

  const handleSubmit = async () => {

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData = {
        name: formData.name.trim(),
        password: formData.password,
        contact_person: formData.contact_person.trim(),
        contact_number: formData.contact_number.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        specialties: formData.specialties.join(', ')
      };

      const res = await axios.post(
        `${backendURL}/labs`,
        {
          name: submissionData.name,
          password: submissionData.password,
          contact_person: submissionData.contact_person,
          contact_number: submissionData.contact_number,
          email: submissionData.email,
          address: submissionData.address,
          specialties: submissionData.specialties
        }
      );
      if (res.status == 409) {
        throw new Error("Email Already Exists");
      }
      if (res.status != 201) {
        throw new Error("Error Creating an Account");
      }

      toast.success("Account Creation Succesfull");
      router.push("/")

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          toast.error("Email already exists");
        } else {
          toast.error(error.response?.data?.error || "Error creating account");
        }
      } else {
        toast.error(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join as Lab Partner</h1>
          <p className="text-gray-600">Create your laboratory account and start managing your operations</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Laboratory Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Laboratory Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
                      placeholder="Enter laboratory name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contact_person" className="text-sm font-medium text-gray-700">
                      Contact Person *
                    </Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => handleInputChange('contact_person', e.target.value)}
                      className={`mt-1 ${errors.contact_person ? 'border-red-500' : ''}`}
                      placeholder="Enter contact person name"
                    />
                    {errors.contact_person && (
                      <p className="mt-1 text-sm text-red-600">{errors.contact_person}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contact_number" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number *
                    </Label>
                    <Input
                      id="contact_number"
                      value={formData.contact_number}
                      onChange={(e) => handleInputChange('contact_number', e.target.value)}
                      className={`mt-1 ${errors.contact_number ? 'border-red-500' : ''}`}
                      placeholder="Enter phone number"
                    />
                    {errors.contact_number && (
                      <p className="mt-1 text-sm text-red-600">{errors.contact_number}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address *
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={`mt-1 min-h-[80px] ${errors.address ? 'border-red-500' : ''}`}
                    placeholder="Enter complete address"
                    rows={3}
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Security */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Security
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password *
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`mt-1 ${errors.password ? 'border-red-500' : ''}`}
                      placeholder="Create a strong password"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirm Password *
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`mt-1 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      placeholder="Confirm your password"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Specialties */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" />
                  Specialties *
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {commonSpecialties.map((specialty) => (
                      <label key={specialty} className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={formData.specialties.includes(specialty)}
                          onCheckedChange={() => handleSpecialtyToggle(specialty)}
                        />
                        <span className="text-sm text-gray-700">{specialty}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      placeholder="Add custom specialty"
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomSpecialty())}
                    />
                    <Button
                      type="button"
                      onClick={handleAddCustomSpecialty}
                      variant="outline"
                      size="sm"
                      disabled={!newSpecialty.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {formData.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.specialties.map((specialty) => (
                        <Badge key={specialty} variant="secondary" className="text-sm">
                          {specialty}
                          <button
                            type="button"
                            onClick={() => handleRemoveSpecialty(specialty)}
                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {errors.specialties && (
                    <p className="text-sm text-red-600">{errors.specialties}</p>
                  )}
                </div>
              </div>

              <Separator />



              {/* Submit Button */}
              <div className="pt-4">
                {errors.submit && (
                  <Alert className="mb-4" variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.submit}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleSubmit}
                  className="w-full bg-emerald-500 hover:bg-emerald-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Lab Account'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="#" className="text-blue-600 hover:underline font-medium">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LabSignupForm;