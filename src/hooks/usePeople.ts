import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { decrypt } from '@/lib/crypto';
import type { Person } from '@/types';

export function usePeople(userId: string | undefined) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setPeople([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', userId, 'people'),
      orderBy('name'),
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const decrypted = await Promise.all(
        snapshot.docs.map(async (d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name as string,
            birthDate: data.birthDate as string,
            notes: data.notes ? await decrypt(data.notes as string) : '',
            createdAt: data.createdAt as string,
            updatedAt: data.updatedAt as string,
          } as Person;
        }),
      );
      setPeople(decrypted);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  return { people, loading };
}
