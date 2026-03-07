'use client';

import Link from 'next/link';
import type { Person } from '@/types';

function daysUntilBirthday(birthDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [, mm, dd] = birthDate.split('-').map(Number);
  const next = new Date(today.getFullYear(), mm - 1, dd);
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}

function formatDate(iso: string): string {
  const [year, mm, dd] = iso.split('-').map(Number);
  const d = new Date(2000, mm - 1, dd);
  const base = d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long' });
  return year === 0 ? base : `${base} ${year}`;
}

export function PersonCard({ person }: { person: Person }) {
  const days = daysUntilBirthday(person.birthDate);
  const upcoming = days <= 30;

  return (
    <Link href={`/people/${person.id}`}>
      <div className="rounded-2xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-purple-900">{person.name}</p>
            <p className="mt-0.5 text-xs text-purple-400">{formatDate(person.birthDate)}</p>
          </div>
          {upcoming && (
            <span className="shrink-0 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-600">
              {days === 0 ? '🎂 Today!' : `${days}d`}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
