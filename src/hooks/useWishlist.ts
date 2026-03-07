import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { decrypt } from '@/lib/crypto';
import type { WishlistItem } from '@/types';

export function useWishlist(userId: string | undefined) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', userId, 'wishlist'),
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
            type: data.type as WishlistItem['type'],
            options: data.options ? await decrypt(data.options as string) : '',
            watchOuts: data.watchOuts ? await decrypt(data.watchOuts as string) : '',
            priceRange: (data.priceRange as string) || '',
            acquired: (data.acquired as boolean) || false,
            createdAt: data.createdAt as string,
            updatedAt: data.updatedAt as string,
          } as WishlistItem;
        }),
      );
      setItems(decrypted);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  return { items, loading };
}
