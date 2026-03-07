'use client';

import type { CalendarEvent, Person } from '@/types';

interface EventCardProps {
  event: CalendarEvent;
  people: Person[];
  onClick: () => void;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatEventDate(mmdd: string): string {
  const [month, day] = mmdd.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]}`;
}

const typeBg: Record<CalendarEvent['type'], string> = {
  anniversary: 'bg-pink-100 text-pink-700',
  other: 'bg-purple-100 text-purple-700',
};

export function EventCard({ event, people, onClick }: EventCardProps) {
  const involvedPeople = people.filter((p) => event.personIds.includes(p.id));
  const namesLabel = involvedPeople.map((p) => p.name.split(' ')[0]).join(' & ');

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-purple-900">{event.name}</p>
          {namesLabel && (
            <p className="mt-0.5 text-xs text-purple-400">{namesLabel}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeBg[event.type]}`}>
            {event.type === 'anniversary' ? 'Anniversary' : 'Event'}
          </span>
          <span className="text-xs text-purple-400">{formatEventDate(event.date)}</span>
        </div>
      </div>
    </button>
  );
}
