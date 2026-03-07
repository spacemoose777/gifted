'use client';

import { FormEvent, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { WishlistItem, GiftType } from '@/types';

type WishlistFormData = Pick<
  WishlistItem,
  'itemName' | 'description' | 'type' | 'options' | 'watchOuts' | 'priceRange' | 'acquired'
>;

interface WishlistFormProps {
  initial?: WishlistFormData;
  onSubmit: (data: WishlistFormData) => Promise<void>;
  onCancel: () => void;
}

export function WishlistForm({ initial, onSubmit, onCancel }: WishlistFormProps) {
  const [itemName, setItemName] = useState(initial?.itemName ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [type, setType] = useState<GiftType>(initial?.type ?? 'gift');
  const [options, setOptions] = useState(initial?.options ?? '');
  const [watchOuts, setWatchOuts] = useState(initial?.watchOuts ?? '');
  const [priceRange, setPriceRange] = useState(initial?.priceRange ?? '');
  const [acquired, setAcquired] = useState(initial?.acquired ?? false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit({
        itemName: itemName.trim(),
        description: description.trim(),
        type,
        options: options.trim(),
        watchOuts: watchOuts.trim(),
        priceRange: priceRange.trim(),
        acquired,
      });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
      <Input
        id="wish-name"
        label="Item name"
        value={itemName}
        onChange={(e) => setItemName(e.target.value)}
        required
        autoFocus
      />
      <Select
        id="wish-type"
        label="Type"
        value={type}
        onChange={(e) => setType(e.target.value as GiftType)}
        options={[
          { value: 'gift', label: 'Gift' },
          { value: 'experience', label: 'Experience' },
        ]}
      />
      <Input
        id="wish-price"
        label="Price range"
        placeholder="e.g. $20–50"
        value={priceRange}
        onChange={(e) => setPriceRange(e.target.value)}
      />
      <Textarea
        id="wish-description"
        label="Description"
        placeholder="What is it, where to find it…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Textarea
        id="wish-options"
        label="Options / variants"
        placeholder="Colours, sizes, styles…"
        value={options}
        onChange={(e) => setOptions(e.target.value)}
      />
      <Textarea
        id="wish-watchouts"
        label="Watch-outs"
        placeholder="Things to note…"
        value={watchOuts}
        onChange={(e) => setWatchOuts(e.target.value)}
      />
      <label className="flex items-center gap-2 text-sm text-purple-900 cursor-pointer">
        <input
          type="checkbox"
          checked={acquired}
          onChange={(e) => setAcquired(e.target.checked)}
          className="rounded accent-purple-500"
        />
        Already got this
      </label>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
