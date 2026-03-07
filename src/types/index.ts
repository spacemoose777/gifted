export interface User {
  uid: string;
  email: string;
  createdAt: string; // ISO
}

export interface Person {
  id: string;
  name: string;
  // YYYY-MM-DD when year known, 0000-MM-DD when year unknown
  birthDate: string;
  notes: string; // stored encrypted, decrypted at read
  createdAt: string;
  updatedAt: string;
}

export type GiftType = 'experience' | 'gift';

export interface Gift {
  id: string;
  itemName: string;
  description: string;  // stored encrypted
  type: GiftType;
  options: string;      // stored encrypted
  watchOuts: string;    // stored encrypted
  priceRange: string;
  given: boolean;
  givenTo: string | null;
  // 'birthday' (default) | 'christmas' | eventId
  occasion: string;
  createdAt: string;
  updatedAt: string;
}

export interface GiftFilters {
  type?: GiftType;
  priceRange?: string;
  given?: boolean;
  occasion?: string;
}

export interface WishlistItem {
  id: string;
  itemName: string;
  description: string; // stored encrypted
  type: GiftType;
  options: string;     // stored encrypted
  watchOuts: string;   // stored encrypted
  priceRange: string;
  acquired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  name: string;
  date: string;    // MM-DD (annual, no year)
  type: 'anniversary' | 'other';
  personIds: string[];
  createdAt: string;
  updatedAt: string;
}
