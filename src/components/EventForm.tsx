'use client';

import { FormEvent, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { CalendarEvent, Person } from '@/types';

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const DAYS = Array.from({ length: 31 }, (_, i) => {
  const v = String(i + 1).padStart(2, '0');
  return { value: v, label: String(i + 1) };
});

type EventFormData = Pick<CalendarEvent, 'name' | 'date' | 'type' | 'personIds'>;

interface EventFormProps {
  initial?: EventFormData;
  allPeople: Person[];
  lockedPersonId?: string;
  onSubmit: (data: EventFormData) => Promise<void>;
  onCancel: () => void;
}

export function EventForm({
  initial,
  allPeople,
  lockedPersonId,
  onSubmit,
  onCancel,
}: EventFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [month, setMonth] = useState(initial?.date?.split('-')[0] ?? '01');
  const [day, setDay] = useState(initial?.date?.split('-')[1] ?? '01');
  const [type, setType] = useState<CalendarEvent['type']>(initial?.type ?? 'anniversary');
  const [personIds, setPersonIds] = useState<string[]>(
    initial?.personIds ?? (lockedPersonId ? [lockedPersonId] : []),
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function togglePerson(id: string) {
    if (id === lockedPersonId) return;
    setPersonIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (personIds.length === 0) {
      setError('Select at least one person.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), date: `${month}-${day}`, type, personIds });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        id="event-name"
        label="Event name"
        placeholder="e.g. Wedding Anniversary"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoFocus
      />
      <Select
        id="event-type"
        label="Type"
        value={type}
        onChange={(e) => setType(e.target.value as CalendarEvent['type'])}
        options={[
          { value: 'anniversary', label: 'Anniversary' },
          { value: 'other', label: 'Other' },
        ]}
      />
      <div className="flex gap-2">
        <div className="flex-1">
          <Select
            id="event-month"
            label="Month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            options={MONTHS}
          />
        </div>
        <div className="w-24">
          <Select
            id="event-day"
            label="Day"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            options={DAYS}
          />
        </div>
      </div>
      {allPeople.length > 1 && (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-purple-900">People involved</p>
          <div className="flex flex-col gap-1.5 rounded-xl border border-purple-200 bg-white p-3">
            {allPeople.map((person) => (
              <label
                key={person.id}
                className={`flex items-center gap-2 text-sm text-purple-900 ${person.id === lockedPersonId ? 'opacity-50' : 'cursor-pointer'}`}
              >
                <input
                  type="checkbox"
                  checked={personIds.includes(person.id)}
                  onChange={() => togglePerson(person.id)}
                  disabled={person.id === lockedPersonId}
                  className="rounded accent-purple-500"
                />
                {person.name}
              </label>
            ))}
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
