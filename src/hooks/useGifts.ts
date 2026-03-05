import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { decrypt } from '@/lib/crypto';
import type { Gift } from '@/types';

export function useGifts(userId: string | undefined, personId: string | undefined) {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !personId) {
      setGifts([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', userId, 'people', personId, 'gifts'),
      orderBy('itemName'),
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const decrypted = await Promise.all(
        snapshot.docs.map(async (d) => {
          const data = d.data();
          return {
            id: d.id,
            itemName: data.itemName as string,
            description: data.description ? await decrypt(data.description as string) : '',
            type: data.type as Gift['type'],
            options: data.options ? await decrypt(data.options as string) : '',
            watchOuts: data.watchOuts ? await decrypt(data.watchOuts as string) : '',
            priceRange: data.priceRange as string,
            given: data.given as boolean,
            givenTo: (data.givenTo as string | null) ?? null,
            createdAt: data.createdAt as string,
            updatedAt: data.updatedAt as string,
          } as Gift;
        }),
      );
      setGifts(decrypted);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId, personId]);

  return { gifts, loading };
}
