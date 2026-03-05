'use client';

import { FormEvent, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import type { Person } from '@/types';

interface PersonFormProps {
  initial?: Pick<Person, 'name' | 'birthDate' | 'notes'>;
  onSubmit: (data: Pick<Person, 'name' | 'birthDate' | 'notes'>) => Promise<void>;
  onCancel: () => void;
}

export function PersonForm({ initial, onSubmit, onCancel }: PersonFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), birthDate, notes: notes.trim() });
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
      <Input
        id="person-birthdate"
        label="Birthday"
        type="date"
        value={birthDate}
        onChange={(e) => setBirthDate(e.target.value)}
        required
      />
      <Textarea
        id="person-notes"
        label="Notes (private)"
        placeholder="Likes, dislikes, sizes…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
