'use client';

import { FormEvent, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { Gift, GiftType } from '@/types';

type GiftFormData = Pick<
  Gift,
  'itemName' | 'description' | 'type' | 'options' | 'watchOuts' | 'priceRange' | 'given' | 'givenTo'
>;

interface GiftFormProps {
  initial?: GiftFormData;
  onSubmit: (data: GiftFormData) => Promise<void>;
  onCancel: () => void;
}

export function GiftForm({ initial, onSubmit, onCancel }: GiftFormProps) {
  const [itemName, setItemName] = useState(initial?.itemName ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [type, setType] = useState<GiftType>(initial?.type ?? 'gift');
  const [options, setOptions] = useState(initial?.options ?? '');
  const [watchOuts, setWatchOuts] = useState(initial?.watchOuts ?? '');
  const [priceRange, setPriceRange] = useState(initial?.priceRange ?? '');
  const [given, setGiven] = useState(initial?.given ?? false);
  const [givenTo, setGivenTo] = useState(initial?.givenTo ?? '');
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
        given,
        givenTo: given && givenTo.trim() ? givenTo.trim() : null,
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
        id="gift-name"
        label="Item name"
        value={itemName}
        onChange={(e) => setItemName(e.target.value)}
        required
        autoFocus
      />
      <Select
        id="gift-type"
        label="Type"
        value={type}
        onChange={(e) => setType(e.target.value as GiftType)}
        options={[
          { value: 'gift', label: 'Gift' },
          { value: 'experience', label: 'Experience' },
        ]}
      />
      <Input
        id="gift-price"
        label="Price range"
        placeholder="e.g. $20–50"
        value={priceRange}
        onChange={(e) => setPriceRange(e.target.value)}
      />
      <Textarea
        id="gift-description"
        label="Description"
        placeholder="What is it, where to get it…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Textarea
        id="gift-options"
        label="Options / variants"
        placeholder="Colours, sizes, styles…"
        value={options}
        onChange={(e) => setOptions(e.target.value)}
      />
      <Textarea
        id="gift-watchouts"
        label="Watch-outs"
        placeholder="Things to avoid…"
        value={watchOuts}
        onChange={(e) => setWatchOuts(e.target.value)}
      />
      <label className="flex items-center gap-2 text-sm text-purple-900 cursor-pointer">
        <input
          type="checkbox"
          checked={given}
          onChange={(e) => setGiven(e.target.checked)}
          className="rounded accent-purple-500"
        />
        Already given
      </label>
      {given && (
        <Input
          id="gift-givento"
          label="Given to"
          placeholder="e.g. Christmas 2024"
          value={givenTo}
          onChange={(e) => setGivenTo(e.target.value)}
        />
      )}
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
