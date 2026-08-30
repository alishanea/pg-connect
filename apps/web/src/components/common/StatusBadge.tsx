import React from 'react';

export type Status = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

interface StatusBadgeProps {
  status: Status;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles: Record<Status, { bg: string; label: string }> = {
    OPEN: { bg: 'bg-amber-100 text-amber-800 border-amber-300', label: 'Open' },
    IN_PROGRESS: { bg: 'bg-blue-100 text-blue-800 border-blue-300', label: 'In Progress' },
    RESOLVED: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', label: 'Resolved' },
    CLOSED: { bg: 'bg-gray-100 text-gray-700 border-gray-300', label: 'Closed' },
  };

  const { bg, label } = styles[status] || styles.OPEN;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${bg}`}>
      {label}
    </span>
  );
};
