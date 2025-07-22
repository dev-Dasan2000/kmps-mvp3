"use client";

import React, { useRef, useState } from 'react';
import SignaturePad from 'react-signature-canvas';
import type SignaturePadType from 'react-signature-canvas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SignatureDialogProps {
  onSave: (signatureData: string) => void;
  trigger?: React.ReactNode;
  radiologistId: string;
  apiClient: any;
}

export function SignatureDialog({ onSave, trigger, radiologistId, apiClient }: SignatureDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const signaturePadRef = useRef<SignaturePadType>(null);

  const handleSave = async () => {
    if (!signaturePadRef.current) return;
    if (signaturePadRef.current.isEmpty()) {
      toast.error('Please draw your signature before saving');
      return;
    }

    try {
      setIsLoading(true);
      // Get the signature as a data URL
      const signatureData = signaturePadRef.current.toDataURL('image/png');
      
      // Convert base64 to blob
      const base64Data = signatureData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      const blob = new Blob(byteArrays, { type: 'image/png' });
      
      // Create form data with a unique filename
      const formData = new FormData();
      const filename = `signature_${radiologistId}_${Date.now()}.png`;
      formData.append('signature', blob, filename);

      // Upload signature
      const response = await apiClient.post(
        `/signature/${radiologistId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Signature upload response:', response.data);

      if (response.data.url) {
        // Update radiologist with new signature URL
        const updateResponse = await apiClient.put(`/radiologists/${radiologistId}/signature`, {
          signatureUrl: response.data.url
        });

        if (updateResponse.data.radiologist?.signature) {
          // Call onSave with the new signature URL
          onSave(updateResponse.data.radiologist.signature);
          setOpen(false);
          toast.success('Signature saved successfully');
        } else {
          throw new Error('Failed to update radiologist signature');
        }
      } else {
        throw new Error('Failed to save signature');
      }
    } catch (error: any) {
      console.error('Error saving signature:', error);
      toast.error('Failed to save signature', {
        description: error.response?.data?.error || error.message || 'An error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (newOpen) {
        // Clear the signature pad when opening the dialog
        if (signaturePadRef.current) {
          signaturePadRef.current.clear();
        }
      }
      setOpen(newOpen);
    }}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Add Signature</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Your Signature</DialogTitle>
        </DialogHeader>
        <div className="border rounded-lg p-2 bg-white">
          <SignaturePad
            ref={signaturePadRef}
            canvasProps={{
              className: "w-full h-[200px] border rounded",
              style: { 
                width: '100%', 
                height: '200px',
                backgroundColor: '#fff'
              }
            }}
          />
        </div>
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClear} disabled={isLoading}>
            Clear
          </Button>
          <Button className='bg-emerald-600 hover:bg-emerald-500 text-white' onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Signature'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 