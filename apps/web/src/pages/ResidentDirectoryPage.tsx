import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { EmptyState } from '../components/common/EmptyState';
import { Users, Search, Home } from 'lucide-react';

interface ResidentItem {
  id: string;
  name: string;
  room?: { roomNumber: string } | null;
  createdAt: string;
}

export const ResidentDirectoryPage: React.FC = () => {
  const { user } = useAuth();
  const [residents, setResidents] = useState<ResidentItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDirectory() {
      if (!user?.pgId) return;
      try {
        const res = await apiClient.get(`/pgs/${user.pgId}/residents`);
        setResidents(res.data.residents || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDirectory();
  }, [user]);

  const filtered = residents.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.room?.roomNumber && r.room.roomNumber.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Co-Resident Directory</h1>
        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
          <Home className="w-4 h-4 text-sky-600" />
          <span>Showing residents registered in <strong>{user?.pg?.name || 'your PG'}</strong></span>
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or room number..."
          className="w-full text-sm border-0 focus:ring-0 p-0 text-gray-800"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No residents found"
          description="No residents found matching your search term."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-lg">
                {r.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">{r.name}</h3>
                <div className="mt-1">
                  {r.room?.roomNumber ? (
                    <span className="inline-flex items-center text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full">
                      Room {r.room.roomNumber}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Room unassigned</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
