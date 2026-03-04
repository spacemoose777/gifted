export interface User {
  uid: string;
  email: string;
  createdAt: string; // ISO
}

export interface Person {
  id: string;
  name: string;
  birthDate: string; // ISO date string YYYY-MM-DD
  notes: string;     // stored encrypted, decrypted at read
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
  createdAt: string;
  updatedAt: string;
}

export interface GiftFilters {
  type?: GiftType;
  priceRange?: string;
  given?: boolean;
}
