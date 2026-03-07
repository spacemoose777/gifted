'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePeople } from '@/hooks/usePeople';
import { useWishlist } from '@/hooks/useWishlist';
import { addPerson, addWishlistItem, updateWishlistItem, deleteWishlistItem } from '@/lib/firestore';
import { PersonCard } from '@/components/PersonCard';
import { PersonForm } from '@/components/PersonForm';
import { SearchBar } from '@/components/SearchBar';
import { WishlistItemCard } from '@/components/WishlistItemCard';
import { WishlistForm } from '@/components/WishlistForm';
import { Logo } from '@/components/Logo';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Person, WishlistItem } from '@/types';

type WishlistFormData = Pick<WishlistItem, 'itemName' | 'description' | 'type' | 'options' | 'watchOuts' | 'priceRange' | 'acquired'>;

export default function DashboardPage() {
  const { user } = useAuth();
  const { people, loading: peopleLoading } = usePeople(user?.uid);
  const { items, loading: wishlistLoading } = useWishlist(user?.uid);

  const [search, setSearch] = useState('');
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddWish, setShowAddWish] = useState(false);
  const [editingWish, setEditingWish] = useState<WishlistItem | null>(null);

  const filtered = people.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleAddPerson(data: Pick<Person, 'name' | 'birthDate' | 'notes'>) {
    if (!user) return;
    await addPerson(user.uid, data);
    setShowAddPerson(false);
  }

  async function handleAddWish(data: WishlistFormData) {
    if (!user) return;
    await addWishlistItem(user.uid, data);
    setShowAddWish(false);
  }

  async function handleUpdateWish(data: WishlistFormData) {
    if (!user || !editingWish) return;
    await updateWishlistItem(user.uid, editingWish.id, data);
    setEditingWish(null);
  }

  async function handleDeleteWish(itemId: string) {
    if (!user || !confirm('Delete this wishlist item?')) return;
    await deleteWishlistItem(user.uid, itemId);
    setEditingWish(null);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <h1 className="text-2xl font-semibold text-purple-900">Gifted</h1>
        </div>
        <Link href="/settings" className="rounded-xl px-3 py-2 text-sm text-purple-600 hover:bg-purple-100">
          Settings
        </Link>
      </div>

      {/* ── People ─────────────────────────────────────────────── */}
      <div className="mb-4 flex gap-2">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search people…" />
        </div>
        <Button onClick={() => setShowAddPerson(true)}>+ Add person</Button>
      </div>

      {peopleLoading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-purple-400">
          {search ? 'No people match your search.' : 'No people yet. Add someone!'}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}

      {/* ── My Wishlist ────────────────────────────────────────── */}
      <div className="mt-10 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-purple-900">My wishlist</h2>
        <Button onClick={() => setShowAddWish(true)}>+ Add item</Button>
      </div>

      {wishlistLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-purple-200 border-t-purple-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-purple-400 rounded-2xl bg-white shadow-sm">
          Nothing on your wishlist yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <WishlistItemCard key={item.id} item={item} onClick={() => setEditingWish(item)} />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddPerson && (
        <Modal title="Add person" onClose={() => setShowAddPerson(false)}>
          <PersonForm onSubmit={handleAddPerson} onCancel={() => setShowAddPerson(false)} />
        </Modal>
      )}
      {showAddWish && (
        <Modal title="Add to wishlist" onClose={() => setShowAddWish(false)}>
          <WishlistForm onSubmit={handleAddWish} onCancel={() => setShowAddWish(false)} />
        </Modal>
      )}
      {editingWish && (
        <Modal title="Edit wishlist item" onClose={() => setEditingWish(null)}>
          <WishlistForm
            initial={editingWish}
            onSubmit={handleUpdateWish}
            onCancel={() => setEditingWish(null)}
          />
          <div className="mt-3 border-t border-purple-100 pt-3">
            <Button
              variant="ghost"
              onClick={() => handleDeleteWish(editingWish.id)}
              className="text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              Delete item
            </Button>
          </div>
        </Modal>
      )}
    </main>
  );
}
