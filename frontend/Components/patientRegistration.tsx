"use client"

import axios from "axios"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { Upload, User, Shield, CheckCircle, Mail, AlertCircle, Info, ArrowLeft, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LoadingButton } from "@/components/ui/loading-button"
import Image from "next/image"
import Recaptcha from "@/app/recaptcha.png"

type Step = 1 | 2 | 3

interface ClientFormData {
  // Personal Info
  image: File | null
  firstName: string
  lastName: string
  email: string
  contactNumber: string
  date_of_birth: string
  blood_group: string
  nic: string
  gender: string
  address: string
  password: string
  confirmPassword: string
  // Security
  securityQuestion1: string
  securityAnswer1: string
  securityQuestion2: string
  securityAnswer2: string
  securityQuestion3: string
  securityAnswer3: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
  date_of_birth?: string
  nic?: string
  blood_group?: string
  securityAnswer1?: string
  securityAnswer2?: string
  securityAnswer3?: string
}

export default function ClientRegistration() {
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)
  const [securityQuestions, setSecurityQuestions] = useState<any[]>([])
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [formData, setFormData] = useState<ClientFormData>({
    image: null,
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    date_of_birth: "",
    nic: "",
    blood_group: "",
    gender: "",
    address: "",
    password: "",
    confirmPassword: "",
    securityQuestion1: "",
    securityAnswer1: "",
    securityQuestion2: "",
    securityAnswer2: "",
    securityQuestion3: "",
    securityAnswer3: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [otpTimer, setOtpTimer] = useState(0)
  const [canResendOtp, setCanResendOtp] = useState(true)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStepValid, setIsStepValid] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [emailExists, setEmailExists] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const router = useRouter()

  const steps = [
    { number: 1, title: "Personal Info", icon: User },
    { number: 2, title: "Verification", icon: Shield },
    { number: 3, title: "Security", icon: CheckCircle },
  ]

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  // Validate email format
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Check password strength
  const checkPasswordStrength = (password: string) => {
    if (!password) return null

    const hasLowerCase = /[a-z]/.test(password)
    const hasUpperCase = /[A-Z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    const strength = (hasLowerCase ? 1 : 0) + (hasUpperCase ? 1 : 0) + (hasNumbers ? 1 : 0) + (hasSpecialChars ? 1 : 0)

    if (password.length < 8) return "weak"
    if (strength <= 2) return "weak"
    if (strength === 3) return "medium"
    return "strong"
  }

  // Validate form fields
  const validateField = (name: string, value: string) => {
    const fieldErrors: FormErrors = {}

    switch (name) {
      case "firstName":
        if (!value.trim()) {
          fieldErrors.firstName = "First name is required"
        }
        break
      case "lastName":
        if (!value.trim()) {
          fieldErrors.lastName = "Last name is required"
        }
        break
      case "email":
        if (!value.trim()) {
          fieldErrors.email = "Email is required"
        } else if (!isValidEmail(value)) {
          fieldErrors.email = "Please enter a valid email address"
        }
        break
      case "password":
        if (!value) {
          fieldErrors.password = "Password is required"
        } else if (value.length < 8) {
          fieldErrors.password = "Password must be at least 8 characters long"
        }

        setPasswordStrength(checkPasswordStrength(value))

        if (formData.confirmPassword && value !== formData.confirmPassword) {
          fieldErrors.confirmPassword = "Passwords do not match"
        } else {
          setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
        }
        break
      case "confirmPassword":
        if (!value) {
          fieldErrors.confirmPassword = "Please confirm your password"
        } else if (value !== formData.password) {
          fieldErrors.confirmPassword = "Passwords do not match"
        } else {
          fieldErrors.confirmPassword = undefined
        }
        break
      case "dob":
        if (!value.trim()) {
          fieldErrors.date_of_birth = "Date of birth is required"
        }
        break
      case "securityAnswer1":
        if (!value.trim()) {
          fieldErrors.securityAnswer1 = "Please provide an answer"
        }
        break
      case "securityAnswer2":
        if (!value.trim()) {
          fieldErrors.securityAnswer2 = "Please provide an answer"
        }
        break
      case "securityAnswer3":
        if (!value.trim()) {
          fieldErrors.securityAnswer3 = "Please provide an answer"
        }
        break
    }

    return fieldErrors
  }

  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (!touched[name]) {
      setTouched((prev) => ({ ...prev, [name]: true }))
    }

    const fieldErrors = validateField(name, value)
    setErrors((prev) => ({ ...prev, ...fieldErrors }))
  }

  const handleFieldBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
    const fieldErrors = validateField(name, formData[name as keyof ClientFormData] as string)
    setErrors((prev) => ({ ...prev, ...fieldErrors }))

    // Check email existence only on blur and if it's a valid email
    if (name === 'email' && formData.email && isValidEmail(formData.email)) {

    }
  }

  // Add useEffect to validate step when relevant data changes
  useEffect(() => {
    const validateCurrentStep = () => {
      const stepErrors: FormErrors = {}
      let isValid = true;

      switch (currentStep) {
        case 1:
          if (!formData.firstName.trim()) {
            stepErrors.firstName = "First name is required"
            isValid = false
          }
          if (!formData.lastName.trim()) {
            stepErrors.lastName = "Last name is required"
            isValid = false
          }
          if (!formData.email.trim()) {
            stepErrors.email = "Email is required"
            isValid = false
          } else if (!isValidEmail(formData.email)) {
            stepErrors.email = "Please enter a valid email address"
            isValid = false
          }
          if (!formData.password) {
            stepErrors.password = "Password is required"
            isValid = false
          } else if (formData.password.length < 8) {
            stepErrors.password = "Password must be at least 8 characters long"
            isValid = false
          }
          if (!formData.confirmPassword) {
            stepErrors.confirmPassword = "Please confirm your password"
            isValid = false
          } else if (formData.confirmPassword !== formData.password) {
            stepErrors.confirmPassword = "Passwords do not match"
            isValid = false
          }
          if (!formData.date_of_birth.trim()) {
            stepErrors.date_of_birth = "date of birth is required"
            isValid = false
          }
          break
        case 2:
          if (!isRecaptchaVerified) {
            isValid = false
          }
          if (!isEmailVerified) {
            isValid = false
          }
          break
        case 3:
          // Require at least one security question to be answered
          const hasAnsweredQuestion = [
            formData.securityQuestion1 && formData.securityAnswer1.trim(),
            formData.securityQuestion2 && formData.securityAnswer2.trim(),
            formData.securityQuestion3 && formData.securityAnswer3.trim()
          ].some(Boolean)

          if (!hasAnsweredQuestion) {
            isValid = false
          }

          // For selected questions, validate their answers
          if (formData.securityQuestion1 && !formData.securityAnswer1.trim()) {
            stepErrors.securityAnswer1 = "Please provide an answer"
            isValid = false
          }
          if (formData.securityQuestion2 && !formData.securityAnswer2.trim()) {
            stepErrors.securityAnswer2 = "Please provide an answer"
            isValid = false
          }
          if (formData.securityQuestion3 && !formData.securityAnswer3.trim()) {
            stepErrors.securityAnswer3 = "Please provide an answer"
            isValid = false
          }
          break
      }

      setErrors(stepErrors)
      setIsStepValid(isValid)
    }

    validateCurrentStep()
  }, [
    currentStep,
    formData.firstName,
    formData.lastName,
    formData.email,
    formData.password,
    formData.confirmPassword,
    formData.date_of_birth,
    formData.blood_group,
    formData.nic,
    formData.securityQuestion1,
    formData.securityAnswer1,
    formData.securityQuestion2,
    formData.securityAnswer2,
    formData.securityQuestion3,
    formData.securityAnswer3,
    isRecaptchaVerified,
    isEmailVerified
  ])

  const handleNext = () => {
    if (isStepValid && currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as Step)
      setTouched({})
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step)
      setTouched({})
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image too large", {
          description: "Please select an image smaller than 5MB",
        })
        return
      }

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }

      const newPreview = URL.createObjectURL(file)
      setImagePreview(newPreview)
      setFormData({ ...formData, image: file })
    }
  }

  const handleRecaptcha = () => {
    setIsRecaptchaVerified(true)
    toast.success("reCAPTCHA Verified", {
      description: "You can now proceed to email verification.",
    })
  }

  const sendOtpToEmail = async () => {
    if (!formData.email) {
      toast.error("Email Required", {
        description: "Please enter your email address first.",
      })
      return;
    }

    if (!isValidEmail(formData.email)) {
      toast.error("Invalid Email", {
        description: "Please enter a valid email address.",
      })
      return;
    }

    setIsSendingOtp(true);
    try {
      const response = await axios.post(
        `${backendURL}/email-verification`,
        {
          email: formData.email
        },
        {
          withCredentials: true,
          headers: {
            "Content-type": "application/json"
          }
        }
      );
      if (response.status == 201) {
        toast.success("OTP Sent", {
          description: `A 6-digit verification code has been sent to ${formData.email}`,
        });
        setOtpSent(true);
      }
      else {
        const error = new Error("Server Error") as Error & { details?: string }
        error.details = "Verification code not sent, please retry";
        throw error;
      }
    }
    catch (error: any) {
      toast.error(error.message, {
        description: error.details
      });
    } finally {
      setIsSendingOtp(false);
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const verifyOtp = async () => {
    const enteredOtp = otp.join("");
    setIsVerifyingOtp(true);

    try {
      const response = await axios.post(
        `${backendURL}/email-verification/verify`,
        {
          email: formData.email,
          code: enteredOtp
        },
        {
          withCredentials: true,
          headers: {
            "Content-type": "application/json"
          }
        }
      );
      if (response.data == true) {
        setIsEmailVerified(true);
        toast.success("Success", {
          description: "Email verified successfully, Please continue.",
        });
      }
      else {
        const error = new Error("Verification Failed") as Error & { details?: string }
        error.details = "Verification code is not verified. Please retry";
        throw error;
      }
    }
    catch (error: any) {
      toast.error(error.message, {
        description: error.details,
      })
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  const resendOtp = () => {
    if (canResendOtp) {
      sendOtpToEmail()
      setOtp(["", "", "", "", "", ""])
    }
  }

  const handleRegistrationComplete = async () => {
    if (!isStepValid) {
      return
    }

    setIsSubmitting(true)
    try {
      // Get answered security questions
      const answeredQuestions = [
        { question: formData.securityQuestion1, answer: formData.securityAnswer1 },
        { question: formData.securityQuestion2, answer: formData.securityAnswer2 },
        { question: formData.securityQuestion3, answer: formData.securityAnswer3 }
      ].filter(q => q.question && q.answer.trim());

      // Create form data for image upload
      const imageFormData = new FormData()
      if (formData.image) {
        imageFormData.append("image", formData.image)
      }

      const regiRes = await axios.post(
        `${backendURL}/patients/`,
        {
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`,
          phone_number: formData.contactNumber || "",
          date_of_birth: formData.date_of_birth,
          nic: formData.nic || "",
          blood_group: formData.blood_group || "",
          gender: formData.gender,
          address: formData.address || "",
          password: formData.password,
          profile_picture: null
        }
      )

      if (regiRes.status === 201) {
        for (const q of answeredQuestions) {
          await axios.post(
            `${backendURL}/patient-security-questions-answers/`,
            {
              patient_id: regiRes.data.patient_id,
              security_question_id: q.question,
              answer: q.answer,
            }
          );
        }

        if (formData.image) {
          const uploadres = await axios.post(
            `${backendURL}/photos`,
            imageFormData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              }
            }
          );

          // Update client with profile picture URL
          if (uploadres.data.url) {
            await axios.put(`${backendURL}/patients/${regiRes.data.patient_id}`, {
              profile_picture: uploadres.data.url
            });
          }
        }

        toast.success("Registration successful! redirecting to login page...");
        router.push("/");
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      if (error.response?.data?.error?.includes("duplicate key")) {
        toast.error("This email is already registered")
      } else {
        toast.error(error.response?.data?.error || "Registration failed. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepIndicator = () => (
  <div className="flex items-center justify-center mb-8 overflow-x-auto">
    {steps.map((step, index) => (
      <div key={step.number} className="flex items-center">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
            currentStep >= step.number
              ? "bg-emerald-600 border-emerald-600 text-white"
              : "border-gray-300 text-gray-400"
          }`}
        >
          {currentStep > step.number ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
        </div>
        <span
          className={`ml-2 text-sm hidden md:inline ${
            currentStep >= step.number ? "text-emerald-600 font-medium" : "text-gray-400"
          }`}
        >
          {step.title}
        </span>
        {index < steps.length - 1 && (
          <div className={`w-8 md:w-16 h-0.5 mx-2 md:mx-4 ${currentStep > step.number ? "bg-emerald-600" : "bg-gray-300"}`} />
        )}
      </div>
    ))}
  </div>
)

  const ErrorMessage = ({ message }: { message?: string }) => {
    if (!message) return null
    return (
      <div className="flex items-center mt-1 text-red-500 text-sm">
        <AlertCircle className="w-3 h-3 mr-1" />
        <span>{message}</span>
      </div>
    )
  }

  const renderPasswordStrengthIndicator = () => {
    if (!formData.password || !passwordStrength) return null

    const getStrengthColor = () => {
      switch (passwordStrength) {
        case "weak":
          return "bg-red-500"
        case "medium":
          return "bg-yellow-500"
        case "strong":
          return "bg-green-500"
        default:
          return "bg-gray-300"
      }
    }

    const getStrengthWidth = () => {
      switch (passwordStrength) {
        case "weak":
          return "w-1/3"
        case "medium":
          return "w-2/3"
        case "strong":
          return "w-full"
        default:
          return "w-0"
      }
    }

    const getStrengthText = () => {
      switch (passwordStrength) {
        case "weak":
          return "Weak password"
        case "medium":
          return "Medium strength"
        case "strong":
          return "Strong password"
        default:
          return ""
      }
    }

    return (
      <div className="mt-1">
        <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${getStrengthColor()} ${getStrengthWidth()} transition-all duration-300`}></div>
        </div>
        <div className="flex items-center mt-1 text-xs">
          <span
            className={`
            ${passwordStrength === "weak" ? "text-red-500" : ""}
            ${passwordStrength === "medium" ? "text-yellow-500" : ""}
            ${passwordStrength === "strong" ? "text-green-500" : ""}
          `}
          >
            {getStrengthText()}
          </span>
          {passwordStrength !== "strong" && (
            <span className="ml-auto text-gray-500 text-xs">
              Use uppercase, lowercase, numbers, and special characters
            </span>
          )}
        </div>
      </div>
    )
  }

  const renderPasswordMatchIndicator = () => {
    if (!formData.password || !formData.confirmPassword || (errors.confirmPassword && touched.confirmPassword)) {
      return null
    }

    const passwordsMatch = formData.password === formData.confirmPassword

    if (passwordsMatch) {
      return (
        <div className="mt-1">
          <div className="flex items-center text-xs text-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            <span>Passwords match</span>
          </div>
        </div>
      )
    }

    return null
  }

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-center text-gray-900">Personal Information</h2>
      <p className="text-center text-gray-600">Create your client account to browse and book services</p>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label>Profile Image</Label>
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {imagePreview ? (
              <img
                src={imagePreview || "/placeholder.svg"}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <Upload className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <Input type="file" accept="image/*" onChange={handleImageUpload} className="flex-1" />
        </div>
        <p className="text-xs text-gray-500">Maximum file size: 5MB. Recommended dimensions: 200x200px.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="firstName" className="flex items-center">
            First Name <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleFieldChange("firstName", e.target.value)}
            onBlur={() => handleFieldBlur("firstName")}
            placeholder="Enter your first name"
            className={errors.firstName && touched.firstName ? "border-red-500" : ""}
            required
          />
          <ErrorMessage message={touched.firstName ? errors.firstName : undefined} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lastName" className="flex items-center">
            Last Name <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleFieldChange("lastName", e.target.value)}
            onBlur={() => handleFieldBlur("lastName")}
            placeholder="Enter your last name"
            className={errors.lastName && touched.lastName ? "border-red-500" : ""}
            required
          />
          <ErrorMessage message={touched.lastName ? errors.lastName : undefined} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="email" className="flex items-center">
          Email <span className="text-red-500 ml-1">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleFieldChange("email", e.target.value)}
          onBlur={() => handleFieldBlur("email")}
          placeholder="Enter your email"
          className={errors.email && touched.email ? "border-red-500" : ""}
          required
        />
        <ErrorMessage message={touched.email ? errors.email : undefined} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="contactNumber">Contact Number</Label>
          <Input
            id="contactNumber"
            value={formData.contactNumber}
            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
            placeholder="Enter your contact number"
          />
        </div>
        <div className="space-y-1">
  <Label htmlFor="date_of_birth" className="flex items-center">
    Date of Birth <span className="text-red-500 ml-1">*</span>
  </Label>
  <Input
    id="date_of_birth"
    type="date"
    value={formData.date_of_birth}
    onChange={(e) => {
      // Convert the date to a string format (YYYY-MM-DD)
      const dateString = e.target.value;
      handleFieldChange("date_of_birth", dateString);
    }}
    onBlur={() => handleFieldBlur("date_of_birth")}
    className={errors.date_of_birth && touched.date_of_birth ? "border-red-500" : ""}
    required
    // Optional: Set max date to today to prevent future dates
    max={new Date().toISOString().split('T')[0]}
    // Optional: Set reasonable min date (e.g., 120 years ago)
    min={new Date(new Date().getFullYear() - 120, 0, 1).toISOString().split('T')[0]}
  />
  <ErrorMessage message={touched.date_of_birth ? errors.date_of_birth : undefined} />
</div>
      </div>

      <div className="flex justify-between">
        <div className="flex flex-col">
          <Label className="mb-4">Gender</Label>
          <RadioGroup value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Male" id="male" />
              <Label htmlFor="male">Male</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Female" id="female" />
              <Label htmlFor="female">Female</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Other" id="other" />
              <Label htmlFor="other">Other</Label>
            </div>
          </RadioGroup>
        </div>
       
     

      </div>
       <div className="space-y-1">
          <Label className="mb-4">NIC</Label>
          <Input
            id="nic"
            type="text"
            min="1"
            max="120"
            value={formData.nic}
            onChange={(e) => handleFieldChange("nic", e.target.value)}
            onBlur={() => handleFieldBlur("nic")}
            placeholder="Enter your NIC"
            className={errors.nic && touched.nic ? "border-red-500" : ""}
          />
          <ErrorMessage message={touched.date_of_birth ? errors.date_of_birth : undefined} />
        </div>
        <div className="space-y-1">
  <Label className="mb-4">Blood Group</Label>
  <select
    id="blood_group"
    value={formData.blood_group}
    onChange={(e) => handleFieldChange("blood_group", e.target.value)}
    onBlur={() => handleFieldBlur("blood_group")}
    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors.blood_group && touched.blood_group ? "border-red-500" : "border-gray-300"
    }`}
  >
    <option value="">Select your Blood Group</option>
    <option value="A+">A+</option>
    <option value="A-">A-</option>
    <option value="B+">B+</option>
    <option value="B-">B-</option>
    <option value="AB+">AB+</option>
    <option value="AB-">AB-</option>
    <option value="O+">O+</option>
    <option value="O-">O-</option>
  </select>
  <ErrorMessage message={touched.blood_group ? errors.blood_group : undefined} />
</div>

      <div className="space-y-1">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Enter your address"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="password" className="flex items-center">
            Password <span className="text-red-500 ml-1">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleFieldChange("password", e.target.value)}
              onBlur={() => handleFieldBlur("password")}
              placeholder="Enter your password (min 8 characters)"
              className={errors.password && touched.password ? "border-red-500 pr-10" : "pr-10"}
              required
            />
            {formData.password && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            )}
          </div>
          <ErrorMessage message={touched.password ? errors.password : undefined} />
          {renderPasswordStrengthIndicator()}
        </div>
        <div className="space-y-1">
          <Label htmlFor="confirmPassword" className="flex items-center">
            Confirm Password <span className="text-red-500 ml-1">*</span>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
              onBlur={() => handleFieldBlur("confirmPassword")}
              placeholder="Confirm your password"
              className={errors.confirmPassword && touched.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
              required
            />
            {formData.confirmPassword && (
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            )}
          </div>
          <ErrorMessage message={touched.confirmPassword ? errors.confirmPassword : undefined} />
          {renderPasswordMatchIndicator()}
        </div>
      </div>
    </div>
  )

  const renderVerification = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-center text-gray-900">Verification</h2>

      {/* reCAPTCHA */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Human Verification</h3>
        <div
          className={`border rounded-lg p-4 ${!isRecaptchaVerified ? "border-amber-300 bg-amber-50" : "border-emerald-300 bg-emerald-50"}`}
        >
          <div className="flex items-center space-x-3">
            <Checkbox
              id="recaptcha"
              checked={isRecaptchaVerified}
              onCheckedChange={handleRecaptcha}
              className={isRecaptchaVerified ? "bg-green-500 text-white" : ""}
            />
            <Label htmlFor="recaptcha" className="text-sm">
              {"I'm not a robot"}
            </Label>
            <div className="ml-auto">
              <Image src={Recaptcha} alt="reCAPTCHA" className="w-10 h-10" />
            </div>
          </div>
          {!isRecaptchaVerified && (
            <div className="flex items-center mt-2 text-amber-600 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              <span>Please verify that you are not a robot</span>
            </div>
          )}
        </div>
      </div>

      {/* Email Verification with OTP */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Email Verification</h3>
        <div
          className={`space-y-4 border rounded-lg p-4 ${isEmailVerified ? "border-emerald-300 bg-emerald-50" : !otpSent ? "border-amber-300 bg-amber-50" : "border-blue-300 bg-blue-50"}`}
        >
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span>
              {"We'll send a 6-digit verification code to: "}
              <strong>{formData.email}</strong>
            </span>
          </div>

          {!otpSent ? (
            <>
              <LoadingButton
                onClick={sendOtpToEmail}
                disabled={!isRecaptchaVerified || !formData.email}
                className="w-full"
                isLoading={isSendingOtp}
                loadingText="Sending verification code..."
              >
                Send Verification Code
              </LoadingButton>
              {!isRecaptchaVerified && (
                <div className="flex items-center text-amber-600 text-sm">
                  <Info className="w-4 h-4 mr-1" />
                  <span>Complete the reCAPTCHA verification first</span>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-blue-600 mb-4">Enter the 6-digit verification code sent to your email</p>

                <div className="flex justify-center space-x-2 mb-4">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el
                      }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`w-12 h-12 text-center text-lg font-semibold ${isEmailVerified ? "border-emerald-500 bg-emerald-50" : ""}`}
                      disabled={isEmailVerified || isVerifyingOtp}
                    />
                  ))}
                </div>

                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-500">{otpTimer > 0 && `Resend available in ${otpTimer}s`}</div>
                  <LoadingButton
                    onClick={resendOtp}
                    disabled={!canResendOtp}
                    className="text-sm text-emerald-600 hover:text-emerald-700"
                    isLoading={isSendingOtp}
                    loadingText="Sending..."
                  >
                    Resend Code
                  </LoadingButton>
                </div>

                {!isEmailVerified ? (
                  <LoadingButton
                    onClick={verifyOtp}
                    disabled={otp.some((digit) => !digit)}
                    className="w-full"
                    isLoading={isVerifyingOtp}
                    loadingText="Verifying..."
                  >
                    Verify Code
                  </LoadingButton>
                ) : (
                  <div className="flex items-center justify-center space-x-2 text-emerald-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Email verified successfully!</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderSecurity = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-center text-gray-900">Security Questions</h2>
      <p className="text-center text-gray-600">Please select and answer 3 security questions for account recovery.</p>

      {isLoadingQuestions && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <p className="mt-2 text-gray-600">Loading security questions...</p>
        </div>
      )}

      {!isLoadingQuestions && securityQuestions.length === 0 && (
        <div className="text-center py-4 text-amber-600">
          <AlertCircle className="mx-auto h-8 w-8 mb-2" />
          <p>Unable to load security questions. Please refresh the page or try again later.</p>
          <Button onClick={getAllQuestions} variant="outline" className="mt-2">
            Retry
          </Button>
        </div>
      )}

      {!isLoadingQuestions && securityQuestions.length > 0 && (
        <div className="space-y-6">
          {/* Security Question 1 */}
          <div className="space-y-1">
            <Label className="flex items-center">
              Security Question 1 <span className="text-red-500 ml-1">*</span>
            </Label>
            <select
              value={formData.securityQuestion1}
              onChange={(e) => setFormData({ ...formData, securityQuestion1: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a security question</option>
              {securityQuestions.map((question) => (
                <option key={question.security_question_id} value={question.security_question_id}>
                  {question.question}
                </option>
              ))}
            </select>
            <Input
              placeholder="Your answer"
              value={formData.securityAnswer1}
              onChange={(e) => handleFieldChange("securityAnswer1", e.target.value)}
              onBlur={() => handleFieldBlur("securityAnswer1")}
              className={errors.securityAnswer1 && touched.securityAnswer1 ? "border-red-500" : ""}
              required
            />
            <ErrorMessage message={touched.securityAnswer1 ? errors.securityAnswer1 : undefined} />
          </div>

          {/* Security Question 2 */}
          <div className="space-y-1">
            <Label className="flex items-center">
              Security Question 2 <span className="text-red-500 ml-1">*</span>
            </Label>
            <select
              value={formData.securityQuestion2}
              onChange={(e) => setFormData({ ...formData, securityQuestion2: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a security question</option>
              {securityQuestions
                .filter((q) => q.security_question_id !== formData.securityQuestion1)
                .map((question) => (
                  <option key={question.security_question_id} value={question.security_question_id}>
                    {question.question}
                  </option>
                ))}
            </select>
            <Input
              placeholder="Your answer"
              value={formData.securityAnswer2}
              onChange={(e) => handleFieldChange("securityAnswer2", e.target.value)}
              onBlur={() => handleFieldBlur("securityAnswer2")}
              className={errors.securityAnswer2 && touched.securityAnswer2 ? "border-red-500" : ""}
              required
            />
            <ErrorMessage message={touched.securityAnswer2 ? errors.securityAnswer2 : undefined} />
          </div>

          {/* Security Question 3 */}
          <div className="space-y-1">
            <Label className="flex items-center">
              Security Question 3 <span className="text-red-500 ml-1">*</span>
            </Label>
            <select
              value={formData.securityQuestion3}
              onChange={(e) => setFormData({ ...formData, securityQuestion3: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a security question</option>
              {securityQuestions
                .filter((q) => q.security_question_id !== formData.securityQuestion1 && q.security_question_id !== formData.securityQuestion2)
                .map((question) => (
                  <option key={question.security_question_id} value={question.security_question_id}>
                    {question.question}
                  </option>
                ))}
            </select>
            <Input
              placeholder="Your answer"
              value={formData.securityAnswer3}
              onChange={(e) => handleFieldChange("securityAnswer3", e.target.value)}
              onBlur={() => handleFieldBlur("securityAnswer3")}
              className={errors.securityAnswer3 && touched.securityAnswer3 ? "border-red-500" : ""}
              required
            />
            <ErrorMessage message={touched.securityAnswer3 ? errors.securityAnswer3 : undefined} />
          </div>
        </div>
      )}
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderPersonalInfo()
      case 2:
        return renderVerification()
      case 3:
        return renderSecurity()
      default:
        return renderPersonalInfo()
    }
  }

  const getAllQuestions = async () => {
    try {
      setIsLoadingQuestions(true)
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/security-questions/`)

      if (response.data && Array.isArray(response.data)) {
        setSecurityQuestions(response.data)
        console.log("Security questions loaded:", response.data)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (err: any) {
      console.error("Error fetching security questions:", err)
      toast.error("Error loading security questions", {
        description: "Please try again or contact support if the issue persists.",
      })
      // Don't set fallback questions here - we'll keep using the empty array
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  useEffect(() => {
    getAllQuestions()
  }, [])

  // Update the canProceed function to check for emailExists
  const canProceed = () => {
    if (emailExists) return false;

    switch (currentStep) {
      case 1:
        return (
          formData.firstName.trim() &&
          formData.lastName.trim() &&
          formData.email.trim() &&
          isValidEmail(formData.email) &&
          formData.password.trim() &&
          formData.confirmPassword.trim() &&
          formData.password === formData.confirmPassword &&
          formData.password.length >= 8 &&
          !emailExists // Add this condition
        )
      case 2:
        return isRecaptchaVerified && isEmailVerified
      case 3:
        // Require at least one security question to be answered
        const hasAnsweredQuestion = [
          formData.securityQuestion1 && formData.securityAnswer1.trim(),
          formData.securityQuestion2 && formData.securityAnswer2.trim(),
          formData.securityQuestion3 && formData.securityAnswer3.trim()
        ].some(Boolean)

        return hasAnsweredQuestion
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center mb-4">
            <Link href="/" className="flex items-center text-emerald-600 hover:text-emerald-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Account Selection
            </Link>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mb-2">Client Registration</div>
          <p className="text-gray-600 text-sm">Create your client account to browse and book services</p>
        </CardHeader>
        <CardContent className="space-y-8">
          {renderStepIndicator()}
          {renderCurrentStep()}

          <div className="flex justify-between pt-6">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                Back
              </Button>
            )}
            <div className="ml-auto">
              {currentStep < 3 ? (
                <Button onClick={handleNext} disabled={!canProceed()} className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleRegistrationComplete}
                  disabled={!canProceed() || isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Creating Account...
                    </>
                  ) : (
                    "Create Client Account"
                  )}
                </Button>
              )}
            </div>
          </div>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/" className="text-emerald-600 hover:text-emerald-700">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
