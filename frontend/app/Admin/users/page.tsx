"use client";
import { use, useContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Search, Plus, User, Phone, Mail, UserCheck, BarChart3 } from "lucide-react";
import ViewUserDialog from "@/components/ViewUserDialog";
import InviteUserDialog from "@/components/InviteUserDialog";
import axios from "axios";
import { AuthContext } from "@/context/auth-context";
import { useRouter } from 'next/navigation';
import {toast} from 'sonner';
import DoctorPerformanceDashboard from "@/components/DoctorPerformance";

type Role = "Dentist" | "Receptionist" | "Radiologist";

interface User {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  role: Role;
  [key: string]: any; // Allow additional properties
}


export default function UserTable() {

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();

  const {isLoadingAuth, isLoggedIn, user} = useContext(AuthContext);

  // Separate state for each dialog
  const [selectedUserForView, setSelectedUserForView] = useState<User | null>(null);
  const [selectedUserForAnalytics, setSelectedUserForAnalytics] = useState<User | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [users, setUsers] = useState<User[]>();

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const [dentistsRes, receptionistsRes, radiologistRes] = await Promise.all([
        axios.get(`${backendURL}/dentists`),
        axios.get(`${backendURL}/receptionists`),
        axios.get(`${backendURL}/radiologists`)
      ]);

      if (dentistsRes.status === 500 || receptionistsRes.status === 500 || radiologistRes.status === 500) {
        throw new Error("Internal Server Error");
      }

      const dentistUsers: any[] = dentistsRes.data.map((dentist: any) => ({
        id: dentist.dentist_id,
        name: dentist.name,
        email: dentist.email,
        phone_number: dentist.phone_number || '',
        role: "Dentist",
        ...dentist // Spread the rest of the dentist properties
      }));

      const receptionistUsers: any[] = receptionistsRes.data.map((receptionist: any) => ({
        id: receptionist.receptionist_id,
        name: receptionist.name,
        email: receptionist.email,
        phone_number: receptionist.phone_number || '',
        role: "Receptionist",
        ...receptionist // Spread the rest of the receptionist properties
      }));

      const radiolodistUsers: any[] = radiologistRes.data.map((radiolodist: any) => ({
        id: radiolodist.radiologist_id,
        name: radiolodist.name,
        email: radiolodist.email,
        phone_number: radiolodist.phone_number || '',
        role: "Radiologist",
        ...radiolodist // Spread the rest of the radiologist properties
      }));

      const allUsers: User[] = [...dentistUsers, ...receptionistUsers, ...radiolodistUsers];
      setUsers(allUsers);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleDelete = async (user_id: string, role: string) => {
    setDeletingUser(true);
    try {
      let deleteURL = "";
      switch (role) {
        case "Dentist":
          deleteURL = `${backendURL}/dentists/${user_id}`;
          break;
        case "Receptionist":
          deleteURL = `${backendURL}/receptionists/${user_id}`;
          break;
        case "Radiologist":
          deleteURL = `${backendURL}/radiologists/${user_id}`;
          break;
        default:
          throw new Error("Invalid role");
      }
  
      const res = await axios.delete(deleteURL);
      if (res.status !== 200) throw new Error("Failed to delete user");
  
      // Update state to remove deleted user
      setUsers(prev => prev?.filter(u => u.id !== user_id));
      toast.success(`${role} deleted successfully`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingUser(false);
    }
  };

  const handleViewAnalytics = (user: User) => {
    // Set the user for analytics dashboard
    setSelectedUserForAnalytics(user);
  };
  

  // Filter users based on search term
  const filteredUsers = users?.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.phone_number && user.phone_number.includes(searchTerm)) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  const getRoleColor = (role: Role) => {
    switch (role) {
      case 'Dentist': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Receptionist': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'Dentist': return <UserCheck size={16} className="text-blue-600" />;
      case 'Receptionist': return <User size={16} className="text-green-600" />;
      default: return <User size={16} className="text-gray-600" />;
    }
  };

  useEffect(()=>{
    fetchUsers();
  },[]);

  useEffect(()=>{
    if(!isLoadingAuth){
      if(!isLoggedIn){
        toast.error("Session Error", {
          description: "Your session is expired, please login again"
        });
        router.push("/");
      }
      else if(user.role != "admin"){
        toast.error("Access Error", {
          description: "You do not have access, redirecting..."
        });
        router.push("/");
      }
    }
  },[isLoadingAuth]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mt-7 md:mt-0 text-gray-900">Users</h1>
              <p className="text-gray-600 mt-1">View dentists database entries</p>
            </div>
            <Button
              onClick={() => setInviteDialogOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-auto"
            >
              <Plus size={20} />
              Invite User
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg   focus:border-transparent"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-emerald-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Provider</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers?.map((inuser) => (
                  <tr key={inuser.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User size={20} className="text-gray-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{inuser.name}</div>
                          <div className="text-sm text-gray-500">ID: {inuser.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={14} className="text-gray-400" />
                          <span className="text-gray-900">{inuser.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-gray-400" />
                          <span className="text-gray-900">{inuser.phone_number || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          {getRoleIcon(inuser.role)}
                        </div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(inuser.role)} w-fit`}>
                          {inuser.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedUserForView(inuser)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View User"
                        >
                          <Eye className="h-5 w-5 text-blue-600" />
                        </button>
                        {inuser.role === "Dentist" && (
                          <button
                            onClick={() => handleViewAnalytics(inuser)}
                            className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                            title="View Analytics"
                          >
                            <BarChart3 className="h-5 w-5 text-purple-600" />
                          </button>
                        )}
                        <button 
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors" 
                          onClick={()=>{handleDelete(inuser.id, inuser.role)}}
                          title="Delete User"
                        >
                          <Trash2 className="h-5 w-5 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden space-y-4">
          {filteredUsers?.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* User Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <User size={24} className="text-gray-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">ID: {user.id}</div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-400" />
                      <span className="text-gray-900">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400" />
                      <span className="text-gray-900">{user.phone_number || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      {getRoleIcon(user.role)}
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)} w-fit`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row sm:flex-col gap-2">
                  <button
                    onClick={() => setSelectedUserForView(user)}
                    className="flex items-center justify-center p-3 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                    title="View User"
                  >
                    <Eye className="h-5 w-5 text-blue-600" />
                  </button>
                  {user.role === "Dentist" && (
                    <button
                      onClick={() => handleViewAnalytics(user)}
                      className="flex items-center justify-center p-3 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200"
                      title="View Analytics"
                    >
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                    </button>
                  )}
                  <button 
                    className="flex items-center justify-center p-3 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                    onClick={()=>{handleDelete(user.id, user.role)}}
                    title="Delete User"
                  >
                    <Trash2 className="h-5 w-5 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredUsers?.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <User size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm
                ? 'Try adjusting your search criteria.'
                : 'Get started by adding your first user.'}
            </p>
            <Button
              onClick={() => setInviteDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors mx-auto"
            >
              <Plus size={20} />
              Add User
            </Button>
          </div>
        )}

        {/* Dialogs with separate state */}
        <ViewUserDialog 
          user={selectedUserForView} 
          onClose={() => setSelectedUserForView(null)} 
        />
        <InviteUserDialog 
          open={inviteDialogOpen} 
          onClose={() => setInviteDialogOpen(false)} 
        />
        <DoctorPerformanceDashboard 
          user={selectedUserForAnalytics} 
          onClose={() => setSelectedUserForAnalytics(null)} 
        />

      </div>
    </div>
  );
}