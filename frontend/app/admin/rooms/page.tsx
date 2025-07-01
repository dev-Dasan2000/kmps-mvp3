"use client";
import { useContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Search, Plus } from "lucide-react";
import axios from "axios";
import { AuthContext } from "@/context/auth-context";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Room {
  room_id: string;
  description?: string;
}

// Component to view room details
function ViewRoomDialog({ room, onClose }: { room: Room | null, onClose: () => void }) {
  if (!room) return null;

  return (
    <Dialog open={!!room} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Room Details</DialogTitle>
          <DialogDescription>
            View details for room {room.room_id}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="room-id" className="text-right">
              Room ID
            </Label>
            <div id="room-id" className="col-span-3">
              {room.room_id}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <div id="description" className="col-span-3">
              {room.description || 'No description provided'}
            </div>
          </div>
        </div>
        <DialogClose asChild>
          <Button type="button" variant="secondary">Close</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

// Component to add a new room
function AddRoomDialog({ open, onClose, onRoomAdded }: { open: boolean, onClose: () => void, onRoomAdded: () => void }) {
  const [roomId, setRoomId] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) {
      toast.error("Room ID is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${backendURL}/rooms`, {
        room_id: roomId.trim(),
        description: description.trim() || undefined
      });
      
      toast.success("Room added successfully");
      setRoomId("");
      setDescription("");
      onRoomAdded();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add room");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Room</DialogTitle>
          <DialogDescription>
            Enter the details for the new room
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="room-id" className="text-right">
              Room ID*
            </Label>
            <Input
              id="room-id"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="col-span-3"
              placeholder="Enter room ID (required)"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Enter room description (optional)"
            />
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              type="submit" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Room"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function RoomTable() {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();
  const { isLoadingAuth, isLoggedIn, user } = useContext(AuthContext);

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const response = await axios.get(`${backendURL}/rooms`);
      setRooms(response.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch rooms");
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleDelete = async (room_id: string) => {
    setDeletingRoom(true);
    try {
      const res = await axios.delete(`${backendURL}/rooms/${room_id}`);
      if (res.status !== 200) throw new Error("Failed to delete room");
      
      // Update state to remove deleted room
      setRooms(prev => prev.filter(room => room.room_id !== room_id));
      toast.success("Room deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete room");
    } finally {
      setDeletingRoom(false);
    }
  };

  // Filter rooms based on search term
  const filteredRooms = searchTerm
    ? rooms.filter(
        room => 
          room.room_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (room.description && room.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : rooms;

  useEffect(() => {
    if (!isLoadingAuth && isLoggedIn) {
      fetchRooms();
    } else if (!isLoadingAuth && !isLoggedIn) {
      router.push('/');
    }
  }, [isLoadingAuth, isLoggedIn, router]);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
         {/* Header */}
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold mt-7 md:mt-0 text-gray-900">Rooms</h1>
                      <p className="text-gray-600 mt-1">Add and manage rooms</p>
                    </div>
                   <Button
            onClick={() => setAddDialogOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus size={20} />
            Add Room
          </Button>
                  </div>
                </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-transparent"
            />
          </div>
        </div>
        
        {loadingRooms ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-emerald-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Room ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRooms.map((room) => (
                      <tr key={room.room_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{room.room_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900">{room.description || 'No description'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setSelectedRoom(room)}
                              className="p-1 hover:bg-blue-50 rounded-full transition-colors"
                            >
                              <Eye className="h-5 w-5 text-blue-600" />
                            </button>
                            <button 
                              onClick={() => handleDelete(room.room_id)}
                              className="p-1 hover:bg-red-50 rounded-full transition-colors" 
                              disabled={deletingRoom}
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
              {filteredRooms.map((room) => (
                <div key={room.room_id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* Room Info */}
                      <div className="font-semibold text-lg text-gray-900">Room: {room.room_id}</div>
                      <div className="text-sm text-gray-500">
                        Description: {room.description || 'No description'}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedRoom(room)}
                        className="flex items-center justify-center p-3 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                      >
                        <Eye className="h-5 w-5 text-blue-600" />
                      </button>
                      <button 
                        onClick={() => handleDelete(room.room_id)}
                        className="flex items-center justify-center p-3 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                        disabled={deletingRoom}
                      >
                        <Trash2 className="h-5 w-5 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Empty State */}
            {filteredRooms.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <div className="text-gray-300 mx-auto mb-4 w-16 h-16 border-2 border-dashed rounded-lg flex items-center justify-center">
                  <Plus size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No rooms found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm
                    ? 'Try adjusting your search criteria.'
                    : 'Get started by adding your first room.'}
                </p>
                <Button
                  onClick={() => setAddDialogOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors mx-auto"
                >
                  <Plus size={20} />
                  Add Room
                </Button>
              </div>
            )}
            
            <ViewRoomDialog room={selectedRoom} onClose={() => setSelectedRoom(null)} />
            <AddRoomDialog 
              open={addDialogOpen} 
              onClose={() => setAddDialogOpen(false)} 
              onRoomAdded={fetchRooms} 
            />
          </>
        )}
      </div>
    </div>
  );
}
