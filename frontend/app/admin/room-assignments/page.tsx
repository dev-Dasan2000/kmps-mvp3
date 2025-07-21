"use client";
import { RoomAssignment } from '@/components/room-assigmentadmin';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthContext } from '@/context/auth-context';

const page = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const {isLoadingAuth, isLoggedIn, user, apiClient} = useContext(AuthContext);

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) {
      toast.error("Room ID is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post(`/rooms`, {
        room_id: roomId.trim(),
        description: description.trim() || undefined
      });

      toast.success("Room added successfully");
      setRoomId("");
      setDescription("");
      setIsAddDialogOpen(false);
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add room");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(()=>{
    if(isLoadingAuth) return;
    if(!isLoggedIn){
      toast.error("Login Error", {description:"Please Login"});
      router.push("/");
    }
    else if(user.role != "admin"){
      toast.error("Access Denied", {description:"You do not have admin priviledges"});
      router.push("/");
    }
  },[isLoadingAuth]);

  return (
    <main className="overflow-auto w-full h-full">
      <div className="p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl mt-7 md:mt-0 font-bold text-gray-900">
                Room Assignments
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                View and manage room assignments.
              </p>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Room
            </Button>
          </div>
        </div>
      </div>
      <RoomAssignment refreshKey={refreshKey} />

      {/* Add Room Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
            <DialogDescription>
              Add a new room to the system
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddRoom} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="room-id">Room ID *</Label>
              <Input
                id="room-id"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter room description (optional)"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Room'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>

  )
}

export default page