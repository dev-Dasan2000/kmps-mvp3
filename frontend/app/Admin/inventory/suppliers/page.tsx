"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import SupplierDialog, { Supplier } from "@/components/SupplierDialog";

// Mock data based on the schema
const mockSuppliers: Supplier[] = [
  {
    supplier_id: 1,
    company_name: "DentalPro Supplies Inc.",
    contact_person: "Sarah Johnson",
    email: "sarah.johnson@dentalpro.com",
    phone_number: "+1-555-0123",
    address: "1234 Medical Drive, Suite 100",
    city: "Boston",
    state: "MA",
    postal_code: "02108",
    country: "USA",
    website: "https://www.dentalpro.com",
    notes: "Primary supplier for dental equipment. Excellent customer service.",
    status: "active"
  },
  {
    supplier_id: 2,
    company_name: "MedEquip Solutions",
    contact_person: "Michael Chen",
    email: "m.chen@medequip.com",
    phone_number: "+1-555-0456",
    address: "5678 Healthcare Blvd",
    city: "San Francisco",
    state: "CA",
    postal_code: "94102",
    country: "USA",
    website: "https://www.medequip.com",
    notes: "Specializes in advanced dental imaging equipment.",
    status: "active"
  },
  {
    supplier_id: 3,
    company_name: "Global Dental Supply",
    contact_person: "Emma Rodriguez",
    email: "emma@globaldentalsupp.com",
    phone_number: "+1-555-0789",
    address: "910 Industrial Park Way",
    city: "Chicago",
    state: "IL",
    postal_code: "60601",
    country: "USA",
    website: "https://www.globaldentalsu.com",
    notes: "Competitive pricing on bulk orders. Ships internationally.",
    status: "pending"
  },
  {
    supplier_id: 4,
    company_name: "TechDent Innovations",
    contact_person: "David Kim",
    email: "david.kim@techdent.com",
    phone_number: "+1-555-0321",
    address: "2468 Innovation Circle",
    city: "Austin",
    state: "TX",
    postal_code: "73301",
    country: "USA",
    website: "https://www.techdent.com",
    notes: "Cutting-edge dental technology and software solutions.",
    status: "active"
  },
  {
    supplier_id: 5,
    company_name: "Eco Dental Materials",
    contact_person: "Lisa Thompson",
    email: "lisa@ecodental.com",
    phone_number: "+1-555-0654",
    address: "1357 Green Valley Road",
    city: "Portland",
    state: "OR",
    postal_code: "97201",
    country: "USA",
    website: "https://www.ecodental.com",
    notes: "Environmentally friendly dental supplies and materials.",
    status: "inactive"
  }
];

// Toast hook replacement (simplified)
const useToast = () => ({
  toast: ({ title, description, variant }: { title: string; description: string; variant?: string }) => {
    console.log(`${variant === 'destructive' ? 'ERROR' : 'SUCCESS'}: ${title} - ${description}`);
    // In a real app, this would show a toast notification
  }
});

const SupplierManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("cards");

  const stats = {
    activeCount: suppliers.filter(s => s.status === 'active').length,
    pendingReviews: suppliers.filter(s => s.status === 'pending').length,
    totalOrders: 142, // Mock data
    avgRating: 4.3 // Mock data
  };

  const addSupplier = (formData: Omit<Supplier, 'supplier_id'>) => {
    try {
      const newSupplier: Supplier = {
        ...formData,
        supplier_id: Math.max(...suppliers.map(s => s.supplier_id)) + 1
      };
      setSuppliers([...suppliers, newSupplier]);
      toast({ title: "Success", description: "Supplier added successfully" });
      setIsAddSupplierOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to add supplier", variant: "destructive" });
    }
  };

  const updateSupplier = (formData: Omit<Supplier, 'supplier_id'>) => {
    if (!selectedSupplier) return;
    try {
      const updatedSuppliers = suppliers.map(supplier =>
        supplier.supplier_id === selectedSupplier.supplier_id
          ? { ...formData, supplier_id: selectedSupplier.supplier_id }
          : supplier
      );
      setSuppliers(updatedSuppliers);
      toast({ title: "Success", description: "Supplier updated successfully" });
      setIsEditOpen(false);
      setSelectedSupplier(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update supplier", variant: "destructive" });
    }
  };

  const confirmDelete = () => {
    if (!supplierToDelete) return;
    
    try {
      const updatedSuppliers = suppliers.filter(s => s.supplier_id !== supplierToDelete.supplier_id);
      setSuppliers(updatedSuppliers);
      
      toast({ 
        title: "Supplier Deleted", 
        description: `${supplierToDelete.company_name} has been removed successfully.`
      });
      
      setIsDeleteDialogOpen(false);
      setSupplierToDelete(null);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to delete supplier. Please try again.", 
        variant: "destructive" 
      });
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
          <CardContent className="p-4">
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <p className="text-xs sm:text-sm text-gray-600">Pending</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.pendingReviews}</p>
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
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Rating</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.avgRating}</p>
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
                            className="text-blue-600 hover:text-blue-800 truncate"
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
                    <thead className="bg-gray-50 border-b">
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
                  className="bg-blue-600 hover:bg-blue-700"
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