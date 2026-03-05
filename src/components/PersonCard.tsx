'use client';

import Link from 'next/link';
import type { Person } from '@/types';

function daysUntilBirthday(birthDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const birth = new Date(birthDate + 'T00:00:00');
  const next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long' });
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
            <span className="shrink-0 rounded-full bg-peach-100 bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-600">
              {days === 0 ? '🎂 Today!' : `${days}d`}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
