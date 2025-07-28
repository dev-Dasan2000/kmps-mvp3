"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Item {
  item_id: number;
  item_name: string;
  unit_of_measurements: string;
  unit_price: number;
  storage_location: string;
  barcode: string;
  expiry_alert_days: number;
  description: string;
  sub_category_id: number | null;
  supplier_id: number | null;
  batch_tracking: boolean;
  sub_category?: {
    sub_category_name: string;
  } | null;
  supplier?: {
    company_name: string;
  } | null;
}

interface Batch {
  batch_id: number;
  item_id: number;
  current_stock: number;
  minimum_stock: number;
  expiry_date: string;
  stock_date: string;
}

// Activity logger function
const logActivity = async (
  action: string,
  itemName: string,
  issuedTo: string,
  itemId: number,
  details: string
) => {
  try {
    // Log to console for now
    console.log(`Activity: ${action} - ${itemName} by ${issuedTo} (${details})`);
    
    // TODO: Implement API call to log activity
    // await fetch('/api/inventory/activity-log', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     action,
    //     item_name: itemName,
    //     issued_to: issuedTo,
    //     item_id: itemId,
    //     details,
    //     created_at: new Date().toISOString()
    //   })
    // });
  } catch (error) {
    console.error('Error in logActivity:', error);
  }
};

interface StockOutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  batch: Batch | null;
  onUpdate: (itemId: number, newStock: number) => void;
}

export function StockOutDialog({ isOpen, onClose, item, batch, onUpdate }: StockOutDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!item || !batch) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const quantityIssued = parseInt(formData.get('quantityIssued') as string);
    const issuedTo = formData.get('issuedTo') as string;
    const usageType = formData.get('usageType') as string;
    const notes = formData.get('notes') as string;

    // Validate quantity
    if (quantityIssued > batch.current_stock) {
      toast.error(`Cannot issue ${quantityIssued} items. Only ${batch.current_stock} available.`);
      setLoading(false);
      return;
    }

    try {
      // Calculate new stock
      const newStock = batch.current_stock - quantityIssued;
      
      // Update batch stock in database
      const response = await fetch(`/api/inventory/batch/${batch.batch_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_stock: newStock
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update stock');
      }

      // Log the activity
      await logActivity(
        'Stock Out',
        item.item_name,
        issuedTo || 'Staff User',
        item.item_id,
        `${quantityIssued} ${item.unit_of_measurements} - ${usageType}${notes ? ` - ${notes}` : ''}`
      );

      toast.success(`${quantityIssued} ${item.unit_of_measurements} issued successfully`);
      onUpdate(item.item_id, newStock);
      onClose();
    } catch (error) {
      console.error('Error issuing stock:', error);
      toast.error("Failed to issue stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Stock Out - {item.item_name}</DialogTitle>
          <DialogDescription>
            Available stock: {batch.current_stock} {item.unit_of_measurements}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantityIssued">Quantity to Issue *</Label>
              <Input
                id="quantityIssued"
                name="quantityIssued"
                type="number"
                min="1"
                max={batch.current_stock}
                placeholder="Enter quantity"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="usageType">Usage Type *</Label>
              <Select name="usageType" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select usage type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="treatment">Used for Treatment</SelectItem>
                  <SelectItem value="wasted">Wasted</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="issuedTo">Issued To / Used By</Label>
              <Input
                id="issuedTo"
                name="issuedTo"
                placeholder="Enter staff name or department"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Add any notes about this stock issue..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {loading ? "Processing..." : "Issue Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 