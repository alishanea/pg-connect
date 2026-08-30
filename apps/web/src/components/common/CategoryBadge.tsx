import React from 'react';

export type Category = 'MAINTENANCE' | 'FOOD' | 'CLEANLINESS' | 'SAFETY' | 'OTHER';

interface CategoryBadgeProps {
  category: Category;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const styles: Record<Category, string> = {
    MAINTENANCE: 'bg-purple-100 text-purple-700 border-purple-200',
    FOOD: 'bg-orange-100 text-orange-700 border-orange-200',
    CLEANLINESS: 'bg-teal-100 text-teal-700 border-teal-200',
    SAFETY: 'bg-red-100 text-red-700 border-red-200',
    OTHER: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const labels: Record<Category, string> = {
    MAINTENANCE: 'Maintenance',
    FOOD: 'Food Quality',
    CLEANLINESS: 'Cleanliness',
    SAFETY: 'Safety & Security',
    OTHER: 'Other',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[category] || styles.OTHER}`}>
      {labels[category] || category}
    </span>
  );
};
