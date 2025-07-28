'use client';

import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Scan, X } from 'lucide-react';
import { toast } from 'sonner';
import './scanner-styles.css';

interface BarcodeScannerProps {
  onScanResult: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScanResult,
  isOpen,
  onClose
}) => {
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isOpen && !scanner) {
      // Add a small delay to ensure the DOM element is rendered
      const timer = setTimeout(() => {
        const element = document.getElementById("qr-reader");
        if (!element) {
          console.error("QR reader element not found");
          toast.error("Failed to initialize scanner");
          return;
        }

        const html5QrcodeScanner = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          false
        );

        html5QrcodeScanner.render(
          (decodedText) => {
            onScanResult(decodedText);
            html5QrcodeScanner.clear();
            onClose();
            toast.success("Scan Successful", {
              description: `Barcode/QR code detected: ${decodedText}`
            });
          },
          (error) => {
            // Only log actual errors, not permission requests
            if (!error.includes("NotAllowedError") && 
                !error.includes("NotFoundException") &&
                !error.includes("No MultiFormat Readers")) {
              console.log("Scan error:", error);
            }
          }
        );

        setScanner(html5QrcodeScanner);
      }, 100); // Small delay to ensure DOM is ready

      return () => clearTimeout(timer);
    }

    return () => {
      if (scanner && isOpen === false) {
        scanner.clear().catch(console.error);
        setScanner(null);
      }
    };
  }, [isOpen, scanner, onScanResult, onClose]);

  const handleClose = () => {
    if (scanner) {
      scanner.clear().catch(console.error);
      setScanner(null);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Scan Barcode/QR Code
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="scanner-container relative shadow-lg">
            <div 
              id="qr-reader" 
              className="w-full compact-scanner !border-none !p-0 !w-full
                [&>#qr-reader__header]:!bg-gray-100 [&>#qr-reader__header]:!p-1 [&>#qr-reader__header]:!text-xs [&>#qr-reader__header]:!text-gray-600 [&>#qr-reader__header]:!text-center [&>#qr-reader__header]:!border-b [&>#qr-reader__header]:!border-gray-200
                [&>#qr-reader__status]:!bg-gray-100 [&>#qr-reader__status]:!text-gray-600 [&>#qr-reader__status]:!text-xs [&>#qr-reader__status]:!p-1 [&>#qr-reader__status]:!text-center
                [&>#qr-reader__scan_region]:!bg-black [&>#qr-reader__scan_region]:!min-h-[200px] [&>#qr-reader__scan_region]:!max-h-[200px] [&>#qr-reader__scan_region]:!relative [&>#qr-reader__scan_region]:!overflow-hidden
                [&>#qr-reader__dashboard]:!p-1 [&>#qr-reader__dashboard]:!bg-gray-50 [&>#qr-reader__dashboard]:!border-t [&>#qr-reader__dashboard]:!border-gray-200
                [&>#qr-reader__dashboard_button]:!bg-emerald-600 [&>#qr-reader__dashboard_button]:!text-white [&>#qr-reader__dashboard_button]:!border-none [&>#qr-reader__dashboard_button]:!py-1 [&>#qr-reader__dashboard_button]:!px-2 [&>#qr-reader__dashboard_button]:!rounded [&>#qr-reader__dashboard_button]:!text-xs [&>#qr-reader__dashboard_button]:!cursor-pointer [&>#qr-reader__dashboard_button]:!m-0.5 [&>#qr-reader__dashboard_button]:!transition-colors [&>#qr-reader__dashboard_button]:hover:!bg-emerald-500
                [&>#qr-reader__dashboard_section_csr]:!mb-1
                [&>#qr-reader__dashboard_section_csr_select]:!p-1 [&>#qr-reader__dashboard_section_csr_select]:!rounded [&>#qr-reader__dashboard_section_csr_select]:!border [&>#qr-reader__dashboard_section_csr_select]:!border-gray-300 [&>#qr-reader__dashboard_section_csr_select]:!w-full [&>#qr-reader__dashboard_section_csr_select]:!max-w-[300px] [&>#qr-reader__dashboard_section_csr_select]:!text-xs
                [&>#qr-reader__dashboard_section_swaplink]:!text-gray-600 [&>#qr-reader__dashboard_section_swaplink]:!no-underline [&>#qr-reader__dashboard_section_swaplink]:!text-xs [&>#qr-reader__dashboard_section_swaplink]:!my-1 [&>#qr-reader__dashboard_section_swaplink]:!block
                [&_input[type='file']]:!w-0 [&_input[type='file']]:!h-0 [&_input[type='file']]:!opacity-0 [&_input[type='file']]:!overflow-hidden [&_input[type='file']]:!absolute [&_input[type='file']]:!-z-10
                [&_input[type='file']+span]:!bg-blue-500 [&_input[type='file']+span]:!text-white [&_input[type='file']+span]:!border-none [&_input[type='file']+span]:!py-1 [&_input[type='file']+span]:!px-2 [&_input[type='file']+span]:!rounded [&_input[type='file']+span]:!text-xs [&_input[type='file']+span]:!cursor-pointer [&_input[type='file']+span]:!inline-block [&_input[type='file']+span]:!m-0.5 [&_input[type='file']+span]:!transition-colors [&_input[type='file']+span]:hover:!bg-blue-600
                after:content-[''] after:absolute after:top-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-transparent after:via-blue-500 after:to-transparent after:animate-pulse after:z-10"
            />
          </div>
          <Button variant="outline" onClick={handleClose} className="w-full">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};