import React, { useState, useEffect, useContext } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { AuthContext } from "@/context/auth-context";
import { toast } from "sonner";

interface Item {
  item_id?: number;
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
}

interface Batch {
  batch_id: number;
  item: Item;
  current_stock: number;
  minimum_stock: number;
  expiry_date: string;
  stock_date: string;
}

interface SubCategory {
  sub_category_id: number;
  sub_category_name: string;
}

interface Supplier {
  supplier_id: number;
  company_name: string;
}

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (item: Item, batch: Batch) => void;
  subCategories: SubCategory[];
  suppliers: Supplier[];
  editItem?: Item;
  editBatch?: Batch;
  scannedBarcode?: string;
}

export function AddItemDialog({
  open,
  onOpenChange,
  onSubmit,
  subCategories,
  suppliers,
  editItem,
  editBatch,
  scannedBarcode
}: AddItemDialogProps) {
  const [batchTracking, setBatchTracking] = useState(editItem?.batch_tracking || false);
  const [batches, setBatches] = useState<Partial<Batch>[]>(
    editBatch && editItem?.batch_tracking 
      ? [{
          ...editBatch,
          item: editItem,
          current_stock: editBatch.current_stock || 0,
          minimum_stock: editBatch.minimum_stock || 0,
          expiry_date: editBatch.expiry_date || new Date().toISOString().split('T')[0],
          stock_date: editBatch.stock_date || new Date().toISOString()
        }]
      : editItem && !editItem.batch_tracking && editBatch
      ? [{
          ...editBatch,
          item: editItem,
          current_stock: editBatch.current_stock || 0,
          minimum_stock: editBatch.minimum_stock || 0,
          expiry_date: editBatch.expiry_date || new Date().toISOString().split('T')[0],
          stock_date: editBatch.stock_date || new Date().toISOString()
        }]
      : [{
          current_stock: 0,
          minimum_stock: 0,
          expiry_date: new Date().toISOString().split('T')[0],
          stock_date: new Date().toISOString(),
          item: editItem || {} as Item
        }]
  );
  
  // Fetch batches when editing an item with batch tracking
  useEffect(() => {
    const fetchBatches = async () => {
      if (editItem?.item_id && editItem.batch_tracking) {
        try {
          const response = await apiClient.get(`/inventory/items/${editItem.item_id}/batches`);
          setBatches(response.data || []);
        } catch (error) {
          console.error('Error fetching batches:', error);
          toast.error('Failed to load batch information');
        }
      }
    };

    if (editItem?.batch_tracking) {
      fetchBatches();
    }
  }, [editItem?.item_id, editItem?.batch_tracking]);

  const addNewBatch = () => {
    setBatches([
      ...batches,
      {
        current_stock: 0,
        minimum_stock: 0,
        expiry_date: new Date().toISOString().split('T')[0],
        stock_date: new Date().toISOString(),
        item: editItem || {} as Item
      }
    ]);
  };
  
  // Add the apiClient to the component's props
  const { apiClient } = useContext(AuthContext);

  const removeBatch = (index: number) => {
    const newBatches = [...batches];
    newBatches.splice(index, 1);
    setBatches(newBatches);
  };

  const updateBatch = (index: number, field: keyof Omit<Batch, 'item' | 'item_id'>, value: any) => {
    const newBatches = [...batches];
    newBatches[index] = { ...newBatches[index], [field]: value };
    
    // If updating expiry_date, ensure it's in the correct format
    if (field === 'expiry_date' && value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        newBatches[index].expiry_date = date.toISOString().split('T')[0];
      }
    }
    
    setBatches(newBatches);
  };

  useEffect(() => {
    if (editItem) {
      setBatchTracking(editItem.batch_tracking);
    }
  }, [editItem]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Create the item object
    const item: Item = {
      ...(editItem?.item_id ? { item_id: editItem.item_id } : {}),
      item_name: formData.get('item_name') as string,
      unit_of_measurements: formData.get('unit_of_measurements') as string,
      unit_price: parseFloat(formData.get('unit_price') as string) || 0,
      storage_location: formData.get('storage_location') as string,
      barcode: formData.get('barcode') as string,
      expiry_alert_days: parseInt(formData.get('expiry_alert_days') as string) || 30,
      description: formData.get('description') as string,
      sub_category_id: parseInt(formData.get('sub_category_id') as string) || null,
      supplier_id: parseInt(formData.get('supplier_id') as string) || null,
      batch_tracking: batchTracking,
    };

    // Log the item payload for debugging
    console.log('Submitting item:', JSON.stringify(item, null, 2));

    try {
      if (batchTracking) {
        // For batch tracking, submit the item first, then batches
        const itemResponse = await apiClient.post('/inventory/items', item);
        const savedItem = itemResponse.data;
        
        // Submit each batch
        const batchPromises = batches.map(async (batchData) => {
          const batchToSubmit = {
            ...batchData,
            item_id: savedItem.item_id,
            current_stock: Number(batchData.current_stock) || 0,
            minimum_stock: Number(batchData.minimum_stock) || 0,
            expiry_date: batchData.expiry_date || new Date().toISOString().split('T')[0],
            stock_date: batchData.stock_date || new Date().toISOString()
          };
          
          const batchResponse = await apiClient.post('/inventory/batches', batchToSubmit);
          return batchResponse.data;
        });

        const savedBatches = await Promise.all(batchPromises);
        onSubmit(savedItem, savedBatches[0]); // Pass the first batch to maintain compatibility
      } else {
        try {
          // For non-batch items, submit item and single batch
          console.log('Submitting non-batch item...');
          const itemResponse = await apiClient.post('/inventory/items', item);
          const savedItem = itemResponse.data;
          
          console.log('Item saved successfully:', savedItem);
          
          const batch = {
            item_id: savedItem.item_id,
            current_stock: Number(formData.get('current_stock')) || 0,
            minimum_stock: Number(formData.get('minimum_stock')) || 0,
            expiry_date: (formData.get('expiry_date') as string) || new Date().toISOString().split('T')[0],
            stock_date: new Date().toISOString()
          };
          
          console.log('Submitting batch:', batch);
          const batchResponse = await apiClient.post('/inventory/batches', batch);
          const savedBatch = batchResponse.data;
          console.log('Batch saved successfully:', savedBatch);
          
          onSubmit(savedItem, { ...savedBatch, item: savedItem });
        } catch (error) {
          console.error('Error in non-batch item submission:', error);
          if (error.response) {
            console.error('Error response data:', error.response.data);
            console.error('Error status:', error.response.status);
            console.error('Error headers:', error.response.headers);
          } else if (error.request) {
            console.error('No response received:', error.request);
          } else {
            console.error('Error message:', error.message);
          }
          throw error; // Re-throw to be caught by the outer catch
        }
      }
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          <DialogDescription>
            {editItem ? 'Edit the details for this inventory item' : 'Add a new item to your inventory'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="item_name">Item Name *</Label>
            <Input
              name="item_name"
              required
              placeholder="Enter item name"
              defaultValue={editItem?.item_name || ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub_category_id">Category *</Label>
            <Select name="sub_category_id" defaultValue={editItem?.sub_category_id?.toString()} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {subCategories.map((category) => (
                  <SelectItem key={category.sub_category_id} value={category.sub_category_id.toString()}>
                    {category.sub_category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!batchTracking && (
            <>
              <div className="space-y-2">
                <Label htmlFor="current_stock">Current Stock *</Label>
                <Input
                  name="current_stock"
                  type="number"
                  min="0"
                  required={!batchTracking}
                  placeholder="Enter current stock"
                  defaultValue={editBatch?.current_stock || 0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimum_stock">Minimum Stock *</Label>
                <Input
                  name="minimum_stock"
                  type="number"
                  min="0"
                  required={!batchTracking}
                  placeholder="Enter minimum stock"
                  defaultValue={editBatch?.minimum_stock || 0}
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="unit_of_measurements">Unit of Measurement</Label>
            <Input
              name="unit_of_measurements"
              placeholder="e.g., pieces, boxes"
              defaultValue={editItem?.unit_of_measurements || ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit_price">Unit Price ($)</Label>
            <Input
              name="unit_price"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter unit price"
              defaultValue={editItem?.unit_price || ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_id">Supplier</Label>
            <Select name="supplier_id" defaultValue={editItem?.supplier_id?.toString()}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.supplier_id} value={supplier.supplier_id.toString()}>
                    {supplier.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="storage_location">Storage Location</Label>
            <Input
              name="storage_location"
              placeholder="Enter storage location"
              defaultValue={editItem?.storage_location || ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode/SKU</Label>
            <Input
              name="barcode"
              placeholder="Enter barcode or SKU"
              defaultValue={scannedBarcode || editItem?.barcode || ''}
              readOnly={!!scannedBarcode}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiry_alert_days">Expiry Alert Days</Label>
            <Input
              name="expiry_alert_days"
              type="number"
              min="0"
              placeholder="Default: 30 days"
              defaultValue={editItem?.expiry_alert_days || 30}
            />
          </div>
          {!batchTracking && (
            <div className="space-y-2">
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                name="expiry_date"
                type="date"
                defaultValue={editBatch?.expiry_date || ''}
              />
            </div>
          )}
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              name="description"
              placeholder="Enter item description"
              defaultValue={editItem?.description || ''}
            />
          </div>
          <div className="md:col-span-2 flex items-center space-x-2">
            <Switch
              name="batch_tracking"
              checked={batchTracking}
              onCheckedChange={setBatchTracking}
            />
            <Label htmlFor="batch_tracking">Enable batch tracking for this item</Label>
          </div>

          {batchTracking && (
            <div className="md:col-span-2 space-y-4 border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Batches</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addNewBatch}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add Batch
                </Button>
              </div>

              {batches.map((batch, index) => (
                <div key={index} className="grid grid-cols-1 gap-4 border rounded p-4 relative">
                  {batches.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => removeBatch(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor={`batch_id_${index}`}>Batch ID</Label>
                    <Input
                      id={`batch_id_${index}`}
                      name={`batch_id_${index}`}
                      placeholder="Auto-generated"
                      value={batch.batch_id || ''}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`current_stock_${index}`}>Current Stock *</Label>
                    <Input
                      id={`current_stock_${index}`}
                      name={`current_stock_${index}`}
                      type="number"
                      min="0"
                      placeholder="Enter current stock"
                      value={batch.current_stock || ''}
                      onChange={(e) => updateBatch(index, 'current_stock', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`minimum_stock_${index}`}>Minimum Stock *</Label>
                    <Input
                      id={`minimum_stock_${index}`}
                      name={`minimum_stock_${index}`}
                      type="number"
                      min="0"
                      placeholder="Enter minimum stock"
                      value={batch.minimum_stock || ''}
                      onChange={(e) => updateBatch(index, 'minimum_stock', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`expiry_date_${index}`}>Expiry Date</Label>
                    <Input
                      id={`expiry_date_${index}`}
                      name={`expiry_date_${index}`}
                      type="date"
                      value={batch.expiry_date || ''}
                      onChange={(e) => updateBatch(index, 'expiry_date', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="md:col-span-2 flex flex-col sm:flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto">
              {editItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 