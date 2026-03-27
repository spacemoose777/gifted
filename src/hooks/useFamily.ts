import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Family } from '@/types';

export function useFamily(userId: string | undefined) {
  const [familyId, setFamilyId] = useState<string | null | undefined>(undefined); // undefined = still loading
  const [family, setFamily] = useState<Family | null>(null);

  // Subscribe to user doc to get familyId
  useEffect(() => {
    if (!userId) {
      setFamilyId(null);
      return;
    }
    return onSnapshot(doc(db, 'users', userId), (snap) => {
      setFamilyId(snap.exists() ? (snap.data().familyId ?? null) : null);
    });
  }, [userId]);

  // Subscribe to family doc once familyId is resolved
  useEffect(() => {
    if (familyId === undefined || !familyId) {
      setFamily(null);
      return;
    }
    return onSnapshot(doc(db, 'families', familyId), (snap) => {
      setFamily(snap.exists() ? ({ id: snap.id, ...snap.data() } as Family) : null);
    });
  }, [familyId]);

  const partnerUids = family
    ? family.memberUids.filter((uid) => uid !== userId)
    : [];

  return {
    family,
    familyId: familyId ?? null,
    partnerUids,
    loading: familyId === undefined,
  };
}
