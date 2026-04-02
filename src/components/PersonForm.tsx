'use client';

import { FormEvent, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import type { Person } from '@/types';

const MONTHS = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' },   { value: '04', label: 'April' },
  { value: '05', label: 'May' },     { value: '06', label: 'June' },
  { value: '07', label: 'July' },    { value: '08', label: 'August' },
  { value: '09', label: 'September' },{ value: '10', label: 'October' },
  { value: '11', label: 'November' },{ value: '12', label: 'December' },
];

const DAYS = Array.from({ length: 31 }, (_, i) => {
  const v = String(i + 1).padStart(2, '0');
  return { value: v, label: String(i + 1) };
});

function parseBirthDate(birthDate: string) {
  if (!birthDate) return { yearUnknown: false, fullDate: '', month: '01', day: '01' };
  if (birthDate.startsWith('0000-')) {
    const [, mm, dd] = birthDate.split('-');
    return { yearUnknown: true, fullDate: '', month: mm, day: dd };
  }
  return { yearUnknown: false, fullDate: birthDate, month: '01', day: '01' };
}

const REMINDER_OPTIONS = [
  { days: 30, label: '30 days before' },
  { days: 14, label: '14 days before' },
  { days: 7,  label: '7 days before' },
  { days: 0,  label: 'On the day' },
];
const DEFAULT_REMINDER_DAYS = [30, 14, 7, 0];

type PersonFormData = Pick<Person, 'name' | 'birthDate' | 'notes'> & { isPrivate: boolean; reminderDays: number[] };

interface PersonFormProps {
  initial?: Pick<Person, 'name' | 'birthDate' | 'notes'> & { isPrivate?: boolean; reminderDays?: number[] };
  onSubmit: (data: PersonFormData) => Promise<void>;
  onCancel: () => void;
}

export function PersonForm({ initial, onSubmit, onCancel }: PersonFormProps) {
  const parsed = parseBirthDate(initial?.birthDate ?? '');

  const [name, setName] = useState(initial?.name ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [yearUnknown, setYearUnknown] = useState(parsed.yearUnknown);
  const [fullDate, setFullDate] = useState(parsed.fullDate);
  const [month, setMonth] = useState(parsed.month);
  const [day, setDay] = useState(parsed.day);
  const [isPrivate, setIsPrivate] = useState(initial?.isPrivate ?? false);
  const [reminderDays, setReminderDays] = useState<number[]>(initial?.reminderDays ?? DEFAULT_REMINDER_DAYS);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function toggleReminder(days: number) {
    setReminderDays((prev) =>
      prev.includes(days) ? prev.filter((d) => d !== days) : [...prev, days],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const birthDate = yearUnknown ? `0000-${month}-${day}` : fullDate;
    if (!birthDate) {
      setError('Please enter a birthday.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), birthDate, notes: notes.trim(), isPrivate, reminderDays });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        id="person-name"
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoFocus
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-purple-900">Birthday</span>
          <label className="flex items-center gap-1.5 text-xs text-purple-500 cursor-pointer">
            <input
              type="checkbox"
              checked={yearUnknown}
              onChange={(e) => setYearUnknown(e.target.checked)}
              className="rounded accent-purple-500"
            />
            Year unknown
          </label>
        </div>
        {yearUnknown ? (
          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                id="person-month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                options={MONTHS}
              />
            </div>
            <div className="w-24">
              <Select
                id="person-day"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                options={DAYS}
              />
            </div>
          </div>
        ) : (
          <Input
            id="person-birthdate"
            type="date"
            value={fullDate}
            onChange={(e) => setFullDate(e.target.value)}
            required
          />
        )}
      </div>

      <Textarea
        id="person-notes"
        label="Notes (private)"
        placeholder="Likes, dislikes, sizes…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-purple-900">Birthday reminders</span>
        <div className="flex flex-col gap-1.5">
          {REMINDER_OPTIONS.map(({ days, label }) => (
            <label key={days} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reminderDays.includes(days)}
                onChange={() => toggleReminder(days)}
                className="rounded accent-purple-500"
              />
              <span className="text-sm text-purple-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="rounded accent-purple-500"
        />
        <span className="text-sm text-purple-900">
          Private <span className="text-purple-400 font-normal">(hide from family)</span>
        </span>
      </label>

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
