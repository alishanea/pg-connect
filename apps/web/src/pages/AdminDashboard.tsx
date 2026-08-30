import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { StatusBadge, Status } from '../components/common/StatusBadge';
import { CategoryBadge, Category } from '../components/common/CategoryBadge';
import { EmptyState } from '../components/common/EmptyState';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  Megaphone,
  Key,
  Building2,
  BarChart3,
  UserCheck,
} from 'lucide-react';

interface Grievance {
  id: string;
  title: string;
  category: Category;
  status: Status;
  createdAt: string;
  raisedByUser: { name: string };
  room?: { roomNumber: string };
  assignedToUser?: { name: string };
}

interface AnalyticsSummary {
  totalCount: number;
  statusCounts: { OPEN: number; IN_PROGRESS: number; RESOLVED: number; CLOSED: number };
  avgResolutionTimeHours: number;
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [gRes, aRes] = await Promise.all([
        apiClient.get('/grievances'),
        apiClient.get('/analytics/summary').catch(() => ({ data: { summary: null } })),
      ]);
      setGrievances(gRes.data.grievances || []);
      setAnalytics(aRes.data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateInvite = async () => {
    if (!user?.pgId) return;
    try {
      const res = await apiClient.post(`/pgs/${user.pgId}/invite-codes`, { roleGranted: 'RESIDENT' });
      setGeneratedCode(res.data.invite.code);
      setInviteModalOpen(true);
    } catch (err) {
      alert('Failed to generate invite code');
    }
  };

  const handleStatusChange = async (grievanceId: string, newStatus: Status) => {
    try {
      await apiClient.patch(`/grievances/${grievanceId}`, { status: newStatus });
      setGrievances((prev) =>
        prev.map((g) => (g.id === grievanceId ? { ...g, status: newStatus } : g))
      );
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const filteredGrievances = grievances.filter((g) => {
    if (statusFilter === 'ALL') return true;
    return g.status === statusFilter;
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
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-600" />
            <span>Managing property: <strong className="text-gray-800">{user?.pg?.name || 'My PG'}</strong></span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleGenerateInvite}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            <Key className="w-4 h-4" />
            Generate Invite Code
          </button>
          <Link
            to="/announcements"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-xl transition"
          >
            <Megaphone className="w-4 h-4" />
            Post Announcement
          </Link>
        </div>
      </div>

      {/* Analytics KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Open Grievances</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              {analytics?.statusCounts.OPEN || 0}
            </div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">In Progress</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {analytics?.statusCounts.IN_PROGRESS || 0}
            </div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Resolved</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {(analytics?.statusCounts.RESOLVED || 0) + (analytics?.statusCounts.CLOSED || 0)}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Avg Resolution Time</div>
            <div className="text-2xl font-bold text-indigo-600 mt-1">
              {analytics?.avgResolutionTimeHours !== undefined ? `${analytics.avgResolutionTimeHours}h` : '0h'}
            </div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grievances Operational Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900">Grievance Workflows</h2>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === st ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredGrievances.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No grievances in this filter 🎉"
            description="All clear! No grievances match the selected status."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Title & Resident</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Assigned Staff</th>
                  <th className="px-6 py-3">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredGrievances.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <Link to={`/grievances/${g.id}`} className="font-semibold text-gray-900 hover:text-sky-600">
                        {g.title}
                      </Link>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Raised by {g.raisedByUser?.name} {g.room?.roomNumber ? `(Room ${g.room.roomNumber})` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <CategoryBadge category={g.category} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={g.status} />
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-700">
                      {g.assignedToUser ? (
                        <span className="flex items-center gap-1 text-sky-700">
                          <UserCheck className="w-3.5 h-3.5" />
                          {g.assignedToUser.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={g.status}
                        onChange={(e) => handleStatusChange(g.id, e.target.value as Status)}
                        className="text-xs font-medium border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-800 focus:ring-sky-500 focus:border-sky-500"
                      >
                        <option value="OPEN">Mark OPEN</option>
                        <option value="IN_PROGRESS">Mark IN PROGRESS</option>
                        <option value="RESOLVED">Mark RESOLVED</option>
                        <option value="CLOSED">Mark CLOSED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Code Generated Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
            <div className="p-3 bg-sky-100 text-sky-600 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Resident Invite Code Generated</h3>
            <p className="text-xs text-gray-500">
              Share this code with your resident so they can register and join this PG property on signup:
            </p>
            <div className="bg-gray-100 p-3 rounded-xl font-mono text-2xl font-bold tracking-widest text-sky-700 select-all border border-gray-200">
              {generatedCode}
            </div>
            <button
              onClick={() => setInviteModalOpen(false)}
              className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
