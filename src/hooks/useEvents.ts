import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CalendarEvent } from '@/types';

export function useEvents(userId: string | undefined) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', userId, 'events'),
      orderBy('date'),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CalendarEvent)));
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  return { events, loading };
}
