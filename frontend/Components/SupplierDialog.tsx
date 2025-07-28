import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// TypeScript interface for Supplier
export interface Supplier {
  supplier_id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  website: string;
  notes: string;
  status: 'active' | 'inactive' ;
  purchase_orders?: any[]; // Add this line
}

interface SupplierDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Supplier, 'supplier_id'>) => void;
  initialData?: Supplier;
  mode: 'add' | 'edit';
}

const SupplierDialog: React.FC<SupplierDialogProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
  mode
}) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      company_name: formData.get('company_name')?.toString().trim() || '',
      contact_person: formData.get('contact_person')?.toString().trim() || '',
      email: formData.get('email')?.toString().trim() || '',
      phone_number: formData.get('phone_number')?.toString().trim() || '',
      address: formData.get('address')?.toString().trim() || '',
      city: formData.get('city')?.toString().trim() || '',
      state: formData.get('state')?.toString().trim() || '',
      postal_code: formData.get('postal_code')?.toString().trim() || '',
      country: formData.get('country')?.toString().trim() || '',
      website: formData.get('website')?.toString().trim() || '',
      notes: formData.get('notes')?.toString().trim() || '',
      status: formData.get('status')?.toString() as 'active' | 'inactive' || 'active',
    };
    if (!data.company_name || !data.email || !data.contact_person) return;
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Supplier' : 'Edit Supplier'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Enter the details for the new supplier.' : 'Update the details for this supplier.'}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto px-1"
        >
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name *</Label>
            <Input name="company_name" defaultValue={initialData?.company_name || ''} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_person">Contact Person *</Label>
            <Input name="contact_person" defaultValue={initialData?.contact_person || ''} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input name="email" type="email" defaultValue={initialData?.email || ''} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number *</Label>
            <Input name="phone_number" defaultValue={initialData?.phone_number || ''} required />
          </div>
          <div className="col-span-1 md:col-span-2 space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Textarea name="address" defaultValue={initialData?.address || ''} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input name="city" defaultValue={initialData?.city || ''} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Input name="state" defaultValue={initialData?.state || ''} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postal_code">Postal Code *</Label>
            <Input name="postal_code" defaultValue={initialData?.postal_code || ''} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Input name="country" defaultValue={initialData?.country || ''} required />
          </div>
          <div className="col-span-1 md:col-span-2 space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input name="website" defaultValue={initialData?.website || ''} />
          </div>
          <div className="col-span-1 md:col-span-2 space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea name="notes" defaultValue={initialData?.notes || ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <select 
              name="status" 
              defaultValue={initialData?.status || 'active'} 
              required 
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              
            </select>
          </div>
          <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto">
              {mode === 'add' ? 'Add Supplier' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierDialog; 