'use client';

import type { WishlistItem } from '@/types';

interface WishlistItemCardProps {
  item: WishlistItem;
  onClick: () => void;
}

const typeBg: Record<WishlistItem['type'], string> = {
  gift: 'bg-purple-100 text-purple-700',
  experience: 'bg-green-100 text-green-700',
};

export function WishlistItemCard({ item, onClick }: WishlistItemCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`font-semibold text-purple-900 ${item.acquired ? 'line-through opacity-50' : ''}`}>
            {item.itemName}
          </p>
          {item.description && (
            <p className="mt-0.5 text-xs text-purple-400 truncate">{item.description}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeBg[item.type]}`}>
            {item.type === 'experience' ? 'Experience' : 'Gift'}
          </span>
          {item.priceRange && (
            <span className="text-xs text-purple-400">{item.priceRange}</span>
          )}
          {item.acquired && (
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
              Got it
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
