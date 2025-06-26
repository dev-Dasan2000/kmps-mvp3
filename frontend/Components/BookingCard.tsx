import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
import { Button } from './ui/button'
import axios from 'axios'
import { toast } from 'sonner'




interface BookingCardProps {
  appointmentId: string
  serviceProviderEmail: string
  date: string // DATE from database
  timeFrom: string // TIME from database
  timeTo: string // TIME from database
  note?: string
  // Additional display properties (would come from joined tables)
  providerName?: string
  providerAvatar?: string
  serviceName?: string
  onCancel?: (appointmentId: string) => void
}

export function BookingCard({ 
  appointmentId,
  serviceProviderEmail,
  date, 
  timeFrom, 
  timeTo,
  note,
  providerName,
  providerAvatar,
  serviceName,
  onCancel
}: BookingCardProps) {
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  // Determine appointment status based on date
  const getAppointmentStatus = (appointmentDate: string) => {
    const today = new Date()
    const apptDate = new Date(appointmentDate)
    
    today.setHours(0, 0, 0, 0)
    apptDate.setHours(0, 0, 0, 0)
    
    if (apptDate < today) {
      return 'Completed'
    } else if (apptDate.getTime() === today.getTime()) {
      return 'Today'
    } else {
      return 'Upcoming'
    }
  }

  const status = getAppointmentStatus(date)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'Today':
        return 'bg-blue-100 text-blue-800'
      case 'Upcoming':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Generate fallback provider name from email
  const displayProviderName = providerName || serviceProviderEmail.split('@')[0]
  
  // Generate initials for avatar fallback
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleAppointmentCancellation = async (appointment_id: string) => {
    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/appointments/${appointment_id}`
      );
      if(response.data.message == "Appointment deleted") {
        toast.success("Appointment cancelled", {
          description: "The appointment has been successfully cancelled"
        });
        // Call the onCancel callback to update parent state
        onCancel?.(appointment_id);
      } else {
        throw new Error("Cancellation error");
      }
    } catch(err: any) {
      toast.error("Error cancelling appointment", {
        description: "Could not cancel the appointment. Please try again."
      });
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <Avatar className='hidden sm:flex'>
          {providerAvatar ? (
            <AvatarImage src={providerAvatar} alt={displayProviderName} />
          ) : null}
          <AvatarFallback className="bg-emerald-100 text-emerald-600">
            {getInitials(displayProviderName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h4 className="font-medium capitalize">{serviceName || 'Service'}</h4>
          <p className="text-sm text-gray-600">{displayProviderName}</p>
          {note && (
            <p className="text-xs text-gray-500 mt-1 italic">"{note}"</p>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm">
          <span className="text-gray-600">{date}</span>
          <span className="ml-2 text-gray-900">
            {timeFrom} - {timeTo}
          </span>
        </div>
        <div className="flex gap-2 mt-2 justify-end">
          <span className={`px-2 py-1.5 rounded-full text-xs ${getStatusColor(status)}`}>
            {status}
          </span>
          {status === 'Completed' && (
            <Button variant="outline" size="sm" className="text-[#6B7280] border-[#6B7280]/20 hover:bg-gray-100">
              Book Again
            </Button>
          )}
          {(status === 'Upcoming' || status === 'Today') && (
            <Button variant="outline" size="sm" className="text-green-600 border-green-600/20 hover:bg-red-50" onClick={()=>{handleAppointmentCancellation(appointmentId)}}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}