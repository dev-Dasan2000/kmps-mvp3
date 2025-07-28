"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Badge } from "@/Components/ui/badge";
import { Label } from "@/Components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { 
  Plus, 
  Search, 
  Shield, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Package,
  Edit,
  Trash,
  Menu,
  X
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/Components/ui/alert-dialog";
import SupplierDialog, { Supplier } from "@/Components/SupplierDialog";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const SupplierManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("cards");

  const { apiClient } = useAuth();

  const stats = {
    activeCount: suppliers.filter(s => s.status === 'active').length,
    inactiveReviews: suppliers.filter(s => s.status === 'inactive').length,
    totalOrders: suppliers.reduce((acc, curr) => acc + (curr.purchase_orders?.length || 0), 0),
  };

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/inventory/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const addSupplier = async (formData: Omit<Supplier, 'supplier_id'>) => {
    try {
      const response = await apiClient.post('/inventory/suppliers', formData);
      setSuppliers([...suppliers, response.data]);
      toast.success('Supplier added successfully');
      setIsAddSupplierOpen(false);
    } catch (error) {
      console.error('Error adding supplier:', error);
      toast.error('Failed to add supplier');
    }
  };

  const updateSupplier = async (formData: Omit<Supplier, 'supplier_id'>) => {
    if (!selectedSupplier) return;
    try {
      const response = await apiClient.put(`/inventory/suppliers/${selectedSupplier.supplier_id}`, formData);
      const updatedSuppliers = suppliers.map(supplier =>
        supplier.supplier_id === selectedSupplier.supplier_id
          ? response.data
          : supplier
      );
      setSuppliers(updatedSuppliers);
      toast.success('Supplier updated successfully');
      setIsEditOpen(false);
      setSelectedSupplier(null);
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast.error('Failed to update supplier');
    }
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    
    try {
      await apiClient.delete(`/inventory/suppliers/${supplierToDelete.supplier_id}`);
      const updatedSuppliers = suppliers.filter(s => s.supplier_id !== supplierToDelete.supplier_id);
      setSuppliers(updatedSuppliers);
      
      toast.success(`${supplierToDelete.company_name} has been removed successfully`);
      
      setIsDeleteDialogOpen(false);
      setSupplierToDelete(null);
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error('Failed to delete supplier. Please try again.');
    }
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.postal_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pb-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Supplier Management</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage your dental supply vendors and relationships</p>
          </div>
          <Button 
            className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto"
            onClick={() => setIsAddSupplierOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Supplier
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Active</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.activeCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Inactive</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.inactiveReviews}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Orders</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Suppliers List */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cards">Card View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>

          <TabsContent value="cards">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {filteredSuppliers.map((supplier) => (
                <Card key={supplier.supplier_id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                          {supplier.company_name}
                        </CardTitle>
                        <CardDescription className="mt-1 truncate">
                          {supplier.contact_person}
                        </CardDescription>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        {getStatusBadge(supplier.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-900 truncate">{supplier.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-900">{supplier.phone_number}</span>
                      </div>
                      <div className="flex items-start space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-900 line-clamp-2">{supplier.address}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <span className="text-gray-600">
                          <span className="font-medium">City:</span> {supplier.city}
                        </span>
                        <span className="text-gray-600">
                          <span className="font-medium">State:</span> {supplier.state}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <span className="text-gray-600">
                          <span className="font-medium">ZIP:</span> {supplier.postal_code}
                        </span>
                        <span className="text-gray-600">
                          <span className="font-medium">Country:</span> {supplier.country}
                        </span>
                      </div>
                      {supplier.website && (
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-600 font-medium">Website:</span>
                          <a 
                            href={supplier.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-800 truncate"
                          >
                            {supplier.website}
                          </a>
                        </div>
                      )}
                      {supplier.notes && (
                        <div className="text-sm">
                          <span className="text-gray-600 font-medium">Notes:</span>
                          <span className="text-gray-900 ml-2 line-clamp-2">{supplier.notes}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => { 
                          setSelectedSupplier(supplier); 
                          setIsEditOpen(true); 
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50" 
                        onClick={() => handleDeleteClick(supplier)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="table">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-emerald-50 border-b">
                      <tr>
                        <th className="text-left p-3 sm:p-4 font-semibold text-gray-900 text-sm">Company</th>
                        <th className="text-left p-3 sm:p-4 font-semibold text-gray-900 text-sm">Contact</th>
                        <th className="text-left p-3 sm:p-4 font-semibold text-gray-900 text-sm">Email</th>
                        <th className="text-left p-3 sm:p-4 font-semibold text-gray-900 text-sm">Phone</th>
                        <th className="text-left p-3 sm:p-4 font-semibold text-gray-900 text-sm">Location</th>
                        <th className="text-left p-3 sm:p-4 font-semibold text-gray-900 text-sm">Status</th>
                        <th className="text-left p-3 sm:p-4 font-semibold text-gray-900 text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredSuppliers.map((supplier) => (
                        <tr key={supplier.supplier_id} className="hover:bg-gray-50">
                          <td className="p-3 sm:p-4 font-medium text-gray-900 text-sm">{supplier.company_name}</td>
                          <td className="p-3 sm:p-4 text-sm">{supplier.contact_person}</td>
                          <td className="p-3 sm:p-4 text-sm">{supplier.email}</td>
                          <td className="p-3 sm:p-4 text-sm">{supplier.phone_number}</td>
                          <td className="p-3 sm:p-4 text-sm">{supplier.city}, {supplier.state}</td>
                          <td className="p-3 sm:p-4">{getStatusBadge(supplier.status)}</td>
                          <td className="p-3 sm:p-4">
                            <div className="flex space-x-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => { 
                                  setSelectedSupplier(supplier); 
                                  setIsEditOpen(true); 
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50" 
                                onClick={() => handleDeleteClick(supplier)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {filteredSuppliers.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No suppliers found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? "Try adjusting your search terms"
                  : "Get started by adding your first supplier"
                }
              </p>
              {!searchTerm && (
                <Button 
                  className="bg-emerald-500 hover:bg-emerald-600"
                  onClick={() => setIsAddSupplierOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Supplier
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Supplier Dialog */}
        <SupplierDialog
          isOpen={isAddSupplierOpen}
          onOpenChange={setIsAddSupplierOpen}
          onSubmit={addSupplier}
          mode="add"
        />

        <SupplierDialog
          isOpen={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSubmit={updateSupplier}
          initialData={selectedSupplier || undefined}
          mode="edit"
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="w-[95vw] max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {supplierToDelete?.company_name}. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <AlertDialogCancel 
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setSupplierToDelete(null);
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default SupplierManagement;