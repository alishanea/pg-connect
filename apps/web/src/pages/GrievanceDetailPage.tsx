import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { StatusBadge, Status } from '../components/common/StatusBadge';
import { CategoryBadge, Category } from '../components/common/CategoryBadge';
import { ArrowLeft, Send, UserCheck, Image as ImageIcon, CheckCircle, Shield } from 'lucide-react';

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; role: string };
}

interface GrievanceDetail {
  id: string;
  title: string;
  description: string;
  category: Category;
  status: Status;
  photoUrl?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  raisedByUser: { id: string; name: string; email: string };
  assignedToUser?: { id: string; name: string } | null;
  room?: { id: string; roomNumber: string } | null;
  comments: Comment[];
}

export const GrievanceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [grievance, setGrievance] = useState<GrievanceDetail | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>([]);

  const fetchDetail = async () => {
    try {
      const res = await apiClient.get(`/grievances/${id}`);
      setGrievance(res.data.grievance);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    if (user?.role === 'ADMIN' && user.pgId) {
      apiClient.get(`/pgs/${user.pgId}/residents`).then(() => {
        // Mock staff list for assignment dropdown
        setStaffList([
          { id: user.id, name: `${user.name} (Owner)` },
        ]);
      }).catch(() => {});
    }
  }, [id, user]);

  const handleStatusChange = async (newStatus: Status) => {
    if (!grievance) return;
    try {
      const res = await apiClient.patch(`/grievances/${id}`, { status: newStatus });
      setGrievance((prev) => (prev ? { ...prev, status: res.data.grievance.status } : null));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleAssignStaff = async (staffId: string | null) => {
    if (!grievance) return;
    try {
      const res = await apiClient.patch(`/grievances/${id}`, { assignedToUserId: staffId });
      setGrievance((prev) => (prev ? { ...prev, assignedToUser: res.data.grievance.assignedToUser } : null));
    } catch (err) {
      alert('Failed to assign staff');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await apiClient.post(`/grievances/${id}/comments`, { body: newComment });
      setGrievance((prev) =>
        prev
          ? {
              ...prev,
              comments: [...prev.comments, res.data.comment],
            }
          : null
      );
      setNewComment('');
    } catch (err) {
      alert('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!grievance) {
    return (
      <div className="p-8 text-center text-gray-500">
        Grievance ticket not found. <Link to="/grievances" className="text-sky-600 underline">Back to List</Link>
      </div>
    );
  }

  const isStaffOrAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const isAuthor = user?.id === grievance.raisedByUser.id;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link to="/grievances" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition">
          <ArrowLeft className="w-4 h-4" />
          Back to Grievances
        </Link>
      </div>

      {/* Ticket Header Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CategoryBadge category={grievance.category} />
              {grievance.room?.roomNumber && (
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                  Room {grievance.room.roomNumber}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{grievance.title}</h1>
            <p className="text-xs text-gray-500 mt-1">
              Raised by <strong className="text-gray-700">{grievance.raisedByUser.name}</strong> •{' '}
              {new Date(grievance.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <StatusBadge status={grievance.status} />
          </div>
        </div>

        {/* Description Body */}
        <div className="prose prose-sm max-w-none text-gray-800 py-2">
          <p className="whitespace-pre-wrap leading-relaxed">{grievance.description}</p>
        </div>

        {/* Photo Attachment Thumbnail if exists */}
        {grievance.photoUrl && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
              <ImageIcon className="w-4 h-4 text-sky-600" />
              Attached Photo
            </div>
            <img
              src={grievance.photoUrl}
              alt="Grievance Attachment"
              className="max-h-60 rounded-lg border border-gray-300 object-cover"
              onError={(e) => {
                // Fallback placeholder image for mock URLs
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <a
              href={grievance.photoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-sky-600 hover:underline mt-1 block"
            >
              View image full size ↗
            </a>
          </div>
        )}

        {/* Workflow Controls (Staff/Admin or Ticket Owner) */}
        {(isStaffOrAdmin || isAuthor) && (
          <div className="pt-4 border-t border-gray-100 bg-sky-50/50 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-sky-600" />
                Workflow Controls:
              </span>
              <select
                value={grievance.status}
                onChange={(e) => handleStatusChange(e.target.value as Status)}
                className="text-xs font-semibold border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-800 shadow-sm focus:ring-sky-500"
              >
                {isStaffOrAdmin && <option value="OPEN">Status: OPEN</option>}
                {isStaffOrAdmin && <option value="IN_PROGRESS">Status: IN PROGRESS</option>}
                {isStaffOrAdmin && <option value="RESOLVED">Status: RESOLVED</option>}
                <option value="CLOSED">Status: CLOSED</option>
              </select>
            </div>

            {isStaffOrAdmin && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Assigned Staff:</span>
                <span className="text-xs font-semibold text-sky-700 bg-sky-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  {grievance.assignedToUser?.name || 'Unassigned'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Threaded Comments Section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
          Updates & Discussion ({grievance.comments.length})
        </h3>

        {grievance.comments.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">
            No comments yet. Write a comment below to communicate with warden/staff.
          </p>
        ) : (
          <div className="space-y-4">
            {grievance.comments.map((comment) => (
              <div key={comment.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{comment.author.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                      comment.author.role === 'ADMIN' || comment.author.role === 'STAFF'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-sky-100 text-sky-700'
                    }`}>
                      {comment.author.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap mt-1">{comment.body}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add Comment Form */}
        <form onSubmit={handleAddComment} className="pt-4 border-t border-gray-100 space-y-3">
          <textarea
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add an update or response..."
            className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-sky-500 focus:border-sky-500"
            required
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingComment}
              className="inline-flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl transition shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {submittingComment ? 'Sending...' : 'Send Comment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
