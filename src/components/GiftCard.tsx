'use client';

import type { Gift } from '@/types';

interface GiftCardProps {
  gift: Gift;
  occasionLabel?: string;
  onClick: () => void;
}

const typeLabel: Record<Gift['type'], string> = {
  gift: 'Gift',
  experience: 'Experience',
};

const typeBg: Record<Gift['type'], string> = {
  gift: 'bg-purple-100 text-purple-700',
  experience: 'bg-green-100 text-green-700',
};

const occasionBg: Record<string, string> = {
  christmas: 'bg-red-100 text-red-700',
  birthday: 'bg-yellow-100 text-yellow-700',
};

export function GiftCard({ gift, occasionLabel, onClick }: GiftCardProps) {
  const showOccasion = gift.occasion && gift.occasion !== 'birthday';
  const occLabel = occasionLabel ?? (gift.occasion === 'christmas' ? 'Christmas' : gift.occasion);
  const occBg = occasionBg[gift.occasion] ?? 'bg-pink-100 text-pink-700';

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`font-semibold text-purple-900 ${gift.given ? 'line-through opacity-50' : ''}`}>
            {gift.itemName}
          </p>
          {gift.description && (
            <p className="mt-0.5 text-xs text-purple-400 truncate">{gift.description}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeBg[gift.type]}`}>
            {typeLabel[gift.type]}
          </span>
          {showOccasion && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${occBg}`}>
              {occLabel}
            </span>
          )}
          {gift.priceRange && (
            <span className="text-xs text-purple-400">{gift.priceRange}</span>
          )}
          {gift.given && (
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
              Given
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
