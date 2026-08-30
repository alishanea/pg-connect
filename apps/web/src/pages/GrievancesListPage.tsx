import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { StatusBadge, Status } from '../components/common/StatusBadge';
import { CategoryBadge, Category } from '../components/common/CategoryBadge';
import { EmptyState } from '../components/common/EmptyState';
import { PlusCircle, Search, Filter, AlertCircle, MessageSquare } from 'lucide-react';

interface Grievance {
  id: string;
  title: string;
  description: string;
  category: Category;
  status: Status;
  createdAt: string;
  raisedByUser: { name: string };
  room?: { roomNumber: string };
  assignedToUser?: { name: string };
  _count?: { comments: number };
}

export const GrievancesListPage: React.FC = () => {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGrievances() {
      try {
        const res = await apiClient.get('/grievances');
        setGrievances(res.data.grievances || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchGrievances();
  }, []);

  const filtered = grievances.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || g.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || g.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & New Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grievances</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track, filter, and monitor resolution status for all property issues.
          </p>
        </div>
        {(user?.role === 'RESIDENT' || user?.role === 'STAFF') && (
          <Link
            to="/grievances/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Raise New Grievance
          </Link>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or keyword..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-800 focus:ring-sky-500"
          >
            <option value="ALL">All Categories</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="FOOD">Food Quality</option>
            <option value="CLEANLINESS">Cleanliness</option>
            <option value="SAFETY">Safety</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-800 focus:ring-sky-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Grievances List Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No grievances found"
          description="No grievances matched your search query or filter selection."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((g) => (
            <Link
              key={g.id}
              to={`/grievances/${g.id}`}
              className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-sky-300 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h3 className="text-base font-bold text-gray-900 line-clamp-1">{g.title}</h3>
                  <StatusBadge status={g.status} />
                </div>
                <p className="text-xs text-gray-600 line-clamp-2 mb-3">{g.description}</p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <CategoryBadge category={g.category} />
                  <span>•</span>
                  <span>Raised by {g.raisedByUser?.name}</span>
                </div>
                {g._count?.comments !== undefined && (
                  <span className="flex items-center gap-1 text-gray-400">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {g._count.comments}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
