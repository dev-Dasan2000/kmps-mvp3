import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { 
  User, 
  Mail, 
  Phone, 
  Clock, 
  Calendar, 
  DollarSign, 
  Globe, 
  Briefcase,
  Timer,
  Stethoscope,
  Monitor,
  MapPin
} from "lucide-react";

// Extended User interface to include all fields from the three tables
interface User {
  // Common fields
  name: string;
  email: string;
  phone_number?: string;
  id: string;
  
  // Dentist-specific fields
  profile_picture?: string;
  language?: string;
  service_types?: string;
  work_days_from?: string;
  work_days_to?: string;
  work_time_from?: string;
  work_time_to?: string;
  appointment_duration?: string;
  appointment_fee?: number;
  
  // Role identifier - now includes radiologist
  role: 'Dentist' | 'Receptionist' | 'Radiologist';
  
  // Additional fields that might exist
  created_at?: string;
  updated_at?: string;
  status?: string;
  department?: string;
  experience?: string;
  specialization?: string;
  bio?: string;
}

interface Props {
  user: User | null;
  onClose: () => void;
}

export default function ViewUserDialog({ user, onClose }: Props) {
  if (!user) return null;

  const isDentist = user.role === 'Dentist';
  const isRadiologist = user.role === 'Radiologist';
  const isReceptionist = user.role === 'Receptionist';
  
  const userInitials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  const formatWorkDays = () => {
    if (!user.work_days_from || !user.work_days_to) return null;
    return `${user.work_days_from} - ${user.work_days_to}`;
  };

  const formatWorkTime = () => {
    if (!user.work_time_from || !user.work_time_to) return null;
    return `${user.work_time_from} - ${user.work_time_to}`;
  };

  const formatServiceTypes = () => {
    if (!user.service_types) return null;
    return user.service_types.split(',').map(service => service.trim());
  };

  // Helper function to get role-specific styling
  const getRoleStyles = () => {
    switch (user.role) {
      case 'Dentist':
        return {
          badgeColor: "bg-blue-100 text-blue-800",
          icon: <Stethoscope className="w-4 h-4" />,
          accentColor: "text-blue-600"
        };
      case 'Radiologist':
        return {
          badgeColor: "bg-emerald-100 text-emerald-800",
          icon: <Monitor className="w-4 h-4" />,
          accentColor: "text-emerald-600"
        };
      case 'Receptionist':
        return {
          badgeColor: "bg-purple-100 text-purple-800",
          icon: <User className="w-4 h-4" />,
          accentColor: "text-purple-600"
        };
      default:
        return {
          badgeColor: "bg-gray-100 text-gray-800",
          icon: <User className="w-4 h-4" />,
          accentColor: "text-gray-600"
        };
    }
  };

  const roleStyles = getRoleStyles();

  // Helper function to render info item
  const renderInfoItem = (
    icon: React.ReactNode,
    label: string,
    value: string | number | null | undefined
  ) => {
    if (!value) return null;
    
    return (
      <div className="flex items-start gap-3">
        <div className="text-gray-400 mt-0.5">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600 break-words">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="md:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b border-gray-100 pb-6">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Staff Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Profile Header */}
          <div className="flex items-start gap-6">
            <div className="relative w-20 h-20">
              {user.profile_picture ? (
                <>
                  <Image
                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${user.profile_picture}`}
                    alt={user.name}
                    width={80}
                    height={80}
                    className="rounded-full border border-gray-200 object-cover w-full h-full"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) {
                        fallback.style.display = 'flex';
                      }
                    }}
                  />
                  <div 
                    className="hidden items-center justify-center w-full h-full rounded-full border border-gray-200 bg-gray-100 text-gray-600 text-lg font-semibold"
                  >
                    {userInitials}
                  </div>
                </>
              ) : (
                <div className="w-full h-full rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-600 text-lg font-semibold">
                  {userInitials}
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{user.name}</h3>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={`${roleStyles.badgeColor} border-0 font-medium`}>
                      <div className="flex items-center gap-1.5">
                        {roleStyles.icon}
                        {user.role}
                      </div>
                    </Badge>
                    {user.status && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status.toLowerCase() === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">ID: {user.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Contact Information</h4>
              <div className="space-y-4">
                {renderInfoItem(<Mail className="w-4 h-4" />, "Email", user.email)}
                {renderInfoItem(<Phone className="w-4 h-4" />, "Phone", user.phone_number)}
                {user.department && renderInfoItem(<MapPin className="w-4 h-4" />, "Department", user.department)}
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          {(isDentist || isRadiologist) && (
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Professional Details</h4>
                <div className="space-y-4">
                  {user.specialization && renderInfoItem(<Briefcase className="w-4 h-4" />, "Specialization", user.specialization)}
                  {user.experience && renderInfoItem(<Clock className="w-4 h-4" />, "Experience", user.experience)}
                  {user.language && renderInfoItem(<Globe className="w-4 h-4" />, "Language", user.language)}
                  {isDentist && user.appointment_fee !== undefined && user.appointment_fee !== null && renderInfoItem(
                    <DollarSign className="w-4 h-4" />, 
                    "Consultation Fee", 
                    `$${Number(user.appointment_fee).toFixed(2)}`
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule Information - Only for Dentists */}
          {isDentist && (formatWorkDays() || formatWorkTime() || user.appointment_duration) && (
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Schedule</h4>
                <div className="space-y-4">
                  {formatWorkDays() && renderInfoItem(<Calendar className="w-4 h-4" />, "Working Days", formatWorkDays())}
                  {formatWorkTime() && renderInfoItem(<Clock className="w-4 h-4" />, "Working Hours", formatWorkTime())}
                  {user.appointment_duration && renderInfoItem(<Timer className="w-4 h-4" />, "Appointment Duration", user.appointment_duration)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Services - Only for Dentists */}
          {isDentist && formatServiceTypes() && (
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Services</h4>
                <div className="flex flex-wrap gap-2">
                  {formatServiceTypes()?.map((service, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bio - if available */}
          {user.bio && (
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">About</h4>
                <p className="text-gray-700 leading-relaxed">{user.bio}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}