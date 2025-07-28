"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Search,
  Package,
  Edit,
  Trash,
  AlertTriangle,
  Calendar,
  Eye,
  Minus,
  Scan,
  Menu,
  X,
  Filter
} from "lucide-react";

// Types based on your schema
interface ParentCategory {
  parent_category_id: number;
  parent_category_name: string;
  description: string;
}

interface SubCategory {
  sub_category_id: number;
  sub_category_name: string;
  description: string;
  parent_category_id: number | null;
}

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
  sub_category?: SubCategory;
  supplier?: Supplier;
}

interface Batch {
  batch_id: number;
  item_id: number;
  current_stock: number;
  minimum_stock: number;
  expiry_date: string;
  stock_date: string;
}

// Mock data
const mockParentCategories: ParentCategory[] = [
  { parent_category_id: 1, parent_category_name: "Medical Supplies", description: "All medical and surgical supplies" },
  { parent_category_id: 2, parent_category_name: "Office Supplies", description: "General office and administrative supplies" },
  { parent_category_id: 3, parent_category_name: "Cleaning Supplies", description: "Sanitization and cleaning materials" },
];

const mockSubCategories: SubCategory[] = [
  { sub_category_id: 1, sub_category_name: "Dental Tools", description: "Dental instruments and tools", parent_category_id: 1 },
  { sub_category_id: 2, sub_category_name: "Disposables", description: "Single-use medical items", parent_category_id: 1 },
  { sub_category_id: 3, sub_category_name: "Stationery", description: "Paper and writing materials", parent_category_id: 2 },
  { sub_category_id: 4, sub_category_name: "Disinfectants", description: "Chemical cleaning agents", parent_category_id: 3 },
];

const mockSuppliers: Supplier[] = [
  {
    supplier_id: 1,
    company_name: "MedTech Solutions",
    contact_person: "John Smith",
    email: "john@medtech.com",
    phone_number: "+1-555-0123",
    address: "123 Medical Ave",
    city: "New York",
    state: "NY",
    postal_code: "10001",
    country: "USA",
    website: "www.medtech.com",
    notes: "Reliable medical supplier",
    status: "Active"
  },
  {
    supplier_id: 2,
    company_name: "Office Pro",
    contact_person: "Sarah Johnson",
    email: "sarah@officepro.com",
    phone_number: "+1-555-0456",
    address: "456 Business St",
    city: "Los Angeles",
    state: "CA",
    postal_code: "90001",
    country: "USA",
    website: "www.officepro.com",
    notes: "Office supplies specialist",
    status: "Active"
  },
];

const mockItems: Item[] = [
  {
    item_id: 1,
    item_name: "Dental Probe",
    unit_of_measurements: "pieces",
    unit_price: 15.99,
    storage_location: "Cabinet A1",
    barcode: "DEN001",
    expiry_alert_days: 30,
    description: "Stainless steel dental probe",
    sub_category_id: 1,
    supplier_id: 1,
    batch_tracking: false,
  },
  {
    item_id: 2,
    item_name: "Disposable Gloves",
    unit_of_measurements: "boxes",
    unit_price: 12.50,
    storage_location: "Storage Room B",
    barcode: "GLV001",
    expiry_alert_days: 60,
    description: "Latex-free disposable gloves",
    sub_category_id: 2,
    supplier_id: 1,
    batch_tracking: true,
  },
  {
    item_id: 3,
    item_name: "Copy Paper",
    unit_of_measurements: "reams",
    unit_price: 8.99,
    storage_location: "Office Storage",
    barcode: "PAP001",
    expiry_alert_days: 0,
    description: "A4 white copy paper",
    sub_category_id: 3,
    supplier_id: 2,
    batch_tracking: false,
  },
];

const mockBatches: Batch[] = [
  {
    batch_id: 1,
    item_id: 1,
    current_stock: 25,
    minimum_stock: 10,
    expiry_date: "2024-12-31",
    stock_date: "2024-01-15"
  },
  {
    batch_id: 2,
    item_id: 2,
    current_stock: 5,
    minimum_stock: 15,
    expiry_date: "2024-11-30",
    stock_date: "2024-02-01"
  },
  {
    batch_id: 3,
    item_id: 3,
    current_stock: 50,
    minimum_stock: 20,
    expiry_date: "",
    stock_date: "2024-03-01"
  },
];

const InventoryManagement = () => {
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>(mockParentCategories);
  const [subCategories, setSubCategories] = useState<SubCategory[]>(mockSubCategories);
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [items, setItems] = useState<Item[]>(mockItems);
  const [batches, setBatches] = useState<Batch[]>(mockBatches);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [currentView, setCurrentView] = useState<'items' | 'categories' | 'parent-categories'>('items');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Dialog states
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddParentCategoryOpen, setIsAddParentCategoryOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Form states
  const [newParentCategory, setNewParentCategory] = useState({
    parent_category_name: "",
    description: ""
  });

  // Get enriched items with category and supplier info
  const getEnrichedItems = () => {
    return items.map(item => {
      const subCategory = subCategories.find(cat => cat.sub_category_id === item.sub_category_id);
      const supplier = suppliers.find(sup => sup.supplier_id === item.supplier_id);
      const batch = batches.find(b => b.item_id === item.item_id);
      
      return {
        ...item,
        sub_category: subCategory,
        supplier: supplier,
        current_stock: batch?.current_stock || 0,
        minimum_stock: batch?.minimum_stock || 0,
      };
    });
  };

  const getStatusBadge = (currentStock: number, minimumStock: number) => {
    if (currentStock === 0) {
      return <Badge variant="destructive" className="text-xs">Out of Stock</Badge>;
    } else if (currentStock <= minimumStock) {
      return <Badge variant="secondary" className="text-xs">Low Stock</Badge>;
    } else {
      return <Badge variant="default" className="text-xs">In Stock</Badge>;
    }
  };

  const getParentCategoryName = (subCategoryId: number | null) => {
    if (!subCategoryId) return "Uncategorized";
    const subCategory = subCategories.find(cat => cat.sub_category_id === subCategoryId);
    if (!subCategory) return "Uncategorized";
    const parentCategory = parentCategories.find(parent => parent.parent_category_id === subCategory.parent_category_id);
    return parentCategory?.parent_category_name || "Uncategorized";
  };

  const filteredItems = getEnrichedItems().filter((item) => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || item.sub_category_id?.toString() === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleView = (item: Item) => {
    setSelectedItem(item);
    setIsViewOpen(true);
  };

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    setIsEditOpen(true);
  };

  const handleDelete = (item: Item) => {
    setSelectedItem(item);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (selectedItem) {
      setItems(items.filter(item => item.item_id !== selectedItem.item_id));
      setBatches(batches.filter(batch => batch.item_id !== selectedItem.item_id));
      setIsDeleteConfirmOpen(false);
      setSelectedItem(null);
    }
  };

  const handleAddParentCategory = () => {
    if (newParentCategory.parent_category_name.trim()) {
      const newId = Math.max(...parentCategories.map(cat => cat.parent_category_id)) + 1;
      setParentCategories([...parentCategories, {
        parent_category_id: newId,
        parent_category_name: newParentCategory.parent_category_name.trim(),
        description: newParentCategory.description.trim()
      }]);
      setNewParentCategory({ parent_category_name: "", description: "" });
      setIsAddParentCategoryOpen(false);
    }
  };

  const handleDeleteParentCategory = (categoryId: number) => {
    // Check if any sub-categories use this parent
    const hasSubCategories = subCategories.some(sub => sub.parent_category_id === categoryId);
    if (hasSubCategories) {
      alert("Cannot delete category with sub-categories. Please delete sub-categories first.");
      return;
    }
    setParentCategories(parentCategories.filter(cat => cat.parent_category_id !== categoryId));
  };

  const handleDeleteSubCategory = (categoryId: number) => {
    // Check if any items use this category
    const hasItems = items.some(item => item.sub_category_id === categoryId);
    if (hasItems) {
      alert("Cannot delete category with items. Please reassign items first.");
      return;
    }
    setSubCategories(subCategories.filter(cat => cat.sub_category_id !== categoryId));
  };

  const addItem = (formData: FormData) => {
    const newId = Math.max(...items.map(item => item.item_id)) + 1;
    const newItem: Item = {
      item_id: newId,
      item_name: formData.get('item_name') as string,
      unit_of_measurements: formData.get('unit_of_measurements') as string,
      unit_price: parseFloat(formData.get('unit_price') as string),
      storage_location: formData.get('storage_location') as string,
      barcode: formData.get('barcode') as string,
      expiry_alert_days: parseInt(formData.get('expiry_alert_days') as string),
      description: formData.get('description') as string,
      sub_category_id: parseInt(formData.get('sub_category_id') as string) || null,
      supplier_id: parseInt(formData.get('supplier_id') as string) || null,
      batch_tracking: formData.get('batch_tracking') === 'on',
    };

    setItems([...items, newItem]);

    // Add initial batch
    const newBatchId = Math.max(...batches.map(batch => batch.batch_id)) + 1;
    const newBatch: Batch = {
      batch_id: newBatchId,
      item_id: newId,
      current_stock: parseInt(formData.get('current_stock') as string) || 0,
      minimum_stock: parseInt(formData.get('minimum_stock') as string) || 0,
      expiry_date: formData.get('expiry_date') as string || "",
      stock_date: new Date().toISOString().split('T')[0]
    };

    setBatches([...batches, newBatch]);
    setIsAddItemOpen(false);
  };

  const addSubCategory = (formData: FormData) => {
    const newId = Math.max(...subCategories.map(cat => cat.sub_category_id)) + 1;
    const newCategory: SubCategory = {
      sub_category_id: newId,
      sub_category_name: formData.get('sub_category_name') as string,
      description: formData.get('description') as string,
      parent_category_id: parseInt(formData.get('parent_category_id') as string) || null,
    };

    setSubCategories([...subCategories, newCategory]);
    setIsAddCategoryOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Manage your inventory items and categories</p>
        </div>

        <Tabs value={currentView} onValueChange={(value: any) => setCurrentView(value)}>
          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
              <div className="bg-white w-64 h-full p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <TabsList className="flex flex-col h-auto w-full space-y-2">
                  <TabsTrigger 
                    value="items" 
                    className="w-full justify-start"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Items
                  </TabsTrigger>
                  <TabsTrigger 
                    value="categories" 
                    className="w-full justify-start"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Categories
                  </TabsTrigger>
                  <TabsTrigger 
                    value="parent-categories" 
                    className="w-full justify-start"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Parent Categories
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          )}

          {/* Desktop Tabs */}
          <TabsList className="hidden lg:grid w-full grid-cols-3">
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="parent-categories">Parent Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4">
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button 
                onClick={() => setIsAddItemOpen(true)} 
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Item
              </Button>
            </div>

            {/* Search and Filter */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full lg:w-[200px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {subCategories.map((category) => (
                        <SelectItem key={category.sub_category_id} value={category.sub_category_id.toString()}>
                          {category.sub_category_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <Card key={item.item_id} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg truncate">{item.item_name}</CardTitle>
                        <CardDescription className="text-sm">
                          {item.sub_category?.sub_category_name || "Uncategorized"}
                        </CardDescription>
                      </div>
                      {getStatusBadge(item.current_stock, item.minimum_stock)}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stock:</span>
                        <span className="font-medium">{item.current_stock} {item.unit_of_measurements}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Min. Stock:</span>
                        <span className="font-medium">{item.minimum_stock} {item.unit_of_measurements}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-medium">${item.unit_price}</span>
                      </div>
                      {item.supplier && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Supplier:</span>
                          <span className="font-medium truncate ml-2">{item.supplier.company_name}</span>
                        </div>
                      )}
                      {item.barcode && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Barcode:</span>
                          <span className="font-medium">{item.barcode}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardContent className="pt-0">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => handleView(item)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(item)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No items found. Try adjusting your search or filters.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-2">
                <CardTitle>Sub Categories</CardTitle>
                <Button 
                  onClick={() => setIsAddCategoryOpen(true)} 
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {subCategories.map((category) => (
                    <Card key={category.sub_category_id} className="flex flex-col">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg">{category.sub_category_name}</CardTitle>
                            <CardDescription>
                              Parent: {getParentCategoryName(category.sub_category_id)}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSubCategory(category.sub_category_id)}
                            className="text-red-500 hover:text-red-600 flex-shrink-0"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      {category.description && (
                        <CardContent className="pb-2">
                          <p className="text-sm text-gray-600">{category.description}</p>
                        </CardContent>
                      )}
                      <CardContent>
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">Items in this category:</h4>
                          <div className="max-h-32 overflow-y-auto">
                            {items.filter(item => item.sub_category_id === category.sub_category_id).length > 0 ? (
                              <ul className="list-disc list-inside space-y-1">
                                {items
                                  .filter(item => item.sub_category_id === category.sub_category_id)
                                  .map(item => {
                                    const batch = batches.find(b => b.item_id === item.item_id);
                                    return (
                                      <li key={item.item_id} className="text-sm">
                                        {item.item_name} ({batch?.current_stock || 0} {item.unit_of_measurements})
                                      </li>
                                    );
                                  })}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500">No items in this category</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parent-categories">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-2">
                <CardTitle>Parent Categories</CardTitle>
                <Button 
                  onClick={() => setIsAddParentCategoryOpen(true)} 
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Parent Category
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {parentCategories.map((category) => {
                    const subCategoriesCount = subCategories.filter(
                      sub => sub.parent_category_id === category.parent_category_id
                    ).length;
                    
                    return (
                      <Card key={category.parent_category_id} className="flex flex-col">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg">{category.parent_category_name}</CardTitle>
                              <CardDescription>
                                {subCategoriesCount} sub-categories
                              </CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteParentCategory(category.parent_category_id)}
                              className="text-red-500 hover:text-red-600 flex-shrink-0"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        {category.description && (
                          <CardContent className="pb-2">
                            <p className="text-sm text-gray-600">{category.description}</p>
                          </CardContent>
                        )}
                        <CardContent>
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Sub-categories:</h4>
                            <div className="max-h-32 overflow-y-auto">
                              {subCategoriesCount > 0 ? (
                                <ul className="list-disc list-inside space-y-1">
                                  {subCategories
                                    .filter(sub => sub.parent_category_id === category.parent_category_id)
                                    .map(subCategory => {
                                      const itemCount = items.filter(item => item.sub_category_id === subCategory.sub_category_id).length;
                                      return (
                                        <li key={subCategory.sub_category_id} className="text-sm">
                                          {subCategory.sub_category_name} ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                                        </li>
                                      );
                                    })}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-500">No sub-categories</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        
        {/* Add Item Dialog */}
        <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>Add a new item to your inventory</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              addItem(new FormData(form));
            }} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="item_name">Item Name *</Label>
                <Input name="item_name" required placeholder="Enter item name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub_category_id">Category *</Label>
                <Select name="sub_category_id" required>
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
                <Input name="current_stock" type="number" min="0" required placeholder="Enter current stock" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimum_stock">Minimum Stock *</Label>
                <Input name="minimum_stock" type="number" min="0" required placeholder="Enter minimum stock" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_of_measurements">Unit of Measurement</Label>
                <Input name="unit_of_measurements" placeholder="e.g., pieces, boxes" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_price">Unit Price ($)</Label>
                <Input name="unit_price" type="number" step="0.01" min="0" placeholder="Enter unit price" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier_id">Supplier</Label>
                <Select name="supplier_id">
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
                <Input name="storage_location" placeholder="Enter storage location" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode/SKU</Label>
                <Input name="barcode" placeholder="Enter barcode or SKU" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry_alert_days">Expiry Alert Days</Label>
                <Input name="expiry_alert_days" type="number" min="0" placeholder="Default: 30 days" defaultValue={30} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input name="expiry_date" type="date" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea name="description" placeholder="Enter item description" />
              </div>
              <div className="md:col-span-2 flex items-center space-x-2">
                <Switch name="batch_tracking" />
                <Label htmlFor="batch_tracking">Enable batch tracking for this item</Label>
              </div>
              <div className="md:col-span-2 flex flex-col sm:flex-row justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddItemOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  Add Item
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Sub Category Dialog */}
        <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Sub Category</DialogTitle>
              <DialogDescription>
                Create a new sub category for organizing inventory items
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              addSubCategory(new FormData(form));
            }}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sub_category_name">Category Name *</Label>
                  <Input id="sub_category_name" name="sub_category_name" required placeholder="Enter category name" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="Enter category description" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent_category_id">Parent Category</Label>
                  <Select name="parent_category_id" required>
                    <SelectTrigger>
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

                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddCategoryOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    Add Category
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Parent Category Dialog */}
        <Dialog open={isAddParentCategoryOpen} onOpenChange={setIsAddParentCategoryOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Parent Category</DialogTitle>
              <DialogDescription>
                Create a new parent category for organizing inventory items
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleAddParentCategory(); }}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="parent_category_name">Category Name</Label>
                  <Input
                    id="parent_category_name"
                    value={newParentCategory.parent_category_name}
                    onChange={(e) => setNewParentCategory(prev => ({ ...prev, parent_category_name: e.target.value }))}
                    placeholder="Enter category name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newParentCategory.description}
                    onChange={(e) => setNewParentCategory(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter category description"
                  />
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddParentCategoryOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    Add Parent Category
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Item Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>View Item Details</DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Item Name</Label>
                    <p className="text-sm font-medium">{selectedItem.item_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Description</Label>
                    <p className="text-sm">{selectedItem.description || 'No description'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Category</Label>
                    <p className="text-sm">{subCategories.find(cat => cat.sub_category_id === selectedItem.sub_category_id)?.sub_category_name || 'Uncategorized'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Unit Price</Label>
                    <p className="text-sm">${selectedItem.unit_price}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Unit of Measurement</Label>
                    <p className="text-sm">{selectedItem.unit_of_measurements}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Current Stock</Label>
                    <p className="text-sm">{batches.find(b => b.item_id === selectedItem.item_id)?.current_stock || 0} {selectedItem.unit_of_measurements}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Minimum Stock</Label>
                    <p className="text-sm">{batches.find(b => b.item_id === selectedItem.item_id)?.minimum_stock || 0} {selectedItem.unit_of_measurements}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Storage Location</Label>
                    <p className="text-sm">{selectedItem.storage_location || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Barcode</Label>
                    <p className="text-sm">{selectedItem.barcode || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Supplier</Label>
                    <p className="text-sm">{suppliers.find(sup => sup.supplier_id === selectedItem.supplier_id)?.company_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Batch Tracking</Label>
                    <p className="text-sm">{selectedItem.batch_tracking ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Item Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
              <DialogDescription>Edit the details for this inventory item</DialogDescription>
            </DialogHeader>
            {selectedItem && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const formData = new FormData(form);
                  
                  // Update item
                  const updatedItem: Item = {
                    ...selectedItem,
                    item_name: formData.get('item_name') as string,
                    description: formData.get('description') as string,
                    sub_category_id: parseInt(formData.get('sub_category_id') as string) || null,
                    unit_price: parseFloat(formData.get('unit_price') as string),
                    unit_of_measurements: formData.get('unit_of_measurements') as string,
                    supplier_id: parseInt(formData.get('supplier_id') as string) || null,
                    barcode: formData.get('barcode') as string,
                    batch_tracking: formData.get('batch_tracking') === 'on',
                    expiry_alert_days: parseInt(formData.get('expiry_alert_days') as string) || 30,
                    storage_location: formData.get('storage_location') as string,
                  };

                  setItems(items.map(item => item.item_id === selectedItem.item_id ? updatedItem : item));

                  // Update batch
                  const updatedBatch = batches.find(b => b.item_id === selectedItem.item_id);
                  if (updatedBatch) {
                    const newBatch: Batch = {
                      ...updatedBatch,
                      current_stock: parseInt(formData.get('current_stock') as string) || 0,
                      minimum_stock: parseInt(formData.get('minimum_stock') as string) || 0,
                    };
                    setBatches(batches.map(batch => batch.batch_id === updatedBatch.batch_id ? newBatch : batch));
                  }

                  setIsEditOpen(false);
                  setSelectedItem(null);
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="item_name">Item Name *</Label>
                  <Input name="item_name" defaultValue={selectedItem.item_name || ''} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sub_category_id">Category *</Label>
                  <Select name="sub_category_id" defaultValue={selectedItem.sub_category_id?.toString() || ''} required>
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
                  <Input name="current_stock" type="number" defaultValue={batches.find(b => b.item_id === selectedItem.item_id)?.current_stock || 0} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimum_stock">Minimum Stock *</Label>
                  <Input name="minimum_stock" type="number" defaultValue={batches.find(b => b.item_id === selectedItem.item_id)?.minimum_stock || 0} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_of_measurements">Unit of Measurement</Label>
                  <Input name="unit_of_measurements" defaultValue={selectedItem.unit_of_measurements || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_price">Unit Price ($)</Label>
                  <Input name="unit_price" type="number" step="0.01" defaultValue={selectedItem.unit_price || 0} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier_id">Supplier</Label>
                  <Select name="supplier_id" defaultValue={selectedItem.supplier_id?.toString() || ''}>
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
                  <Input name="storage_location" defaultValue={selectedItem.storage_location || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode/SKU</Label>
                  <Input name="barcode" defaultValue={selectedItem.barcode || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry_alert_days">Expiry Alert Days</Label>
                  <Input name="expiry_alert_days" type="number" defaultValue={selectedItem.expiry_alert_days || 30} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea name="description" defaultValue={selectedItem.description || ''} />
                </div>
                <div className="md:col-span-2 flex items-center space-x-2">
                  <Switch name="batch_tracking" defaultChecked={!!selectedItem.batch_tracking} />
                  <Label htmlFor="batch_tracking">Enable batch tracking for this item</Label>
                </div>
                <div className="md:col-span-2 flex flex-col sm:flex-row justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    Save Changes
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Item</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this item? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="font-medium text-red-800">
                      Delete "{selectedItem.item_name}"?
                    </span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">
                    This will permanently remove the item and all associated batch information.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDeleteConfirmOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={confirmDelete}
                    className="w-full sm:w-auto"
                  >
                    Delete Item
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default InventoryManagement;