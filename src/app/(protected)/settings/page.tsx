'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getPeople, getGifts } from '@/lib/firestore';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  async function handleExport() {
    if (!user) return;
    setExporting(true);
    setExportError('');

    try {
      const people = await getPeople(user.uid);

      const peopleWithGifts = await Promise.all(
        people.map(async (person) => {
          const gifts = await getGifts(user.uid, person.id);
          return { ...person, gifts };
        }),
      );

      const payload = JSON.stringify({ people: peopleWithGifts }, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const date = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gifted-export-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/" className="mb-4 inline-block text-sm text-purple-500 hover:underline">
        ← Dashboard
      </Link>

      <h1 className="mb-6 text-2xl font-semibold text-purple-900">Settings</h1>

      <div className="flex flex-col gap-4">
        {/* Export */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-1 font-semibold text-purple-900">Export data</h2>
          <p className="mb-4 text-sm text-purple-500">
            Downloads all your people and gift ideas as a JSON file. All encrypted fields are
            decrypted in the export.
          </p>
          {exportError && <p className="mb-3 text-sm text-red-500">{exportError}</p>}
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Export data'}
          </Button>
        </div>

        {/* Account */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-1 font-semibold text-purple-900">Account</h2>
          <p className="mb-4 text-sm text-purple-500">{user?.email}</p>
          <Button variant="ghost" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </div>
    </main>
  );
}
