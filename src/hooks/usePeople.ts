import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { decrypt } from '@/lib/crypto';
import type { Person } from '@/types';

async function decodePerson(id: string, data: Record<string, unknown>): Promise<Person> {
  return {
    id,
    name: data.name as string,
    birthDate: data.birthDate as string,
    notes: data.notes ? await decrypt(data.notes as string) : '',
    isPrivate: (data.isPrivate as boolean) || false,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
}

// Decode a partner's person — notes stay empty (encrypted with their key).
function decodeSharedPerson(id: string, data: Record<string, unknown>): Person {
  return {
    id,
    name: data.name as string,
    birthDate: data.birthDate as string,
    notes: '',
    isPrivate: false,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
}

export function usePeople(userId: string | undefined, partnerUids: string[] = []) {
  const [people, setPeople] = useState<Person[]>([]);
  const [sharedPeople, setSharedPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  // Own people subscription
  useEffect(() => {
    if (!userId) {
      setPeople([]);
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'users', userId, 'people'), orderBy('name'));
    return onSnapshot(q, async (snap) => {
      const decrypted = await Promise.all(snap.docs.map((d) => decodePerson(d.id, d.data())));
      setPeople(decrypted);
      setLoading(false);
    });
  }, [userId]);

  // Partner people subscriptions
  const partnerKey = partnerUids.join(',');
  useEffect(() => {
    if (partnerUids.length === 0) {
      setSharedPeople([]);
      return;
    }

    // Map from partnerUid → their non-private people
    const byPartner = new Map<string, Person[]>();
    partnerUids.forEach((uid) => byPartner.set(uid, []));

    const unsubs = partnerUids.map((partnerUid) => {
      const q = query(collection(db, 'users', partnerUid, 'people'), orderBy('name'));
      return onSnapshot(q, (snap) => {
        byPartner.set(
          partnerUid,
          snap.docs
            .filter((d) => !d.data().isPrivate)
            .map((d) => decodeSharedPerson(d.id, d.data())),
        );
        const merged = Array.from(byPartner.values())
          .flat()
          .sort((a, b) => a.name.localeCompare(b.name));
        setSharedPeople(merged);
      });
    });

    return () => unsubs.forEach((u) => u());
    // partnerKey is a stable string dep for the partnerUids array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerKey]);

  return { people, sharedPeople, loading };
}
