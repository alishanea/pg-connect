import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { StatusBadge, Status } from '../components/common/StatusBadge';
import { CategoryBadge, Category } from '../components/common/CategoryBadge';
import { EmptyState } from '../components/common/EmptyState';
import { PlusCircle, AlertCircle, Megaphone, Home, ArrowRight, Clock } from 'lucide-react';

interface Grievance {
  id: string;
  title: string;
  category: Category;
  status: Status;
  createdAt: string;
  _count?: { comments: number };
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  author: { name: string };
}

export const ResidentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [gRes, aRes] = await Promise.all([
          apiClient.get('/grievances?raisedByMe=true'),
          apiClient.get('/announcements'),
        ]);
        setGrievances(gRes.data.grievances || []);
        setAnnouncements(aRes.data.announcements || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const openCount = grievances.filter((g) => g.status === 'OPEN' || g.status === 'IN_PROGRESS').length;
  const resolvedCount = grievances.filter((g) => g.status === 'RESOLVED' || g.status === 'CLOSED').length;

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-sky-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name}! 👋</h1>
          <p className="text-sky-100 text-sm mt-1 flex items-center gap-2">
            <Home className="w-4 h-4" />
            <span>{user?.pg?.name || 'Your PG Property'}</span>
            {user?.room?.roomNumber && (
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                Room {user.room.roomNumber}
              </span>
            )}
          </p>
        </div>
        <Link
          to="/grievances/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-sky-700 hover:bg-sky-50 font-semibold rounded-xl text-sm transition shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Raise Grievance
        </Link>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Active Tickets</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{openCount}</div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Resolved / Closed</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{resolvedCount}</div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Announcements</div>
            <div className="text-2xl font-bold text-indigo-600 mt-1">{announcements.length}</div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Megaphone className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: My Grievances & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Grievances (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">My Raised Grievances</h2>
            <Link to="/grievances" className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {grievances.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="No grievances raised yet 🎉"
              description="If you face any issue with Wi-Fi, food, maintenance, or cleanliness, raise it here."
              actionLabel="Raise a Grievance"
              onAction={() => window.location.href = '/grievances/new'}
            />
          ) : (
            <div className="space-y-3">
              {grievances.slice(0, 5).map((g) => (
                <Link
                  key={g.id}
                  to={`/grievances/${g.id}`}
                  className="block bg-white p-4 rounded-xl border border-gray-200 hover:border-sky-300 hover:shadow-sm transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{g.title}</h3>
                    <StatusBadge status={g.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <CategoryBadge category={g.category} />
                    <span>•</span>
                    <span>{new Date(g.createdAt).toLocaleDateString()}</span>
                    {g._count?.comments !== undefined && (
                      <>
                        <span>•</span>
                        <span>{g._count.comments} comments</span>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent Announcements (1 col) */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Announcements</h2>
            <Link to="/announcements" className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {announcements.length === 0 ? (
            <div className="bg-white p-5 border border-gray-200 rounded-xl text-center text-sm text-gray-500">
              No recent announcements.
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 3).map((a) => (
                <div key={a.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-900">{a.title}</h4>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{a.body}</p>
                  <div className="text-[10px] text-gray-400 mt-2 flex justify-between">
                    <span>By {a.author?.name}</span>
                    <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
