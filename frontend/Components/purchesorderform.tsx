"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, AlertCircle, Package, User, Truck, Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Types based on your schema
interface Supplier {
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
  status: string;
}

interface ParentCategory {
  parent_category_id: number;
  parent_category_name: string;
  description: string;
}

interface SubCategory {
  sub_category_id: number;
  sub_category_name: string;
  description: string;
  parent_category_id: number;
}

interface Item {
  item_id: number;
  item_name: string;
  unit_of_measurements: string;
  unit_price: number;
  storage_location: string;
  barcode: string;
  expiry_alert_days: number;
  description: string;
  sub_category_id: number;
  supplier_id: number;
  batch_tracking: boolean;
}

interface PaymentTerm {
  payment_term_id: number;
  payment_term: string;
}

interface ShippingMethod {
  shipping_method_id: number;
  shipping_method: string;
}

interface PurchaseOrderFormProps {
  suppliers: Supplier[];
  items: Item[];
  parentCategories: ParentCategory[];
  subCategories: SubCategory[];
  paymentTerms: PaymentTerm[];
  shippingMethods: ShippingMethod[];
  onSuccess: (purchaseOrder: any) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OrderItem {
  id: string;
  item_id: string;
  item_name: string;
  item_description: string;
  parent_category_id: string;
  sub_category_id: string;
  quantity: number;
  unit_of_measurements: string;
  unit_price: number;
  total_price: number;
  remarks: string;
}

export const PurchaseOrderForm = ({ 
  suppliers, 
  items, 
  parentCategories,
  subCategories,
  paymentTerms,
  shippingMethods,
  onSuccess, 
  isOpen, 
  onOpenChange 
}: PurchaseOrderFormProps) => {
  const [formData, setFormData] = useState({
    supplier_id: '',
    requested_by: '',
    expected_delivery_date: '',
    payment_term_id: '',
    shipping_method_id: '',
    delivery_address: '',
    authorized_by: '',
    notes: ''
  });
  
  const [orderItems, setOrderItems] = useState<OrderItem[]>([{
    id: '1',
    item_id: '',
    item_name: '',
    item_description: '',
    parent_category_id: '',
    sub_category_id: '',
    quantity: 1,
    unit_of_measurements: 'units',
    unit_price: 0,
    total_price: 0,
    remarks: ''
  }]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Validation function
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Validate main form
    if (!formData.supplier_id) {
      newErrors.supplier_id = 'Supplier is required';
    }
    if (!formData.requested_by) {
      newErrors.requested_by = 'Requested by is required';
    }
    if (!formData.payment_term_id) {
      newErrors.payment_term_id = 'Payment terms are required';
    }
    if (!formData.shipping_method_id) {
      newErrors.shipping_method_id = 'Shipping method is required';
    }
    if (!formData.delivery_address) {
      newErrors.delivery_address = 'Delivery address is required';
    }

    // Validate order items
    orderItems.forEach((item, index) => {
      if (!item.item_id) {
        newErrors[`item_${index}_item`] = 'Item is required';
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      if (!item.unit_price || item.unit_price <= 0) {
        newErrors[`item_${index}_price`] = 'Unit price must be greater than 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid for submit button
  const isFormValid = () => {
    return formData.supplier_id && 
           formData.requested_by && 
           formData.payment_term_id && 
           formData.shipping_method_id && 
           formData.delivery_address &&
           orderItems.every(item => 
             item.item_id && 
             item.quantity > 0 && 
             item.unit_price > 0
           );
  };

  const addOrderItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      item_id: '',
      item_name: '',
      item_description: '',
      parent_category_id: '',
      sub_category_id: '',
      quantity: 1,
      unit_of_measurements: 'units',
      unit_price: 0,
      total_price: 0,
      remarks: ''
    };
    setOrderItems([...orderItems, newItem]);
  };

  const removeOrderItem = (id: string) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter(item => item.id !== id));
    }
  };

  const updateOrderItem = (id: string, field: keyof OrderItem, value: any) => {
    setOrderItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // Auto-calculate total price
          if (field === 'quantity' || field === 'unit_price') {
            updatedItem.total_price = Number(updatedItem.quantity || 0) * Number(updatedItem.unit_price || 0);
          }
          
          // Auto-populate from selected item
          if (field === 'item_id' && value) {
            const selectedItem = items.find(itm => itm.item_id.toString() === value);
            
            if (selectedItem) {
              updatedItem.item_name = selectedItem.item_name;
              updatedItem.item_description = selectedItem.description;
              updatedItem.sub_category_id = selectedItem.sub_category_id.toString();
              updatedItem.unit_of_measurements = selectedItem.unit_of_measurements;
              updatedItem.unit_price = Number(selectedItem.unit_price) || 0;
              updatedItem.total_price = Number(updatedItem.quantity || 0) * Number(selectedItem.unit_price || 0);
              
              // Find parent category from sub category
              const subCat = subCategories.find(sc => sc.sub_category_id === selectedItem.sub_category_id);
              if (subCat) {
                updatedItem.parent_category_id = subCat.parent_category_id.toString();
              }
            } else {
              // Reset fields if item not found
              updatedItem.item_name = '';
              updatedItem.item_description = '';
              updatedItem.unit_price = 0;
              updatedItem.total_price = 0;
            }
          }
          
          // Clear item selection when parent category changes
          if (field === 'parent_category_id' && value !== item.parent_category_id) {
            updatedItem.sub_category_id = '';
            updatedItem.item_id = '';
            updatedItem.item_name = '';
            updatedItem.item_description = '';
            updatedItem.unit_price = 0;
            updatedItem.total_price = 0;
          }
          
          // Clear item selection when sub category changes
          if (field === 'sub_category_id' && value !== item.sub_category_id) {
            updatedItem.item_id = '';
            updatedItem.item_name = '';
            updatedItem.item_description = '';
            updatedItem.unit_price = 0;
            updatedItem.total_price = 0;
          }
          
          return updatedItem;
        }
        return item;
      });
    });
  };

  // Get filtered sub categories based on selected parent category
  const getFilteredSubCategories = (parentCategoryId: string) => {
    if (!parentCategoryId) return [];
    return subCategories.filter(subCat => subCat.parent_category_id.toString() === parentCategoryId);
  };

  // Get filtered items based on selected sub category
  const getFilteredItems = (subCategoryId: string) => {
    if (!subCategoryId) return items;
    return items.filter(item => item.sub_category_id.toString() === subCategoryId);
  };

  const getTotalAmount = () => {
    return orderItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Generate PO number (you can customize this logic)
      const poNumber = `PO${Date.now().toString().slice(-6)}`;

      // Create purchase order object
      const purchaseOrder = {
        po_number: poNumber,
        supplier_id: parseInt(formData.supplier_id),
        requested_by: formData.requested_by,
        expected_delivery_date: formData.expected_delivery_date || null,
        payment_term_id: parseInt(formData.payment_term_id),
        shipping_method_id: parseInt(formData.shipping_method_id),
        delivery_address: formData.delivery_address,
        authorized_by: formData.authorized_by || '',
        notes: formData.notes || '',
        total_amount: getTotalAmount(),
        order_date: new Date().toISOString().split('T')[0],
        items: orderItems.map(item => ({
          item_id: parseInt(item.item_id),
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          unit_of_measurements: item.unit_of_measurements,
          item_description: item.item_description || null,
          remarks: item.remarks || null
        }))
      };

      // Call onSuccess with the purchase order data
      onSuccess(purchaseOrder);
      onOpenChange(false);
      
      // Reset form
      setFormData({
        supplier_id: '',
        requested_by: '',
        expected_delivery_date: '',
        payment_term_id: '',
        shipping_method_id: '',
        delivery_address: '',
        authorized_by: '',
        notes: ''
      });
      setOrderItems([{
        id: '1',
        item_id: '',
        item_name: '',
        item_description: '',
        parent_category_id: '',
        sub_category_id: '',
        quantity: 1,
        unit_of_measurements: 'units',
        unit_price: 0,
        total_price: 0,
        remarks: ''
      }]);
      setErrors({});
    } catch (error) {
      console.error('Error creating purchase order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Create Purchase Order
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Fill in the details below to create a new purchase order
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier_id" className="text-xs sm:text-sm font-medium">Supplier *</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
                  >
                    <SelectTrigger className={`w-full h-9 sm:h-10 ${errors.supplier_id ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.supplier_id} value={supplier.supplier_id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{supplier.company_name}</span>
                            <span className="text-xs text-muted-foreground">{supplier.contact_person}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.supplier_id && (
                    <div className="flex items-center gap-1 text-red-500 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      {errors.supplier_id}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requested_by" className="text-xs sm:text-sm font-medium">Requested By *</Label>
                  <Input
                    id="requested_by"
                    value={formData.requested_by}
                    onChange={(e) => setFormData(prev => ({ ...prev, requested_by: e.target.value }))}
                    placeholder="Name of requester"
                    className={`h-9 sm:h-10 ${errors.requested_by ? "border-red-500" : ""}`}
                  />
                  {errors.requested_by && (
                    <div className="flex items-center gap-1 text-red-500 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      {errors.requested_by}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authorized_by" className="text-xs sm:text-sm font-medium">Authorized By</Label>
                  <Input
                    id="authorized_by"
                    value={formData.authorized_by}
                    onChange={(e) => setFormData(prev => ({ ...prev, authorized_by: e.target.value }))}
                    placeholder="Manager/Doctor approval"
                    className="h-9 sm:h-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery & Terms */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Delivery & Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expected_delivery_date" className="text-xs sm:text-sm font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Expected Delivery Date
                  </Label>
                  <Input
                    type="date"
                    id="expected_delivery_date"
                    value={formData.expected_delivery_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
                    className="h-9 sm:h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_term_id" className="text-xs sm:text-sm font-medium">Payment Terms *</Label>
                  <Select
                    value={formData.payment_term_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, payment_term_id: value }))}
                  >
                    <SelectTrigger className={`w-full h-9 sm:h-10 ${errors.payment_term_id ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select payment terms" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTerms.map((term) => (
                        <SelectItem key={term.payment_term_id} value={term.payment_term_id.toString()}>
                          {term.payment_term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.payment_term_id && (
                    <div className="flex items-center gap-1 text-red-500 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      {errors.payment_term_id}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipping_method_id" className="text-xs sm:text-sm font-medium">Shipping Method *</Label>
                  <Select
                    value={formData.shipping_method_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, shipping_method_id: value }))}
                  >
                    <SelectTrigger className={`w-full h-9 sm:h-10 ${errors.shipping_method_id ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select shipping method" />
                    </SelectTrigger>
                    <SelectContent>
                      {shippingMethods.map((method) => (
                        <SelectItem key={method.shipping_method_id} value={method.shipping_method_id.toString()}>
                          {method.shipping_method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.shipping_method_id && (
                    <div className="flex items-center gap-1 text-red-500 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      {errors.shipping_method_id}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="delivery_address" className="text-xs sm:text-sm font-medium flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Delivery Address *
                </Label>
                <Textarea
                  id="delivery_address"
                  value={formData.delivery_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_address: e.target.value }))}
                  placeholder="Complete delivery address"
                  className={`min-h-[60px] resize-none ${errors.delivery_address ? "border-red-500" : ""}`}
                />
                {errors.delivery_address && (
                  <div className="flex items-center gap-1 text-red-500 text-xs">
                    <AlertCircle className="h-3 w-3" />
                    {errors.delivery_address}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base sm:text-lg">Order Items</CardTitle>
                <Button 
                  type="button" 
                  onClick={addOrderItem} 
                  variant="outline" 
                  size="sm"
                  className="w-full sm:w-auto bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderItems.map((item, index) => (
                <Card key={item.id} className="border-2 border-dashed border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm sm:text-base">Item {index + 1}</h4>
                      {orderItems.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeOrderItem(item.id)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Category Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Parent Category</Label>
                        <Select
                          value={item.parent_category_id}
                          onValueChange={(value) => updateOrderItem(item.id, 'parent_category_id', value)}
                        >
                          <SelectTrigger className="w-full h-9 sm:h-10">
                            <SelectValue placeholder="Select parent category" />
                          </SelectTrigger>
                          <SelectContent>
                            {parentCategories.map((category) => (
                              <SelectItem key={category.parent_category_id} value={category.parent_category_id.toString()}>
                                {category.parent_category_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Sub Category</Label>
                        <Select
                          value={item.sub_category_id}
                          onValueChange={(value) => updateOrderItem(item.id, 'sub_category_id', value)}
                          disabled={!item.parent_category_id}
                        >
                          <SelectTrigger className="w-full h-9 sm:h-10">
                            <SelectValue placeholder="Select sub category" />
                          </SelectTrigger>
                          <SelectContent>
                            {getFilteredSubCategories(item.parent_category_id).map((subCategory) => (
                              <SelectItem key={subCategory.sub_category_id} value={subCategory.sub_category_id.toString()}>
                                {subCategory.sub_category_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Item Selection */}
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-medium">Item *</Label>
                      <Select
                        value={item.item_id}
                        onValueChange={(value) => updateOrderItem(item.id, 'item_id', value)}
                        disabled={!item.sub_category_id}
                      >
                        <SelectTrigger className={`w-full h-9 sm:h-10 ${errors[`item_${index}_item`] ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {getFilteredItems(item.sub_category_id).map((itm) => (
                            <SelectItem key={itm.item_id} value={itm.item_id.toString()}>
                              <div className="flex items-center justify-between w-full">
                                <span>{itm.item_name}</span>
                                {itm.barcode && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {itm.barcode}
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors[`item_${index}_item`] && (
                        <div className="flex items-center gap-1 text-red-500 text-xs">
                          <AlertCircle className="h-3 w-3" />
                          {errors[`item_${index}_item`]}
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateOrderItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className={`h-9 sm:h-10 ${errors[`item_${index}_quantity`] ? "border-red-500" : ""}`}
                        />
                        {errors[`item_${index}_quantity`] && (
                          <div className="flex items-center gap-1 text-red-500 text-xs">
                            <AlertCircle className="h-3 w-3" />
                            {errors[`item_${index}_quantity`]}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Unit of Measure</Label>
                        <Input
                          value={item.unit_of_measurements}
                          onChange={(e) => updateOrderItem(item.id, 'unit_of_measurements', e.target.value)}
                          placeholder="Units"
                          className="h-9 sm:h-10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Unit Price *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => updateOrderItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          className={`h-9 sm:h-10 ${errors[`item_${index}_price`] ? "border-red-500" : ""}`}
                        />
                        {errors[`item_${index}_price`] && (
                          <div className="flex items-center gap-1 text-red-500 text-xs">
                            <AlertCircle className="h-3 w-3" />
                            {errors[`item_${index}_price`]}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Total Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.total_price.toFixed(2)}
                          readOnly
                          className="bg-gray-50 h-9 sm:h-10 font-medium"
                        />
                      </div>
                    </div>

                    {/* Description and Remarks */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Item Description</Label>
                        <Input
                          value={item.item_description}
                          onChange={(e) => updateOrderItem(item.id, 'item_description', e.target.value)}
                          placeholder="Detailed item description"
                          className="h-9 sm:h-10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Remarks</Label>
                        <Textarea
                          value={item.remarks}
                          onChange={(e) => updateOrderItem(item.id, 'remarks', e.target.value)}
                          placeholder="Special instructions or remarks"
                          className="min-h-[60px] resize-none"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Separator />
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border">
                <div className="text-lg sm:text-xl font-semibold text-right text-blue-900">
                  Total Amount: ${getTotalAmount().toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs sm:text-sm font-medium">Notes/Comments</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes or comments"
                  className="min-h-[80px] resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 order-1 sm:order-2"
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};