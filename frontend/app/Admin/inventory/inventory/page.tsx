"use client";
import React, { useState, useEffect, useContext } from "react";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  Filter,
  Loader,
  Layers,
  CalendarDays as CalendarDaysIcon,
  Truck,
  Barcode
} from "lucide-react";
import { AddItemDialog } from "@/components/inventory/AddItemDialog";
import { AddCategoryDialog } from "@/components/inventory/AddCategoryDialog";
import { AddParentCategoryDialog } from "@/components/inventory/AddParentCategoryDialog";
import { BarcodeScanner } from "@/components/inventory/BarcodeScanner";
import { StockOutDialog } from "@/components/inventory/StockOutDialog";
import { AuthContext } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ItemCard from "@/components/ItemCard";

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

const InventoryManagement = () => {
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [items, setItems] = useState<Item[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

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
  const [selectedItem, setSelectedItem] = useState<Item | undefined>(undefined);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | undefined>(undefined);
  const [isStockOutOpen, setIsStockOutOpen] = useState(false);

  const { isLoadingAuth, isLoggedIn, user, apiClient } = useContext(AuthContext);
  const router = useRouter();

  const [loadingParentCategories, setLoadingParentCategories] = useState(false);
  const [submittingNewParentCategory, setSubmittingNewParentCategory] = useState(false);
  const [deletingParentCategory, setDeletingParentCategory] = useState(false);
  const [deletingParentID, setDeletingParentID] = useState(0);

  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [submittingNewSubCategory, setSubmittingNewSubCategory] = useState(false);
  const [deletingSubCategory, setDeletingSubCategory] = useState(false);
  const [deletingSubID, setDeletingSubID] = useState(0);


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

      // Safely find batch by checking if batch and its item exist
      const batch = batches.find(b => b && b.item && b.item.item_id === item.item_id);

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
    setIsAddItemOpen(true);
  };

  const handleUpdateItem = async (item: Item, batch: Batch) => {
  };

  const handleDelete = (item: Item) => {
    setSelectedItem(item);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;

    try {
      // First delete all batches for this item
      const itemBatches = batches.filter(b => b.item.item_id === selectedItem.item_id);
      await Promise.all(
        itemBatches.map(batch =>
          apiClient.delete(`/inventory/batches/${batch.batch_id}`)
        )
      );

      // Then delete the item
      await apiClient.delete(`/inventory/items/${selectedItem.item_id}`);

      // Update local state
      setItems(items.filter(item => item.item_id !== selectedItem.item_id));
      setBatches(batches.filter(batch => batch.item.item_id !== selectedItem.item_id));

      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    } finally {
      setIsDeleteConfirmOpen(false);
      setSelectedItem(undefined);
    }
  };

  const handleAddParentCategory = async (category: any) => {
    setSubmittingNewParentCategory(true);
    try {
      const response = await apiClient.post(
        `/inventory/parent-categories`, category
      );
      if (response.status != 201) {
        throw new Error("Error Submitting New Parent Category");
      }
      setParentCategories([...parentCategories, response.data]);
    }
    catch (error: any) {
      toast.error(error.message);
    }
    finally {
      setSubmittingNewParentCategory(false);
      setNewParentCategory({ parent_category_name: "", description: "" });
      setIsAddParentCategoryOpen(false);

    }
  };

  const handleDeleteParentCategory = async (categoryId: number) => {
    const hasSubCategories = subCategories.some(sub => sub.parent_category_id === categoryId);
    if (hasSubCategories) {
      toast.error("Cannot delete category", { description: "Please delete sub-categories first." });
      return;
    }
    setDeletingParentCategory(true);
    setDeletingParentID(categoryId);
    try {
      const response = await apiClient.delete(
        `/inventory/parent-categories/${categoryId}`
      );
      if (response.status == 500) {
        throw new Error("Error Deleting Parent Category");
      }
      setParentCategories(parentCategories.filter(cat => cat.parent_category_id !== categoryId));
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setDeletingParentCategory(false);
      setDeletingParentID(0);
    }
  };

  const handleDeleteSubCategory = async (categoryId: number) => {
    const hasItems = items.some(item => item.sub_category_id === categoryId);
    if (hasItems) {
      toast.error("Error Deleting Category.", { description: "Please Assign items belong to this category before deleting" });
      return;
    }
    setDeletingSubCategory(true);
    setDeletingSubID(categoryId);
    try {
      const response = await apiClient.delete(
        `/inventory/sub-categories/${categoryId}`
      );
      if (response.status == 500) {
        throw new Error("Error Deleting the Sub Category");
      }
      setSubCategories(subCategories.filter(cat => cat.sub_category_id !== categoryId));
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setDeletingSubCategory(false);
      setDeletingSubID(0);
    }
  };

  const addSubCategory = async (category: any) => {
    setSubmittingNewSubCategory(true);
    try {
      const response = await apiClient.post(
        `/inventory/sub-categories`, category
      );
      if (response.status != 201) {
        throw new Error("Error Creating New Sub Category");
      }
      setSubCategories([...subCategories, response.data]);
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setSubmittingNewSubCategory(false);
    }
    setIsAddCategoryOpen(false);
  };

  const handleScanResult = (code: string) => {
    // Find item with matching barcode
    const item = items.find(item => item.barcode === code);
    if (item) {
      setSelectedItem(item);
      setScannedBarcode(undefined);
      setIsAddItemOpen(true);
    } else {
      // If no item found, open add item dialog with barcode pre-filled
      setSelectedItem(undefined);
      setScannedBarcode(code);
      setIsAddItemOpen(true);
    }
  };

  const handleStockOut = (item: Item) => {
    setSelectedItem(item);
    setIsStockOutOpen(true);
  };

  const handleStockUpdate = (itemId: number, newStock: number) => {
    setBatches(batches.map(batch =>
      batch.item.item_id === itemId
        ? { ...batch, current_stock: newStock, stock_date: batch.stock_date || new Date().toISOString().split('T')[0] }
        : batch
    ));
  };

  const fetchParentCategories = async () => {
    setLoadingParentCategories(true);
    try {
      const response = await apiClient.get(
        `/inventory/parent-categories`
      );
      if (response.status == 500) {
        throw new Error("Error fetching parent categories");
      }
      setParentCategories(response.data);
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setLoadingParentCategories(false);
    }
  };

  const fetchSubCategories = async () => {
    setLoadingSubCategories(true);
    try {
      const response = await apiClient.get(
        `/inventory/sub-categories`
      );
      if (response.status == 500) {
        throw new Error("Error fetching sub categories");
      }
      setSubCategories(response.data);
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setLoadingSubCategories(false);
    }
  }

  const fetchItems = async () => {
    try {
      const [itemsRes, batchesRes] = await Promise.all([
        apiClient.get('/inventory/items'),
        apiClient.get('/inventory/batches')
      ]);

      setItems(itemsRes.data);
      setBatches(batchesRes.data);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      toast.error('Failed to load inventory data');
    }
  };

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isLoggedIn) {
      toast.error("Please Log in");
      router.push("/");
    }
    else if (user.role != "admin") {
      toast.error("Access Denied");
      router.push("/");
    }
  }, []);

  useEffect(() => {
    fetchParentCategories();
    fetchSubCategories();
    fetchItems();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pd-6 space-y-4">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
          <p className="text-gray-600 mt-1">Manage your inventory items and categories</p>
        </div>

        <Tabs value={currentView} onValueChange={(value: any) => setCurrentView(value)}>


          {/* Desktop Tabs */}
          <TabsList className="mb-2 grid gap-2 w-full grid-cols-3">
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="categories">{loadingSubCategories ? <Loader /> : 'Sub Categories'}</TabsTrigger>
            <TabsTrigger value="parent-categories">{loadingParentCategories ? <Loader /> : 'Parent Categories'}</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4">
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button
                onClick={() => setIsScannerOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto"
              >
                <Scan className="h-4 w-4 mr-2" />
                Scan Item
              </Button>
              <Button
                onClick={() => {
                  setSelectedItem(undefined);
                  setIsAddItemOpen(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto"
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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                      <SelectItem value="all">
                        {loadingSubCategories ? <Loader /> : "All Categories"}
                      </SelectItem>
                      {subCategories.map(({ sub_category_id, sub_category_name }) => (
                        <SelectItem key={sub_category_id} value={sub_category_id.toString()}>
                          {sub_category_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.length ? (
                filteredItems.map((item) => {
                  const itemBatches = batches.filter(b => b.item.item_id === item.item_id);
                  const totalStock = itemBatches.reduce((sum, batch) => sum + (batch.current_stock || 0), 0);
                  const isLowStock = totalStock <= (itemBatches[0]?.minimum_stock || item.minimum_stock);

                  return (
                    <ItemCard
                      key={item.item_id}
                      item={item}
                      itemBatches={itemBatches}
                      totalStock={totalStock}
                      isLowStock={isLowStock}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onStockOut={handleStockOut}
                    />
                  );
                })
              ) : (
                <Card className="col-span-full">
                  <CardContent className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No items found. Try adjusting your search or filters.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-2">
                <CardTitle>Sub Categories</CardTitle>
                <Button
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto"
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
                            disabled={deletingSubCategory && deletingSubID === category.sub_category_id}
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSubCategory(category.sub_category_id)}
                            className="text-red-500 hover:text-red-600 flex-shrink-0"
                          >
                            {deletingSubCategory && deletingSubID === category.sub_category_id ? <Loader /> : <Trash className="h-4 w-4" />}
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
                                    const batch = batches.find(b => b.item.item_id === item.item_id);
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

          <TabsContent value="parent-categories" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-2">
                <CardTitle>Parent Categories</CardTitle>
                <Button
                  onClick={() => setIsAddParentCategoryOpen(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto"
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
                              disabled={deletingParentCategory && deletingParentID === category.parent_category_id}
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteParentCategory(category.parent_category_id)}
                              className="text-red-500 hover:text-red-600 flex-shrink-0"
                            >
                              {deletingParentCategory && deletingParentID === category.parent_category_id ? <Loader /> : <Trash className="h-4 w-4" />}
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
        <BarcodeScanner
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanResult={handleScanResult}
        />

        <AddItemDialog
          open={isAddItemOpen}
          onOpenChange={(open) => {
            setIsAddItemOpen(open);
            if (!open) {
              setScannedBarcode(undefined);
            }
          }}
          onSubmit={(item, batch) => {
            if (item) {
              handleUpdateItem(item, batch);
            } else {
              const newId = Math.max(...items.map(item => item.item_id)) + 1;
              const newItem = { ...item, item_id: newId };
              setItems([...items, newItem]);

              const newBatchId = Math.max(...batches.map(batch => batch.batch_id)) + 1;
              const newBatch = { ...batch, batch_id: newBatchId, item_id: newId };
              setBatches([...batches, newBatch]);
              setIsAddItemOpen(false);
              setScannedBarcode(undefined);
            }
          }}
          subCategories={subCategories}
          suppliers={suppliers}
          editItem={selectedItem}
          editBatch={selectedItem ? batches.find(b => b.item_id === selectedItem.item_id) : undefined}
          scannedBarcode={scannedBarcode}
        />

        <AddCategoryDialog
          onSubmitChange={submittingNewSubCategory}
          open={isAddCategoryOpen}
          onOpenChange={setIsAddCategoryOpen}
          onSubmit={(category) => { addSubCategory(category); }}
          parentCategories={parentCategories}
        />

        <AddParentCategoryDialog
          onSubmitChange={submittingNewParentCategory}
          open={isAddParentCategoryOpen}
          onOpenChange={setIsAddParentCategoryOpen}
          onSubmit={(category) => { handleAddParentCategory(category); }}
        />

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
                    <p className="text-sm">
                      {batches
                        .filter(b => b.item?.item_id === selectedItem.item_id)
                        .reduce((sum, batch) => sum + (batch.current_stock || 0), 0)} 
                      {selectedItem.unit_of_measurements}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Minimum Stock</Label>
                    <p className="text-sm">
                      {batches
                        .filter(b => b.item?.item_id === selectedItem.item_id)
                        .reduce((min, batch) => Math.min(min, batch.minimum_stock || 0), Number.MAX_SAFE_INTEGER) || 0} 
                      {selectedItem.unit_of_measurements}
                    </p>
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
                {selectedItem.batch_tracking && (
                  <div className="col-span-2 mt-4">
                    <Label className="text-sm font-medium mb-2 block">Batch Details</Label>
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Minimum Stock</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Date</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {batches
                            .filter(b => b.item?.item_id === selectedItem.item_id)
                            .map((batch) => (
                              <tr key={batch.batch_id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm text-gray-900">{batch.batch_id}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {batch.current_stock} {selectedItem.unit_of_measurements}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {batch.minimum_stock} {selectedItem.unit_of_measurements}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {new Date(batch.expiry_date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {new Date(batch.stock_date).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {batches.filter(b => b.item?.item_id === selectedItem.item_id).length === 0 && (
                        <p className="p-4 text-sm text-gray-500 text-center">No batch records found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
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

        <StockOutDialog
          isOpen={isStockOutOpen}
          onClose={() => {
            setIsStockOutOpen(false);
            setSelectedItem(undefined);
          }}
          item={selectedItem || null}
        
          batches={selectedItem ? batches.filter(b => b.item.item_id === selectedItem.item_id) : []}
          onUpdate={handleStockUpdate}
        />
      </div>
    </div>
  );
};

export default InventoryManagement;