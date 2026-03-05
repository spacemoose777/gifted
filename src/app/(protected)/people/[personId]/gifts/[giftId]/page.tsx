'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getGift, updateGift, deleteGift } from '@/lib/firestore';
import { GiftForm } from '@/components/GiftForm';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Gift } from '@/types';

type GiftFormData = Pick<Gift, 'itemName' | 'description' | 'type' | 'options' | 'watchOuts' | 'priceRange' | 'given' | 'givenTo'>;

export default function GiftDetailPage({
  params,
}: {
  params: { personId: string; giftId: string };
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [gift, setGift] = useState<Gift | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (!user) return;
    getGift(user.uid, params.personId, params.giftId).then((g) => {
      setGift(g);
      setLoading(false);
    });
  }, [user, params.personId, params.giftId]);

  async function handleUpdate(data: GiftFormData) {
    if (!user) return;
    await updateGift(user.uid, params.personId, params.giftId, data);
    setGift((prev) => (prev ? { ...prev, ...data } : prev));
    setShowEdit(false);
  }

  async function handleDelete() {
    if (!user || !confirm('Delete this gift idea?')) return;
    await deleteGift(user.uid, params.personId, params.giftId);
    router.push(`/people/${params.personId}`);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-500" />
      </div>
    );
  }

  if (!gift) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-6">
        <p className="text-purple-400">Gift not found.</p>
        <Link href={`/people/${params.personId}`} className="mt-2 inline-block text-sm text-purple-600 underline">
          Back
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href={`/people/${params.personId}`}
        className="mb-4 inline-block text-sm text-purple-500 hover:underline"
      >
        ← Back
      </Link>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h1 className={`text-2xl font-semibold text-purple-900 ${gift.given ? 'line-through opacity-50' : ''}`}>
            {gift.itemName}
          </h1>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" onClick={() => setShowEdit(true)}>Edit</Button>
            <Button variant="ghost" onClick={handleDelete} className="text-red-500 hover:bg-red-50">Delete</Button>
          </div>
        </div>

        <dl className="flex flex-col gap-3 text-sm">
          <Row label="Type" value={gift.type === 'experience' ? 'Experience' : 'Gift'} />
          {gift.priceRange && <Row label="Price range" value={gift.priceRange} />}
          {gift.description && <Row label="Description" value={gift.description} />}
          {gift.options && <Row label="Options / variants" value={gift.options} />}
          {gift.watchOuts && <Row label="Watch-outs" value={gift.watchOuts} />}
          <Row label="Given" value={gift.given ? `Yes${gift.givenTo ? ` — ${gift.givenTo}` : ''}` : 'No'} />
        </dl>
      </div>

      {showEdit && (
        <Modal title="Edit gift idea" onClose={() => setShowEdit(false)}>
          <GiftForm initial={gift} onSubmit={handleUpdate} onCancel={() => setShowEdit(false)} />
        </Modal>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-purple-400">{label}</dt>
      <dd className="mt-0.5 text-purple-900 whitespace-pre-wrap">{value}</dd>
    </div>
  );
}
