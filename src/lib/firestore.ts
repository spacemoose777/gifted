import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { encrypt, decrypt } from '@/lib/crypto';
import type { Person, Gift, WishlistItem, CalendarEvent } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

async function decryptPerson(id: string, data: Record<string, unknown>): Promise<Person> {
  return {
    id,
    name: data.name as string,
    birthDate: data.birthDate as string,
    notes: data.notes ? await decrypt(data.notes as string) : '',
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
}

async function decryptGift(id: string, data: Record<string, unknown>): Promise<Gift> {
  return {
    id,
    itemName: data.itemName as string,
    description: data.description ? await decrypt(data.description as string) : '',
    type: data.type as Gift['type'],
    options: data.options ? await decrypt(data.options as string) : '',
    watchOuts: data.watchOuts ? await decrypt(data.watchOuts as string) : '',
    priceRange: data.priceRange as string,
    given: data.given as boolean,
    givenTo: (data.givenTo as string | null) ?? null,
    occasion: (data.occasion as string) || 'birthday',
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
}

async function decryptWishlistItem(id: string, data: Record<string, unknown>): Promise<WishlistItem> {
  return {
    id,
    itemName: data.itemName as string,
    description: data.description ? await decrypt(data.description as string) : '',
    type: data.type as WishlistItem['type'],
    options: data.options ? await decrypt(data.options as string) : '',
    watchOuts: data.watchOuts ? await decrypt(data.watchOuts as string) : '',
    priceRange: (data.priceRange as string) || '',
    acquired: (data.acquired as boolean) || false,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
}

// ─── People ──────────────────────────────────────────────────────────────────

export async function getPeople(userId: string): Promise<Person[]> {
  const snap = await getDocs(
    query(collection(db, 'users', userId, 'people'), orderBy('name')),
  );
  return Promise.all(snap.docs.map((d) => decryptPerson(d.id, d.data())));
}

export async function getPerson(userId: string, personId: string): Promise<Person | null> {
  const snap = await getDoc(doc(db, 'users', userId, 'people', personId));
  if (!snap.exists()) return null;
  return decryptPerson(snap.id, snap.data());
}

export async function addPerson(
  userId: string,
  data: Pick<Person, 'name' | 'birthDate' | 'notes'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'users', userId, 'people'), {
    name: data.name,
    birthDate: data.birthDate,
    notes: await encrypt(data.notes),
    createdAt: now(),
    updatedAt: now(),
  });
  return ref.id;
}

export async function updatePerson(
  userId: string,
  personId: string,
  data: Partial<Pick<Person, 'name' | 'birthDate' | 'notes'>>,
): Promise<void> {
  const updates: Record<string, string> = { updatedAt: now() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.birthDate !== undefined) updates.birthDate = data.birthDate;
  if (data.notes !== undefined) updates.notes = await encrypt(data.notes);
  await updateDoc(doc(db, 'users', userId, 'people', personId), updates);
}

export async function deletePerson(userId: string, personId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'people', personId));
}

// ─── Gifts ───────────────────────────────────────────────────────────────────

export async function getGifts(userId: string, personId: string): Promise<Gift[]> {
  const snap = await getDocs(
    query(collection(db, 'users', userId, 'people', personId, 'gifts'), orderBy('itemName')),
  );
  return Promise.all(snap.docs.map((d) => decryptGift(d.id, d.data())));
}

export async function getGift(
  userId: string,
  personId: string,
  giftId: string,
): Promise<Gift | null> {
  const snap = await getDoc(
    doc(db, 'users', userId, 'people', personId, 'gifts', giftId),
  );
  if (!snap.exists()) return null;
  return decryptGift(snap.id, snap.data());
}

export async function addGift(
  userId: string,
  personId: string,
  data: Pick<Gift, 'itemName' | 'description' | 'type' | 'options' | 'watchOuts' | 'priceRange' | 'given' | 'givenTo' | 'occasion'>,
): Promise<string> {
  const ref = await addDoc(
    collection(db, 'users', userId, 'people', personId, 'gifts'),
    {
      itemName: data.itemName,
      description: await encrypt(data.description),
      type: data.type,
      options: await encrypt(data.options),
      watchOuts: await encrypt(data.watchOuts),
      priceRange: data.priceRange,
      given: data.given,
      givenTo: data.givenTo,
      occasion: data.occasion,
      createdAt: now(),
      updatedAt: now(),
    },
  );
  return ref.id;
}

export async function updateGift(
  userId: string,
  personId: string,
  giftId: string,
  data: Partial<Pick<Gift, 'itemName' | 'description' | 'type' | 'options' | 'watchOuts' | 'priceRange' | 'given' | 'givenTo' | 'occasion'>>,
): Promise<void> {
  const updates: Record<string, unknown> = { updatedAt: now() };
  if (data.itemName !== undefined) updates.itemName = data.itemName;
  if (data.type !== undefined) updates.type = data.type;
  if (data.priceRange !== undefined) updates.priceRange = data.priceRange;
  if (data.given !== undefined) updates.given = data.given;
  if (data.givenTo !== undefined) updates.givenTo = data.givenTo;
  if (data.occasion !== undefined) updates.occasion = data.occasion;
  if (data.description !== undefined) updates.description = await encrypt(data.description);
  if (data.options !== undefined) updates.options = await encrypt(data.options);
  if (data.watchOuts !== undefined) updates.watchOuts = await encrypt(data.watchOuts);
  await updateDoc(doc(db, 'users', userId, 'people', personId, 'gifts', giftId), updates);
}

export async function deleteGift(
  userId: string,
  personId: string,
  giftId: string,
): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'people', personId, 'gifts', giftId));
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export async function getWishlistItems(userId: string): Promise<WishlistItem[]> {
  const snap = await getDocs(
    query(collection(db, 'users', userId, 'wishlist'), orderBy('itemName')),
  );
  return Promise.all(snap.docs.map((d) => decryptWishlistItem(d.id, d.data())));
}

export async function addWishlistItem(
  userId: string,
  data: Pick<WishlistItem, 'itemName' | 'description' | 'type' | 'options' | 'watchOuts' | 'priceRange' | 'acquired'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'users', userId, 'wishlist'), {
    itemName: data.itemName,
    description: await encrypt(data.description),
    type: data.type,
    options: await encrypt(data.options),
    watchOuts: await encrypt(data.watchOuts),
    priceRange: data.priceRange,
    acquired: data.acquired,
    createdAt: now(),
    updatedAt: now(),
  });
  return ref.id;
}

export async function updateWishlistItem(
  userId: string,
  itemId: string,
  data: Partial<Pick<WishlistItem, 'itemName' | 'description' | 'type' | 'options' | 'watchOuts' | 'priceRange' | 'acquired'>>,
): Promise<void> {
  const updates: Record<string, unknown> = { updatedAt: now() };
  if (data.itemName !== undefined) updates.itemName = data.itemName;
  if (data.type !== undefined) updates.type = data.type;
  if (data.priceRange !== undefined) updates.priceRange = data.priceRange;
  if (data.acquired !== undefined) updates.acquired = data.acquired;
  if (data.description !== undefined) updates.description = await encrypt(data.description);
  if (data.options !== undefined) updates.options = await encrypt(data.options);
  if (data.watchOuts !== undefined) updates.watchOuts = await encrypt(data.watchOuts);
  await updateDoc(doc(db, 'users', userId, 'wishlist', itemId), updates);
}

export async function deleteWishlistItem(userId: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'wishlist', itemId));
}

// ─── Events ──────────────────────────────────────────────────────────────────

export async function getEvents(userId: string): Promise<CalendarEvent[]> {
  const snap = await getDocs(
    query(collection(db, 'users', userId, 'events'), orderBy('date')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CalendarEvent));
}

export async function addEvent(
  userId: string,
  data: Pick<CalendarEvent, 'name' | 'date' | 'type' | 'personIds'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'users', userId, 'events'), {
    ...data,
    createdAt: now(),
    updatedAt: now(),
  });
  return ref.id;
}

export async function updateEvent(
  userId: string,
  eventId: string,
  data: Partial<Pick<CalendarEvent, 'name' | 'date' | 'type' | 'personIds'>>,
): Promise<void> {
  await updateDoc(doc(db, 'users', userId, 'events', eventId), {
    ...data,
    updatedAt: now(),
  });
}

export async function deleteEvent(userId: string, eventId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'events', eventId));
}
