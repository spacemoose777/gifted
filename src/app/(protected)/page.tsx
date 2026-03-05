'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePeople } from '@/hooks/usePeople';
import { addPerson } from '@/lib/firestore';
import { PersonCard } from '@/components/PersonCard';
import { PersonForm } from '@/components/PersonForm';
import { SearchBar } from '@/components/SearchBar';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Person } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const { people, loading } = usePeople(user?.uid);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = people.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleAdd(data: Pick<Person, 'name' | 'birthDate' | 'notes'>) {
    if (!user) return;
    await addPerson(user.uid, data);
    setShowAdd(false);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-purple-900">Gifted</h1>
        <Link href="/settings" className="rounded-xl px-3 py-2 text-sm text-purple-600 hover:bg-purple-100">
          Settings
        </Link>
      </div>

      {/* Controls */}
      <div className="mb-4 flex gap-2">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search people…" />
        </div>
        <Button onClick={() => setShowAdd(true)}>+ Add person</Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-purple-400">
          {search ? 'No people match your search.' : 'No people yet. Add someone!'}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <Modal title="Add person" onClose={() => setShowAdd(false)}>
          <PersonForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}
    </main>
  );
}
