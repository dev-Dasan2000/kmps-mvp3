"use client";
import React, { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Filter,
  Settings,
  Edit,
  Eye,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Archive,
  Trash2,
  Menu,
  X,
  Loader
} from "lucide-react";
import { AuthContext } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Types based on your schema
interface EquipmentCategory {
  equipment_category_id: number;
  equipment_category: string;
}

interface Equipment {
  equipment_id: number;
  equipment_name: string;
  equipment_category_id: number;
  brand: string;
  model: string;
  serial_number: string;
  purchase_date: string;
  purchase_price: number;
  location: string;
  warranty_start_date: string;
  warranty_end_date: string;
  status: string;
  notes: string;
  equipment_category?: EquipmentCategory;
  maintenances?: Maintenance[];
}

interface Maintenance {
  maintenance_id: number;
  equipment_id: number;
  maintain_type: string;
  maintenance_date: string;
  description: string;
  performed_by: string;
  cost: number;
  next_maintenance_date: string;
  notes: string;
}

const EquipmentManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewEquipmentData, setViewEquipmentData] = useState<Equipment | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editEquipmentData, setEditEquipmentData] = useState<Equipment | null>(null);
  const [isEditMaintenanceOpen, setIsEditMaintenanceOpen] = useState(false);
  const [editMaintenanceData, setEditMaintenanceData] = useState<Maintenance | null>(null);
  const [isDeleteMaintenanceOpen, setIsDeleteMaintenanceOpen] = useState(false);
  const [deleteMaintenanceData, setDeleteMaintenanceData] = useState<Maintenance | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { isLoadingAuth, isLoggedIn, apiClient, user } = useContext(AuthContext);
  const router = useRouter();

  const [loadingEquipment, setLoadingEquipment] = useState(true);
  const [updatingEquipment, setUpdatingEquipment] = useState(false);
  const [addingEquipment, setAddingEquipment] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [addingMaintenance, setAddingMaintenance] = useState(false);
  const [updatingMaintenance, setUpdatingMaintenance] = useState(false);
  const [deletingMaintenance, setDeletingMaintenance] = useState(false);

  const addEquipment = async (formData: any) => {
    setAddingEquipment(true);
    try {
      const newEquipment: Equipment = {
        equipment_id: Math.max(...equipment.map(e => e.equipment_id)) + 1,
        equipment_name: formData.name,
        equipment_category_id: parseInt(formData.category),
        brand: formData.brand,
        model: formData.model,
        serial_number: formData.serialNumber,
        purchase_date: formData.purchaseDate,
        purchase_price: parseFloat(formData.purchasePrice) || 0,
        location: formData.location,
        warranty_start_date: formData.warrantyStart,
        warranty_end_date: formData.warrantyEnd,
        status: "active",
        notes: formData.notes,
        equipment_category: categories.find(c => c.equipment_category_id === parseInt(formData.category)),
        maintenances: []
      };

      const payload = {
        equipment_name: newEquipment.equipment_name,
        equipment_category_id: newEquipment.equipment_category_id,
        brand: newEquipment.brand,
        model: newEquipment.model,
        serial_number: newEquipment.serial_number,
        purchase_date: newEquipment.purchase_date,
        purchase_price: newEquipment.purchase_price,
        location: newEquipment.location,
        warranty_start_date: newEquipment.warranty_start_date,
        warranty_end_date: newEquipment.warranty_end_date,
        status: newEquipment.status,
        notes: newEquipment.notes,
      };

      const res = await apiClient.post(
        `/inventory/equipments`, payload
      );
      if (res.status != 201) {
        throw new Error("Error Adding New Equipment");
      }

      setEquipment([...equipment, res.data]);
      toast.success("Equipement added succesfully");
      setIsAddOpen(false);
    } catch (error: any) {
      toast.error(`Failed to add equipment: ${error.message}`)
    }
    finally {
      setAddingEquipment(false);
    }
  };

  const updateEquipment = async (formData: any) => {
    try {
      if (!editEquipmentData) return;

      const updatedEquipment = equipment.map(e =>
        e.equipment_id === editEquipmentData.equipment_id
          ? {
            ...e,
            equipment_name: formData.name,
            equipment_category_id: parseInt(formData.category),
            brand: formData.brand,
            model: formData.model,
            serial_number: formData.serialNumber,
            purchase_date: formData.purchaseDate,
            purchase_price: parseFloat(formData.purchasePrice) || 0,
            location: formData.location,
            warranty_start_date: formData.warrantyStart,
            warranty_end_date: formData.warrantyEnd,
            status: formData.status,
            notes: formData.notes,
            equipment_category: categories.find(c => c.equipment_category_id === parseInt(formData.category))
          }
          : e
      );

      const updatedData = {
        equipment_name: formData.name,
        equipment_category_id: parseInt(formData.category),
        brand: formData.brand,
        model: formData.model,
        serial_number: formData.serialNumber,
        purchase_date: formData.purchaseDate,
        purchase_price: parseFloat(formData.purchasePrice) || 0,
        location: formData.location,
        warranty_start_date: formData.warrantyStart,
        warranty_end_date: formData.warrantyEnd,
        status: formData.status,
        notes: formData.notes,
      };

      setUpdatingEquipment(true);
      const res = await apiClient.put(
        `/inventory/equipments/${editEquipmentData.equipment_id}`, updatedData
      );
      if (res.status != 202) {
        throw new Error("Error Updating Equioment");
      }

      setEquipment(updatedEquipment);
      toast.success("Equipment updated successfully");
      setIsEditOpen(false);
      setEditEquipmentData(null);
    } catch (error: any) {
      toast.success(`Failed to update equipment: ${error.message}`);
    }
    finally {
      setUpdatingEquipment(false);
    }
  };

  const addMaintenance = async (formData: any) => {
    setAddingMaintenance(true);
    try {
      if (!selectedEquipmentId) return;

      // Create maintenances object locally (with ID)
      const newMaintenance: Maintenance = {
        maintenance_id:
          Math.max(...equipment.flatMap(e => e.maintenances || []).map(m => m.maintenance_id), 0) + 1,
        equipment_id: selectedEquipmentId,
        maintain_type: formData.maintenanceType,
        maintenance_date: formData.maintenanceDate,
        description: formData.description,
        performed_by: formData.performedBy,
        cost: parseFloat(formData.cost) || 0,
        next_maintenance_date: formData.nextMaintenanceDate,
        notes: formData.notes
      };

      // Prepare payload without maintenance_id
      const payload = {
        equipment_id: newMaintenance.equipment_id,
        maintain_type: newMaintenance.maintain_type,
        maintenance_date: newMaintenance.maintenance_date,
        description: newMaintenance.description,
        performed_by: newMaintenance.performed_by,
        cost: newMaintenance.cost,
        next_maintenance_date: newMaintenance.next_maintenance_date,
        notes: newMaintenance.notes
      };

      const res = await apiClient.post(`/inventory/maintenance`, payload);

      if (res.status !== 201) {
        throw new Error("Error creating a maintenances record");
      }

      const updatedEquipment = equipment.map(e =>
        e.equipment_id === selectedEquipmentId
          ? { ...e, maintenances: [...(e.maintenances || []), res.data] }
          : e
      );

      setEquipment(updatedEquipment);
      toast.success("Maintenance record added successfully");
      setIsMaintenanceOpen(false);

      if (viewEquipmentData && selectedEquipmentId === viewEquipmentData.equipment_id) {
        const updatedViewData = updatedEquipment.find(e => e.equipment_id === selectedEquipmentId);
        if (updatedViewData) setViewEquipmentData(updatedViewData);
      }
    } catch (error: any) {
      toast.error(`Failed to add maintenances record: ${error.message}`);
    } finally {
      setAddingMaintenance(false);
    }
  };

  const updateMaintenance = async (formData: any) => {
    setUpdatingMaintenance(true);
    try {
      if (!editMaintenanceData) return;

      const updatedEquipment = equipment.map(e => ({
        ...e,
        maintenances: e.maintenances?.map(m =>
          m.maintenance_id === editMaintenanceData.maintenance_id
            ? {
              ...m,
              maintenance_date: formData.maintenanceDate,
              maintain_type: formData.maintenanceType,
              description: formData.description,
              performed_by: formData.performedBy,
              cost: parseFloat(formData.cost) || 0,
              next_maintenance_date: formData.nextMaintenanceDate,
              notes: formData.notes
            }
            : m
        )
      }));

      const res = await apiClient.put(
        `/inventory/maintenance/${editMaintenanceData.maintenance_id}`,
        {
          maintenance_date: formData.maintenanceDate,
          maintain_type: formData.maintenanceType,
          description: formData.description,
          performed_by: formData.performedBy,
          cost: parseFloat(formData.cost) || 0,
          next_maintenance_date: formData.nextMaintenanceDate,
          notes: formData.notes
        }
      );
      if(res.status != 202){
        throw new Error("Error Updating Maintence Record");
      }

      setEquipment(updatedEquipment);
      toast.success("Maintenance record updated");
      setIsEditMaintenanceOpen(false);
      setEditMaintenanceData(null);

      // Update view data
      if (viewEquipmentData) {
        const updatedViewData = updatedEquipment.find(e => e.equipment_id === viewEquipmentData.equipment_id);
        if (updatedViewData) setViewEquipmentData(updatedViewData);
      }
    } catch (error) {
      toast.success("Failed to update maintenances record");
    }
    finally{
      setUpdatingMaintenance(false);
    }
  };

  const deleteMaintenance = async () => {
    setDeletingMaintenance(true);
    try {
      if (!deleteMaintenanceData) return;

      const res = await apiClient.delete(
        `/inventory/maintenance/${deleteMaintenanceData.maintenance_id}`
      );

      if(res.status == 500){
        throw new Error("Error Deleting Maintenance Record");
      }

      const updatedEquipment = equipment.map(e => ({
        ...e,
        maintenances: e.maintenances?.filter(m => m.maintenance_id !== deleteMaintenanceData.maintenance_id)
      }));

      setEquipment(updatedEquipment);
      toast.success("Maintenance record deleted");
      setIsDeleteMaintenanceOpen(false);
      setDeleteMaintenanceData(null);

      if (viewEquipmentData) {
        const updatedViewData = updatedEquipment.find(e => e.equipment_id === viewEquipmentData.equipment_id);
        if (updatedViewData) setViewEquipmentData(updatedViewData);
      }
    } catch (error) {
      toast.success("Failed to delete maintenances record");
    }
    finally{
      setDeletingMaintenance(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      maintenance: { color: "bg-yellow-100 text-yellow-800", icon: Wrench },
      retired: { color: "bg-gray-100 text-gray-800", icon: Archive },
      disposed: { color: "bg-red-100 text-red-800", icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1 text-xs`}>
        <IconComponent className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const isWarrantyExpiring = (warrantyEndDate: string) => {
    if (!warrantyEndDate) return false;
    const today = new Date();
    const endDate = new Date(warrantyEndDate);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch = item.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || item.equipment_category_id.toString() === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const fetchEquipment = async () => {
    setLoadingEquipment(true);
    try {
      const res = await apiClient.get(
        `/inventory/equipments`
      );
      if (res.status == 500) {
        throw new Error("Error Fetching Equipment");
      }
      setEquipment(res.data);
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setLoadingEquipment(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await apiClient.get(
        `/inventory/equipment-categories`
      );
      if (res.status == 500) {
        throw new Error("Error Fetching Categories");
      }
      setCategories(res.data);
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setLoadingCategories(false);
    }
  }

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
  }, [isLoadingAuth]);

  useEffect(() => {
    fetchEquipment();
    fetchCategories();
  }, []);

  if (loading) {
    return <div className="p-4 sm:p-6">Loading...</div>;
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div>
        <h1 className="md:hidden text-2xl font-semibold text-gray-900">Equipment</h1>
      </div>

      <div className="pb-6 space-y-4">
        {/* Desktop Header */}
        <div className="hidden lg:flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Equipment & Assets</h1>
            <p className="text-gray-600 mt-1">Track dental equipment, maintenance, and warranties</p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Equipment</DialogTitle>
                <DialogDescription>
                  Register new dental equipment or asset
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                addEquipment({
                  name: formData.get('name'),
                  category: formData.get('category'),
                  brand: formData.get('brand'),
                  model: formData.get('model'),
                  serialNumber: formData.get('serialNumber'),
                  purchaseDate: formData.get('purchaseDate'),
                  purchasePrice: formData.get('purchasePrice'),
                  warrantyStart: formData.get('warrantyStart'),
                  warrantyEnd: formData.get('warrantyEnd'),
                  location: formData.get('location'),
                  notes: formData.get('notes')
                });
              }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Equipment Name *</Label>
                  <Input name="name" placeholder="e.g., Digital X-Ray Machine" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.equipment_category_id} value={cat.equipment_category_id.toString()}>
                          {cat.equipment_category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input name="brand" placeholder="Equipment brand" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input name="model" placeholder="Model number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input name="serialNumber" placeholder="Serial number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input name="purchaseDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price (Rs.)</Label>
                  <Input name="purchasePrice" type="number" step="0.01" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input name="location" placeholder="e.g., Room 101" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warrantyStart">Warranty Start</Label>
                  <Input name="warrantyStart" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warrantyEnd">Warranty End</Label>
                  <Input name="warrantyEnd" type="date" />
                </div>
                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea name="notes" placeholder="Additional notes..." />
                </div>
                <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto" disabled={addingEquipment}>
                    {addingEquipment ? <Loader /> : "Add Equipment"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Mobile Add Button */}
        <div className="lg:hidden">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Equipment</DialogTitle>
                <DialogDescription>
                  Register new dental equipment or asset
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                addEquipment({
                  name: formData.get('name'),
                  category: formData.get('category'),
                  brand: formData.get('brand'),
                  model: formData.get('model'),
                  serialNumber: formData.get('serialNumber'),
                  purchaseDate: formData.get('purchaseDate'),
                  purchasePrice: formData.get('purchasePrice'),
                  warrantyStart: formData.get('warrantyStart'),
                  warrantyEnd: formData.get('warrantyEnd'),
                  location: formData.get('location'),
                  notes: formData.get('notes')
                });
              }} className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Equipment Name *</Label>
                  <Input name="name" placeholder="e.g., Digital X-Ray Machine" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">{loadingCategories ? <Loader /> : "Category *"}</Label>
                  <Select disabled={loadingCategories} name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.equipment_category_id} value={cat.equipment_category_id.toString()}>
                          {cat.equipment_category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input name="brand" placeholder="Equipment brand" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input name="model" placeholder="Model number" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input name="serialNumber" placeholder="Serial number" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate">Purchase Date</Label>
                    <Input name="purchaseDate" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchasePrice">Purchase Price (Rs.)</Label>
                    <Input name="purchasePrice" type="number" step="0.01" placeholder="0.00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input name="location" placeholder="e.g., Room 101" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="warrantyStart">Warranty Start</Label>
                    <Input name="warrantyStart" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warrantyEnd">Warranty End</Label>
                    <Input name="warrantyEnd" type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea name="notes" placeholder="Additional notes..." />
                </div>
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                    Add Equipment
                  </Button>
                  
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent>
            <div className="flex flex-col md:flex-row md:gap-3 space-y-4">
              <div className="relative md:w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, brand, or serial number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 "
                />
              </div>
              <div className="grid grid-cols-2 gap-4 md:gap-0 text-sm ">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="md:hidden h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="disposed">Disposed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter} disabled={loadingCategories}>
                  <SelectTrigger>
                    <Settings className="md:hidden h-4 w-4" />
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{loadingCategories ? <Loader /> : "Categories"}</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.equipment_category_id} value={cat.equipment_category_id.toString()}>
                        {cat.equipment_category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredEquipment.map((item) => (
            <Card key={item.equipment_id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold truncate">
                      {item.equipment_name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {item.serial_number} • {item.equipment_category?.equipment_category}
                    </CardDescription>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  {item.brand && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Brand:</span>
                      <span className="font-medium truncate ml-2">{item.brand}</span>
                    </div>
                  )}
                  {item.model && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Model:</span>
                      <span className="font-medium truncate ml-2">{item.model}</span>
                    </div>
                  )}
                  {item.location && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium truncate ml-2">{item.location}</span>
                    </div>
                  )}
                  {item.purchase_price && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Value:</span>
                      <span className="font-medium">Rs. {item.purchase_price.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {item.warranty_end_date && (
                  <div className={`p-2 rounded text-xs ${isWarrantyExpiring(item.warranty_end_date)
                    ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                    : 'bg-gray-50 text-gray-600'
                    }`}>
                    <div className="flex items-center">
                      {isWarrantyExpiring(item.warranty_end_date) && <AlertTriangle className="h-3 w-3 mr-1" />}
                      Warranty expires: {new Date(item.warranty_end_date).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {(() => {
                  const maint = item.maintenances || [];
                  if (!maint.length) return null;
                  const last = maint.reduce((a, b) => a.maintenance_date > b.maintenance_date ? a : b);
                  const next = maint.filter(m => m.next_maintenance_date).sort((a, b) => a.next_maintenance_date.localeCompare(b.next_maintenance_date))[0];
                  return (
                    <div className="mt-2 text-xs text-gray-600 space-y-1">
                      <div>Last Maintenance: <span className="font-medium">{new Date(last.maintenance_date).toLocaleDateString()}</span></div>
                      {next && <div>Next Scheduled: <span className="font-medium">{new Date(next.next_maintenance_date).toLocaleDateString()}</span></div>}
                      <div>Total Records: <span className="font-medium">{maint.length}</span></div>
                    </div>
                  );
                })()}

                <div className="flex flex-row gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => {
                    setViewEquipmentData(item);
                    setIsViewOpen(true);
                  }}>
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => {
                    setEditEquipmentData(item);
                    setIsEditOpen(true);
                  }}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      setSelectedEquipmentId(item.equipment_id);
                      setIsMaintenanceOpen(true);
                    }}
                  >
                    <Wrench className="h-3 w-3 mr-1" />
                    Maintain
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Maintenance Dialog */}
        <Dialog open={isMaintenanceOpen} onOpenChange={setIsMaintenanceOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Maintenance Record</DialogTitle>
              <DialogDescription>
                Record maintenance activity for this equipment
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              addMaintenance({
                maintenanceType: formData.get('maintenanceType'),
                description: formData.get('description'),
                maintenanceDate: formData.get('maintenanceDate'),
                performedBy: formData.get('performedBy'),
                cost: formData.get('cost'),
                nextMaintenanceDate: formData.get('nextMaintenanceDate'),
                notes: formData.get('notes')
              });
            }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maintenanceType">Maintenance Type *</Label>
                  <Select name="maintenanceType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventive">Preventive</SelectItem>
                      <SelectItem value="corrective">Corrective</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenanceDate">Maintenance Date *</Label>
                  <Input name="maintenanceDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea name="description" placeholder="Describe the maintenance work performed..." required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="performedBy">Performed By</Label>
                  <Input name="performedBy" placeholder="Technician name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost (Rs.)</Label>
                  <Input name="cost" type="number" step="0.01" placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextMaintenanceDate">Next Maintenance Date</Label>
                <Input name="nextMaintenanceDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea name="notes" placeholder="Additional maintenance notes..." />
              </div>
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsMaintenanceOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto" disabled={addingMaintenance}>
                  {addingMaintenance ? <Loader /> : "Add Record"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Equipment Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="md:max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Equipment Details</DialogTitle>
              <DialogDescription>
                View all details for this equipment or asset
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <div className="p-2 bg-gray-50 rounded text-sm">{viewEquipmentData?.equipment_name || '-'}</div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <div className="p-2 bg-gray-50 rounded text-sm">{viewEquipmentData?.equipment_category?.equipment_category || '-'}</div>
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <div className="p-2 bg-gray-50 rounded text-sm">{viewEquipmentData?.brand || '-'}</div>
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <div className="p-2 bg-gray-50 rounded text-sm">{viewEquipmentData?.model || '-'}</div>
              </div>
              <div className="space-y-2">
                <Label>Serial Number</Label>
                <div className="p-2 bg-gray-50 rounded text-sm">{viewEquipmentData?.serial_number || '-'}</div>
              </div>
              <div className="space-y-2">
                <Label>Purchase Date</Label>
                <div className="p-2 bg-gray-50 rounded text-sm">{viewEquipmentData?.purchase_date ? new Date(viewEquipmentData.purchase_date).toLocaleDateString() : '-'}</div>
              </div>
              <div className="space-y-2">
                <Label>Purchase Price</Label>
                <div className="p-2 bg-gray-50 rounded text-sm">{viewEquipmentData?.purchase_price ? `Rs. ${viewEquipmentData.purchase_price.toLocaleString()}` : '-'}</div>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <div className="p-2 bg-gray-50 rounded text-sm">{viewEquipmentData?.location || '-'}</div>
              </div>
              <div className="space-y-2">
                <Label>Warranty Start</Label>
                <div className="p-2 bg-gray-50 rounded text-sm">{viewEquipmentData?.warranty_start_date ? new Date(viewEquipmentData.warranty_start_date).toLocaleDateString() : '-'}</div>
              </div>
              <div className="space-y-2">
                <Label>Warranty End</Label>
                <div className="p-2 bg-gray-50 rounded text-sm">{viewEquipmentData?.warranty_end_date ? new Date(viewEquipmentData.warranty_end_date).toLocaleDateString() : '-'}</div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="p-2 bg-gray-50 rounded text-sm flex items-center">
                  {viewEquipmentData?.status ? getStatusBadge(viewEquipmentData.status) : '-'}
                </div>
              </div>
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <Label>Notes</Label>
                <div className="p-2 bg-gray-50 rounded min-h-[40px] text-sm">{viewEquipmentData?.notes || '-'}</div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Maintenance History</h3>
              {Array.isArray(viewEquipmentData?.maintenances) && viewEquipmentData.maintenances.length > 0 ? (
                <div className="space-y-4">
                  {/* Mobile view - cards */}
                  <div className="block sm:hidden space-y-3">
                    {viewEquipmentData.maintenances.map((m) => (
                      <Card key={m.maintenance_id} className="p-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-start">
                            <span className="font-medium">{new Date(m.maintenance_date).toLocaleDateString()}</span>
                            <Badge variant="outline" className="text-xs">
                              {m.maintain_type}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-gray-600">Description:</span>
                            <p className="text-gray-900 mt-1">{m.description}</p>
                          </div>
                          {m.performed_by && (
                            <div>
                              <span className="text-gray-600">Performed by:</span>
                              <span className="ml-2 text-gray-900">{m.performed_by}</span>
                            </div>
                          )}
                          {m.cost > 0 && (
                            <div>
                              <span className="text-gray-600">Cost:</span>
                              <span className="ml-2 text-gray-900">Rs. {m.cost.toLocaleString()}</span>
                            </div>
                          )}
                          {m.next_maintenance_date && (
                            <div>
                              <span className="text-gray-600">Next maintenance:</span>
                              <span className="ml-2 text-gray-900">{new Date(m.next_maintenance_date).toLocaleDateString()}</span>
                            </div>
                          )}
                          {m.notes && (
                            <div>
                              <span className="text-gray-600">Notes:</span>
                              <p className="text-gray-900 mt-1">{m.notes}</p>
                            </div>
                          )}
                          <div className="flex space-x-2 pt-2">
                            <Button size="sm" variant="outline" onClick={() => { setEditMaintenanceData(m); setIsEditMaintenanceOpen(true); }} className="flex-1">
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setDeleteMaintenanceData(m); setIsDeleteMaintenanceOpen(true); }} className="flex-1 text-red-600 hover:text-red-700">
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop view - table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full text-sm border rounded-lg">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 text-left border-b">Date</th>
                          <th className="px-4 py-2 text-left border-b">Type</th>
                          <th className="px-4 py-2 text-left border-b">Description</th>
                          <th className="px-4 py-2 text-left border-b">Performed By</th>
                          <th className="px-4 py-2 text-left border-b">Cost</th>
                          <th className="px-4 py-2 text-left border-b">Next</th>
                          <th className="px-4 py-2 text-left border-b">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewEquipmentData.maintenances.map((m) => (
                          <tr key={m.maintenance_id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2">{new Date(m.maintenance_date).toLocaleDateString()}</td>
                            <td className="px-4 py-2">
                              <Badge variant="outline" className="text-xs">
                                {m.maintain_type}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 max-w-[200px]">
                              <div className="truncate" title={m.description}>
                                {m.description}
                              </div>
                            </td>
                            <td className="px-4 py-2">{m.performed_by || '-'}</td>
                            <td className="px-4 py-2">{m.cost > 0 ? `Rs. ${m.cost.toLocaleString()}` : '-'}</td>
                            <td className="px-4 py-2">{m.next_maintenance_date ? new Date(m.next_maintenance_date).toLocaleDateString() : '-'}</td>
                            <td className="px-4 py-2">
                              <div className="flex space-x-1">
                                <Button size="sm" variant="ghost" onClick={() => { setEditMaintenanceData(m); setIsEditMaintenanceOpen(true); }} title="Edit">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setDeleteMaintenanceData(m); setIsDeleteMaintenanceOpen(true); }} title="Delete" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">No maintenance records found.</div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <Button type="button" variant="outline" onClick={() => setIsViewOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Equipment Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Equipment</DialogTitle>
              <DialogDescription>
                Update equipment or asset details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              updateEquipment({
                name: formData.get('name'),
                category: formData.get('category'),
                brand: formData.get('brand'),
                model: formData.get('model'),
                serialNumber: formData.get('serialNumber'),
                purchaseDate: formData.get('purchaseDate'),
                purchasePrice: formData.get('purchasePrice'),
                warrantyStart: formData.get('warrantyStart'),
                warrantyEnd: formData.get('warrantyEnd'),
                location: formData.get('location'),
                notes: formData.get('notes'),
                status: formData.get('status'),
              });
            }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Equipment Name *</Label>
                <Input name="name" defaultValue={editEquipmentData?.equipment_name || ''} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select name="category" defaultValue={editEquipmentData?.equipment_category_id.toString() || ''} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.equipment_category_id} value={cat.equipment_category_id.toString()}>
                        {cat.equipment_category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input name="brand" defaultValue={editEquipmentData?.brand || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input name="model" defaultValue={editEquipmentData?.model || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input name="serialNumber" defaultValue={editEquipmentData?.serial_number || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input name="purchaseDate" type="date" defaultValue={editEquipmentData?.purchase_date || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price (Rs.)</Label>
                <Input name="purchasePrice" type="number" step="0.01" defaultValue={editEquipmentData?.purchase_price?.toString() || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input name="location" defaultValue={editEquipmentData?.location || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warrantyStart">Warranty Start</Label>
                <Input name="warrantyStart" type="date" defaultValue={editEquipmentData?.warranty_start_date || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warrantyEnd">Warranty End</Label>
                <Input name="warrantyEnd" type="date" defaultValue={editEquipmentData?.warranty_end_date || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select name="status" defaultValue={editEquipmentData?.status.toLocaleLowerCase()} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="disposed">Disposed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea name="notes" defaultValue={editEquipmentData?.notes || ''} />
              </div>
              <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto" disabled={updatingEquipment}>
                  {updatingEquipment ? <Loader /> : "Save Changes"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Maintenance Dialog */}
        <Dialog open={isEditMaintenanceOpen} onOpenChange={setIsEditMaintenanceOpen}>
          <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Maintenance Record</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              updateMaintenance({
                maintenanceDate: formData.get('maintenanceDate'),
                maintenanceType: formData.get('maintenanceType'),
                description: formData.get('description'),
                performedBy: formData.get('performedBy'),
                cost: formData.get('cost'),
                nextMaintenanceDate: formData.get('nextMaintenanceDate'),
                notes: formData.get('notes'),
              });
            }}>
              <div className="space-y-2">
                <Label htmlFor="maintenanceDate">Maintenance Date</Label>
                <Input name="maintenanceDate" type="date" defaultValue={editMaintenanceData?.maintenance_date || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenanceType">Maintenance Type</Label>
                <Select name="maintenanceType" defaultValue={editMaintenanceData?.maintain_type || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Preventive</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea name="description" defaultValue={editMaintenanceData?.description || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="performedBy">Performed By</Label>
                <Input name="performedBy" defaultValue={editMaintenanceData?.performed_by || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost (Rs.)</Label>
                <Input name="cost" type="number" step="0.01" defaultValue={editMaintenanceData?.cost?.toString() || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextMaintenanceDate">Next Maintenance Date</Label>
                <Input name="nextMaintenanceDate" type="date" defaultValue={editMaintenanceData?.next_maintenance_date || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea name="notes" defaultValue={editMaintenanceData?.notes || ''} />
              </div>
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditMaintenanceOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto" disabled={updatingMaintenance }>{updatingMaintenance? <Loader/> : "Save"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Maintenance Confirmation Dialog */}
        <Dialog open={isDeleteMaintenanceOpen} onOpenChange={setIsDeleteMaintenanceOpen}>
          <DialogContent className="w-[95vw] max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Maintenance Record</DialogTitle>
              <DialogDescription>Are you sure you want to delete this maintenance record? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setIsDeleteMaintenanceOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="button" className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto" disabled={deletingMaintenance} onClick={deleteMaintenance}>{deletingMaintenance? <Loader/>:"Delete"}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Empty State */}
        {loadingEquipment ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex justify-center items-center flex-col">
                <div className="h-10 w-10 mb-4 animate-spin border-4 border-emerald-500 border-t-transparent rounded-full" />
                <p className="text-gray-600 text-sm">Loading equipment...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredEquipment.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No equipment found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Get started by adding your first equipment"
                }
              </p>
              {!searchTerm && statusFilter === "all" && categoryFilter === "all" && (
                <Button
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={() => setIsAddOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Equipment
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EquipmentManagement;