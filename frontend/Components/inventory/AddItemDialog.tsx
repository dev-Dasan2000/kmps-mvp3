import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

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
  batch_id?: number;
  item_id?: number;
  current_stock: number;
  minimum_stock: number;
  expiry_date: string;
  stock_date?: string;
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
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
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
      batch_tracking: formData.get('batch_tracking') === 'on',
    };

    const batch: Batch = {
      ...(editBatch?.batch_id ? { batch_id: editBatch.batch_id } : {}),
      ...(editBatch?.item_id ? { item_id: editBatch.item_id } : {}),
      current_stock: parseInt(formData.get('current_stock') as string) || 0,
      minimum_stock: parseInt(formData.get('minimum_stock') as string) || 0,
      expiry_date: formData.get('expiry_date') as string || "",
      ...(editBatch?.stock_date ? { stock_date: editBatch.stock_date } : {}),
    };

    onSubmit(item, batch);
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
          <div className="space-y-2">
            <Label htmlFor="current_stock">Current Stock *</Label>
            <Input 
              name="current_stock" 
              type="number" 
              min="0" 
              required 
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
              required 
              placeholder="Enter minimum stock"
              defaultValue={editBatch?.minimum_stock || 0}
            />
          </div>
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
          <div className="space-y-2">
            <Label htmlFor="expiry_date">Expiry Date</Label>
            <Input 
              name="expiry_date" 
              type="date"
              defaultValue={editBatch?.expiry_date || ''}
            />
          </div>
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
              defaultChecked={editItem?.batch_tracking || false}
            />
            <Label htmlFor="batch_tracking">Enable batch tracking for this item</Label>
          </div>
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