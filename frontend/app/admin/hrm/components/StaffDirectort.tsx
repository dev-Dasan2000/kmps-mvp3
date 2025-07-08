'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Trash2, Edit } from "lucide-react";

const initialStaffDirectory = [
  { id: "EMP001", name: "Dr. Sarah Johnson", role: "Dentist", schedule: "Full-time" },
  { id: "EMP002", name: "Mark Wilson", role: "Radiologist", schedule: "Part-time" },
  { id: "EMP003", name: "Lisa Chen", role: "Dental Assistant", schedule: "Full-time" },
  { id: "EMP004", name: "Emma Davis", role: "Receptionist", schedule: "Full-time" },
  { id: "EMP005", name: "Dr. Michael Brown", role: "Orthodontist", schedule: "Full-time" },
];

export function StaffDirectory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [staffDirectory, setStaffDirectory] = useState(initialStaffDirectory);

  const filteredStaff = staffDirectory.filter(staff => 
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (id: string) => {
    console.log('Edit staff member:', id);
  };

  const handleDelete = (id: string) => {
    console.log('Delete staff member:', id);
  };

  const ScheduleBadge = ({ schedule }: { schedule: string }) => (
    <span className={`px-2 py-1 rounded ${
      schedule === 'Full-time' ? 'bg-green-100 text-green-800' :
      schedule === 'Part-time' ? 'bg-blue-100 text-blue-800' :
      'bg-gray-100 text-gray-800'
    }`}>
      {schedule}
    </span>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Directory</CardTitle>
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search staff..." 
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className='bg-emerald-500 hover:bg-emerald-600 text-white' onClick={() => console.log('Add staff clicked')}>Add Staff</Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-medium">Employee ID</th>
                <th className="text-left py-4 px-4 font-medium">Name</th>
                <th className="text-left py-4 px-4 font-medium">Role</th>
                <th className="text-left py-4 px-4 font-medium">Schedule</th>
                <th className="text-left py-4 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-4">{staff.id}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${staff.name}`} />
                        <AvatarFallback>{staff.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      {staff.name}
                    </div>
                  </td>
                  <td className="py-4 px-4">{staff.role}</td>
                  <td className="py-4 px-4">
                    <ScheduleBadge schedule={staff.schedule} />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(staff.id)}
                      >
                        <Edit />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(staff.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View - Cards */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {filteredStaff.map((staff) => (
            <Card key={staff.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${staff.name}`} />
                    <AvatarFallback>{staff.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{staff.name}</h3>
                      <ScheduleBadge schedule={staff.schedule} />
                    </div>
                    <div className="mt-1 text-sm text-gray-500">{staff.role}</div>
                    <div className="mt-1 text-xs text-gray-400">ID: {staff.id}</div>
                    <div className="mt-3 flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEdit(staff.id)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(staff.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 