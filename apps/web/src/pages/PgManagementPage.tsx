import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Building2, Plus, Key, Users, Home } from 'lucide-react';

interface RoomItem {
  id: string;
  roomNumber: string;
  capacity: number;
  users: { id: string; name: string }[];
}

export const PgManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState('2');
  const [loading, setLoading] = useState(true);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const fetchRooms = async () => {
    if (!user?.pgId) return;
    try {
      const res = await apiClient.get(`/pgs/${user.pgId}/rooms`);
      setRooms(res.data.rooms || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [user]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.pgId || !newRoomNumber.trim()) return;
    setCreatingRoom(true);
    try {
      const res = await apiClient.post(`/pgs/${user.pgId}/rooms`, {
        roomNumber: newRoomNumber.trim(),
        capacity: parseInt(newCapacity, 10),
      });
      setRooms((prev) => [...prev, { ...res.data.room, users: [] }]);
      setNewRoomNumber('');
    } catch (err) {
      alert('Failed to create room');
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleGenerateInvite = async (roleGranted: 'RESIDENT' | 'STAFF') => {
    if (!user?.pgId) return;
    try {
      const res = await apiClient.post(`/pgs/${user.pgId}/invite-codes`, { roleGranted });
      setGeneratedCode(`${roleGranted}: ${res.data.invite.code}`);
    } catch (err) {
      alert('Failed to generate code');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PG & Room Management</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-sky-600" />
            <span>{user?.pg?.name} • {user?.pg?.address}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleGenerateInvite('RESIDENT')}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
          >
            <Key className="w-4 h-4" />
            New Resident Code
          </button>
          <button
            onClick={() => handleGenerateInvite('STAFF')}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
          >
            <Key className="w-4 h-4" />
            New Staff Code
          </button>
        </div>
      </div>

      {/* Generated Code Alert */}
      {generatedCode && (
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-between">
          <div className="text-sm text-sky-900">
            <strong>Active Invite Code:</strong> <span className="font-mono text-base font-bold text-sky-700 ml-2">{generatedCode}</span>
          </div>
          <button
            onClick={() => setGeneratedCode(null)}
            className="text-xs text-sky-700 font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Add Room Section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Home className="w-5 h-5 text-sky-600" />
          Add New Room
        </h2>

        <form onSubmit={handleCreateRoom} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Room Number</label>
            <input
              type="text"
              required
              value={newRoomNumber}
              onChange={(e) => setNewRoomNumber(e.target.value)}
              placeholder="e.g. 101, 102A"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Bed Capacity</label>
            <select
              value={newCapacity}
              onChange={(e) => setNewCapacity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-sky-500"
            >
              <option value="1">1 Bed (Single)</option>
              <option value="2">2 Beds (Double Sharing)</option>
              <option value="3">3 Beds (Triple Sharing)</option>
              <option value="4">4 Beds (Four Sharing)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={creatingRoom}
              className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" />
              {creatingRoom ? 'Adding...' : 'Add Room'}
            </button>
          </div>
        </form>
      </div>

      {/* Room Inventory Grid */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Room Inventory ({rooms.length})</h2>

        {rooms.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No rooms created yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div key={room.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-base text-gray-900">Room {room.roomNumber}</span>
                    <span className="text-xs bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded-full">
                      {room.users.length} / {room.capacity} Beds
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    {room.users.length === 0 ? (
                      <span className="text-gray-400 italic">No occupants currently</span>
                    ) : (
                      room.users.map((u) => (
                        <div key={u.id} className="flex items-center gap-1.5 text-gray-700 font-medium">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          {u.name}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
