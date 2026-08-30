import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { CategoryBadge, Category } from '../components/common/CategoryBadge';
import { StatusBadge, Status } from '../components/common/StatusBadge';
import { BarChart3, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface AnalyticsSummary {
  totalCount: number;
  statusCounts: { OPEN: number; IN_PROGRESS: number; RESOLVED: number; CLOSED: number };
  categoryCounts: { MAINTENANCE: number; FOOD: number; CLEANLINESS: number; SAFETY: number; OTHER: number };
  avgResolutionTimeHours: number;
  resolvedCount: number;
}

export const AnalyticsPage: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await apiClient.get('/analytics/summary');
        setSummary(res.data.summary);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!summary) {
    return <div className="p-8 text-center text-gray-500">Failed to load analytics data.</div>;
  }

  const categoryList: { key: Category; count: number }[] = [
    { key: 'MAINTENANCE', count: summary.categoryCounts.MAINTENANCE },
    { key: 'FOOD', count: summary.categoryCounts.FOOD },
    { key: 'CLEANLINESS', count: summary.categoryCounts.CLEANLINESS },
    { key: 'SAFETY', count: summary.categoryCounts.SAFETY },
    { key: 'OTHER', count: summary.categoryCounts.OTHER },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Operational Metrics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Performance metrics for grievance resolution speeds and category distribution.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Total Tickets Raised</div>
            <div className="text-3xl font-extrabold text-gray-900 mt-1">{summary.totalCount}</div>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Resolved Count</div>
            <div className="text-3xl font-extrabold text-emerald-600 mt-1">{summary.resolvedCount}</div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Avg Resolution Speed</div>
            <div className="text-3xl font-extrabold text-indigo-600 mt-1">
              {summary.avgResolutionTimeHours} <span className="text-sm font-normal text-gray-500">hours</span>
            </div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Category Breakdown Progress Bars */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Grievance Distribution by Category</h2>

        <div className="space-y-4 pt-2">
          {categoryList.map((item) => {
            const percentage = summary.totalCount > 0 ? Math.round((item.count / summary.totalCount) * 100) : 0;
            return (
              <div key={item.key} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <CategoryBadge category={item.key} />
                  <span className="font-semibold text-gray-700">{item.count} tickets ({percentage}%)</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-600 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Breakdown Distribution */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Status Lifecycle Breakdown</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
            <div className="text-xs font-bold text-amber-800 uppercase">Open</div>
            <div className="text-2xl font-bold text-amber-900 mt-1">{summary.statusCounts.OPEN}</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
            <div className="text-xs font-bold text-blue-800 uppercase">In Progress</div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{summary.statusCounts.IN_PROGRESS}</div>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
            <div className="text-xs font-bold text-emerald-800 uppercase">Resolved</div>
            <div className="text-2xl font-bold text-emerald-900 mt-1">{summary.statusCounts.RESOLVED}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
            <div className="text-xs font-bold text-gray-700 uppercase">Closed</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{summary.statusCounts.CLOSED}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
