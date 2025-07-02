"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface CancelAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancel: (note: string) => Promise<void>
  selectedCount: number
}

export function CancelAppointmentDialog({ open, onOpenChange, onCancel, selectedCount }: CancelAppointmentDialogProps) {
  const [note, setNote] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleCancel = async () => {
    try {
      setIsLoading(true)
      await onCancel(note)
      setNote("")
      onOpenChange(false)
    } catch (error) {
      console.error("Error cancelling appointments:", error)
      toast.error("Failed to cancel appointments")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel {selectedCount} appointment{selectedCount > 1 ? 's' : ''}?</DialogTitle>
          <DialogDescription>
            {selectedCount > 1 
              ? "Are you sure you want to cancel these appointments?"
              : "Are you sure you want to cancel this appointment?"}
            <br />
            You can add an optional note that will be sent to the patient.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cancel-note" className="text-right">
              Note (Optional)
            </Label>
            <Textarea
              id="cancel-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a reason for cancellation (optional)"
              className="col-span-3"
              rows={4}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Go Back
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleCancel}
            disabled={isLoading}
          >
            {isLoading ? "Cancelling..." : "Confirm Cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
