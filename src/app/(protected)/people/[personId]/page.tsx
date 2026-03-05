'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useGifts } from '@/hooks/useGifts';
import { getPerson, updatePerson, deletePerson, addGift, updateGift, deleteGift } from '@/lib/firestore';
import { PersonForm } from '@/components/PersonForm';
import { GiftCard } from '@/components/GiftCard';
import { GiftForm } from '@/components/GiftForm';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Gift, GiftFilters, GiftType, Person } from '@/types';

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

type GiftFormData = Pick<Gift, 'itemName' | 'description' | 'type' | 'options' | 'watchOuts' | 'priceRange' | 'given' | 'givenTo'>;

export default function PersonDetailPage({ params }: { params: { personId: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const { gifts, loading: giftsLoading } = useGifts(user?.uid, params.personId);

  const [person, setPerson] = useState<Person | null>(null);
  const [personLoading, setPersonLoading] = useState(true);
  const [showEditPerson, setShowEditPerson] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Gift modal state
  const [showAddGift, setShowAddGift] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);

  // Filters
  const [filters, setFilters] = useState<GiftFilters>({});

  useEffect(() => {
    if (!user) return;
    getPerson(user.uid, params.personId).then((p) => {
      setPerson(p);
      setPersonLoading(false);
    });
  }, [user, params.personId]);

  // Unique price ranges for filter dropdown
  const priceRanges = Array.from(new Set(gifts.map((g) => g.priceRange).filter(Boolean)));

  const filteredGifts = gifts.filter((g) => {
    if (filters.type && g.type !== filters.type) return false;
    if (filters.priceRange && g.priceRange !== filters.priceRange) return false;
    if (filters.given !== undefined && g.given !== filters.given) return false;
    return true;
  });

  async function handleEditPerson(data: Pick<Person, 'name' | 'birthDate' | 'notes'>) {
    if (!user) return;
    await updatePerson(user.uid, params.personId, data);
    setPerson((prev) => (prev ? { ...prev, ...data } : prev));
    setShowEditPerson(false);
  }

  async function handleDeletePerson() {
    if (!user || !confirm(`Delete ${person?.name}? This cannot be undone.`)) return;
    setDeleting(true);
    await deletePerson(user.uid, params.personId);
    router.push('/');
  }

  async function handleAddGift(data: GiftFormData) {
    if (!user) return;
    await addGift(user.uid, params.personId, data);
    setShowAddGift(false);
  }

  async function handleUpdateGift(data: GiftFormData) {
    if (!user || !editingGift) return;
    await updateGift(user.uid, params.personId, editingGift.id, data);
    setEditingGift(null);
  }

  async function handleDeleteGift(giftId: string) {
    if (!user || !confirm('Delete this gift idea?')) return;
    await deleteGift(user.uid, params.personId, giftId);
    setEditingGift(null);
  }

  function setFilter<K extends keyof GiftFilters>(key: K, value: GiftFilters[K] | '') {
    setFilters((prev) => {
      const next = { ...prev };
      if (value === '') {
        delete next[key];
      } else {
        next[key] = value as GiftFilters[K];
      }
      return next;
    });
  }

  if (personLoading) {
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
        <Link href="/" className="mt-2 inline-block text-sm text-purple-600 underline">Back to dashboard</Link>
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
            <Button variant="ghost" onClick={() => setShowEditPerson(true)}>Edit</Button>
            <Button variant="ghost" onClick={handleDeletePerson} disabled={deleting}>Delete</Button>
          </div>
        </div>
      </div>

      {/* Gift list header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-purple-900">Gift ideas</h2>
        <Button onClick={() => setShowAddGift(true)}>+ Add gift</Button>
      </div>

      {/* Filters — only show when there are gifts */}
      {gifts.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {/* Type filter */}
          <select
            value={filters.type ?? ''}
            onChange={(e) => setFilter('type', e.target.value as GiftType | '')}
            className="rounded-xl border border-purple-200 bg-white px-3 py-1.5 text-xs text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">All types</option>
            <option value="gift">Gift</option>
            <option value="experience">Experience</option>
          </select>

          {/* Price range filter */}
          {priceRanges.length > 0 && (
            <select
              value={filters.priceRange ?? ''}
              onChange={(e) => setFilter('priceRange', e.target.value)}
              className="rounded-xl border border-purple-200 bg-white px-3 py-1.5 text-xs text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">All prices</option>
              {priceRanges.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}

          {/* Given filter */}
          <select
            value={filters.given === undefined ? '' : String(filters.given)}
            onChange={(e) => {
              const v = e.target.value;
              setFilter('given', v === '' ? '' : v === 'true');
            }}
            className="rounded-xl border border-purple-200 bg-white px-3 py-1.5 text-xs text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">All</option>
            <option value="false">Not given</option>
            <option value="true">Given</option>
          </select>

          {/* Clear filters */}
          {Object.keys(filters).length > 0 && (
            <button
              onClick={() => setFilters({})}
              className="rounded-xl px-3 py-1.5 text-xs text-purple-500 hover:bg-purple-100"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Gift list */}
      {giftsLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-purple-200 border-t-purple-500" />
        </div>
      ) : filteredGifts.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-purple-400 shadow-sm">
          {gifts.length === 0 ? 'No gift ideas yet. Add one!' : 'No gifts match the current filters.'}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredGifts.map((gift) => (
            <GiftCard key={gift.id} gift={gift} onClick={() => setEditingGift(gift)} />
          ))}
        </div>
      )}

      {/* Add gift modal */}
      {showAddGift && (
        <Modal title="Add gift idea" onClose={() => setShowAddGift(false)}>
          <GiftForm onSubmit={handleAddGift} onCancel={() => setShowAddGift(false)} />
        </Modal>
      )}

      {/* Edit gift modal */}
      {editingGift && (
        <Modal title="Edit gift idea" onClose={() => setEditingGift(null)}>
          <GiftForm
            initial={editingGift}
            onSubmit={handleUpdateGift}
            onCancel={() => setEditingGift(null)}
          />
          <div className="mt-3 border-t border-purple-100 pt-3">
            <Button
              variant="ghost"
              onClick={() => handleDeleteGift(editingGift.id)}
              className="text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              Delete gift
            </Button>
          </div>
        </Modal>
      )}

      {/* Edit person modal */}
      {showEditPerson && (
        <Modal title="Edit person" onClose={() => setShowEditPerson(false)}>
          <PersonForm
            initial={{ name: person.name, birthDate: person.birthDate, notes: person.notes }}
            onSubmit={handleEditPerson}
            onCancel={() => setShowEditPerson(false)}
          />
        </Modal>
      )}
    </main>
  );
}
