"use client";

import { useState, useEffect } from "react";
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
  item: Item;
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
    // await fetch('/api/inventory/Stockout', {
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
  batches?: Batch[]; // Array of batches for the item
  onUpdate: (itemId: number, newStock: number, batchId?: number) => void;
}

export function StockOutDialog({ isOpen, onClose, item, batch, batches = [], onUpdate }: StockOutDialogProps) {
  // Always define hooks at the top level
  const [loading, setLoading] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [availableStock, setAvailableStock] = useState(0);

  // Set initial batch selection and available stock when props change
  useEffect(() => {
    if (!item) return;
    
    if (item.batch_tracking && batches.length > 0) {
      // For batch-tracked items, select the first batch by default
      const initialBatchId = batches[0]?.batch_id || null;
      setSelectedBatchId(initialBatchId);
      const selectedBatch = batches.find(b => b.batch_id === initialBatchId);
      setAvailableStock(selectedBatch?.current_stock || 0);
    } else if (batch) {
      // For non-batch-tracked items, use the single batch
      setSelectedBatchId(batch.batch_id);
      setAvailableStock(batch.current_stock || 0);
    } else {
      // Reset if no valid batch
      setSelectedBatchId(null);
      setAvailableStock(0);
    }
  }, [item, batch, batches]);
  
  // Update available stock when selected batch changes
  useEffect(() => {
    if (item?.batch_tracking && selectedBatchId) {
      const selectedBatch = batches.find(b => b.batch_id === selectedBatchId);
      setAvailableStock(selectedBatch?.current_stock || 0);
    }
  }, [selectedBatchId, batches, item?.batch_tracking]);

  if (!item) return null;

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
    if (quantityIssued > availableStock) {
      toast.error(`Cannot issue ${quantityIssued} items. Only ${availableStock} available.`);
      setLoading(false);
      return;
    }

    try {
      // Get the target batch (selected batch or the single batch if not batch tracking)
      const targetBatch = item.batch_tracking && selectedBatchId 
        ? batches.find(b => b.batch_id === selectedBatchId)
        : batch;

      if (!targetBatch) {
        throw new Error('No valid batch selected');
      }

      // Calculate new stock
      const newStock = targetBatch.current_stock - quantityIssued;
      
      // Update batch stock in database
      const response = await fetch(`/api/inventory/batch/${targetBatch.batch_id}`, {
        method: '#',
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
      onUpdate(item.item_id, newStock, targetBatch.batch_id);
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
            {item.batch_tracking ? (
              <span>Select a batch to issue stock from</span>
            ) : (
              <span>Available stock: {availableStock} {item.unit_of_measurements}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {item.batch_tracking && batches.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="batchSelect">Select Batch *</Label>
              <Select 
                value={selectedBatchId?.toString() || ''} 
                onValueChange={(value) => setSelectedBatchId(parseInt(value))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem 
                      key={batch.batch_id} 
                      value={batch.batch_id.toString()}
                      disabled={batch.current_stock <= 0}
                    >
                      <div className="flex justify-between w-full">
                        <span>Batch #{batch.batch_id}</span>
                        <span className="text-muted-foreground ml-2">
                          {batch.current_stock} {item.unit_of_measurements} available
                          {batch.expiry_date && ` • Exp: ${new Date(batch.expiry_date).toLocaleDateString()}`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantityIssued">Quantity to Issue *</Label>
              <Input
                id="quantityIssued"
                name="quantityIssued"
                type="number"
                min="1"
                max={availableStock}
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