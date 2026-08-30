import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Category } from '../components/common/CategoryBadge';
import { ArrowLeft, Send, Upload, AlertCircle, Image as ImageIcon } from 'lucide-react';

export const RaiseGrievancePage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('MAINTENANCE');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSimulatedPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Fetch presigned URL from API
      const presignRes = await apiClient.get(`/uploads/presign?filename=${encodeURIComponent(file.name)}`);
      const { uploadUrl, photoUrl: generatedPhotoUrl } = presignRes.data;

      // Mock upload call
      await apiClient.put(uploadUrl, file, {
        headers: { 'Content-Type': file.type },
      }).catch(() => {});

      setPhotoUrl(generatedPhotoUrl);
    } catch (err) {
      console.error(err);
      setError('Failed to upload attachment photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await apiClient.post('/grievances', {
        title,
        description,
        category,
        photoUrl: photoUrl || null,
      });

      navigate(`/grievances/${res.data.grievance.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit grievance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link to="/grievances" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition">
          <ArrowLeft className="w-4 h-4" />
          Back to Grievances
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Raise a New Grievance</h1>
        <p className="text-xs text-gray-500 mb-6">
          Describe the issue clearly. It will be immediately assigned to your PG warden or property owner.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-800">Issue Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AC unit blowing warm air, Water leakage in bathroom"
              className="mt-1 block w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="mt-1 block w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="MAINTENANCE">Maintenance (AC, Electrical, Plumbing, WiFi)</option>
              <option value="FOOD">Food Quality & Mess</option>
              <option value="CLEANLINESS">Cleanliness & Housekeeping</option>
              <option value="SAFETY">Safety & Security</option>
              <option value="OTHER">Other Concerns</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800">Detailed Description</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact details (when it started, room location, urgency)..."
              className="mt-1 block w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          {/* Photo Attachment */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Photo Attachment (Optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition border border-gray-300">
                <Upload className="w-4 h-4 text-gray-500" />
                {uploading ? 'Uploading...' : 'Choose File'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSimulatedPhotoUpload}
                  className="hidden"
                />
              </label>
              {photoUrl && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <ImageIcon className="w-4 h-4" /> Photo attached
                </span>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl transition shadow-sm disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Grievance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
