'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getPerson, updatePerson, deletePerson } from '@/lib/firestore';
import { PersonForm } from '@/components/PersonForm';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Person } from '@/types';

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function PersonDetailPage({
  params,
}: {
  params: { personId: string };
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    getPerson(user.uid, params.personId).then((p) => {
      setPerson(p);
      setLoading(false);
    });
  }, [user, params.personId]);

  async function handleEdit(data: Pick<Person, 'name' | 'birthDate' | 'notes'>) {
    if (!user) return;
    await updatePerson(user.uid, params.personId, data);
    setPerson((prev) => (prev ? { ...prev, ...data } : prev));
    setShowEdit(false);
  }

  async function handleDelete() {
    if (!user || !confirm(`Delete ${person?.name}? This cannot be undone.`)) return;
    setDeleting(true);
    await deletePerson(user.uid, params.personId);
    router.push('/');
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-500" />
      </div>
    );
  }

  if (!person) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-6">
        <p className="text-purple-400">Person not found.</p>
        <Link href="/" className="mt-2 inline-block text-sm text-purple-600 underline">
          Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/" className="mb-4 inline-block text-sm text-purple-500 hover:underline">
        ← Dashboard
      </Link>

      {/* Person header */}
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-purple-900">{person.name}</h1>
            <p className="mt-1 text-sm text-purple-400">🎂 {formatDate(person.birthDate)}</p>
            {person.notes && (
              <p className="mt-3 text-sm text-purple-700 whitespace-pre-wrap">{person.notes}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" onClick={() => setShowEdit(true)}>Edit</Button>
            <Button variant="ghost" onClick={handleDelete} disabled={deleting}>Delete</Button>
          </div>
        </div>
      </div>

      {/* Gifts section */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-purple-900">Gift ideas</h2>
        <Button onClick={() => router.push(`/people/${params.personId}/gifts/new`)}>
          + Add gift
        </Button>
      </div>
      <div className="rounded-2xl bg-white p-8 text-center text-purple-400 shadow-sm">
        No gift ideas yet. Add one!
      </div>

      {showEdit && (
        <Modal title="Edit person" onClose={() => setShowEdit(false)}>
          <PersonForm
            initial={{ name: person.name, birthDate: person.birthDate, notes: person.notes }}
            onSubmit={handleEdit}
            onCancel={() => setShowEdit(false)}
          />
        </Modal>
      )}
    </main>
  );
}
