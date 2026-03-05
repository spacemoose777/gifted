import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Cached derived key — re-used for the lifetime of the session
let cachedKey: CryptoKey | null = null;

// ─── Helpers ────────────────────────────────────────────────────────────────

function bufferToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...Array.from(new Uint8Array(buf))));
}

function base64ToUint8(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

// ─── Key derivation ─────────────────────────────────────────────────────────

async function deriveKey(uid: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(uid),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 200_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Must be called once after the user signs in.
 * Fetches (or creates) the user's salt from Firestore, derives the AES-GCM
 * key, and caches it for the session.
 */
export async function initCrypto(uid: string): Promise<void> {
  const saltRef = doc(db, 'users', uid, 'config', 'encryption');
  const saltSnap = await getDoc(saltRef);

  let salt: Uint8Array;

  if (saltSnap.exists()) {
    salt = base64ToUint8(saltSnap.data().salt as string);
  } else {
    salt = crypto.getRandomValues(new Uint8Array(16));
    await setDoc(saltRef, { salt: bufferToBase64(salt.buffer as ArrayBuffer) });
  }

  cachedKey = await deriveKey(uid, salt);
}

/** Clears the cached key on logout. */
export function clearCryptoKey(): void {
  cachedKey = null;
}

/**
 * Encrypts a plaintext string with AES-GCM.
 * Returns a base64 string: IV (12 bytes) || ciphertext.
 */
export async function encrypt(plaintext: string): Promise<string> {
  if (!cachedKey) throw new Error('Crypto not initialised. Call initCrypto first.');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    cachedKey,
    enc.encode(plaintext),
  );
  // Concatenate iv + ciphertext into one buffer
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);
  return bufferToBase64(combined.buffer as ArrayBuffer);
}

/**
 * Decrypts a base64 string produced by `encrypt`.
 */
export async function decrypt(ciphertext: string): Promise<string> {
  if (!cachedKey) throw new Error('Crypto not initialised. Call initCrypto first.');
  const combined = base64ToUint8(ciphertext);
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    cachedKey,
    data.buffer as ArrayBuffer,
  );
  return new TextDecoder().decode(plaintext);
}
