'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useFamily } from '@/hooks/useFamily';
import { getPeople, getGifts, createFamily, joinFamilyByCode, leaveFamily } from '@/lib/firestore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { family, familyId, partnerUids, loading: familyLoading } = useFamily(user?.uid);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const [creatingFamily, setCreatingFamily] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [familyError, setFamilyError] = useState('');
  const [leaving, setLeaving] = useState(false);

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

  async function handleCreateFamily() {
    if (!user) return;
    setCreatingFamily(true);
    setFamilyError('');
    try {
      await createFamily(user.uid);
    } catch {
      setFamilyError('Failed to create family. Please try again.');
    } finally {
      setCreatingFamily(false);
    }
  }

  async function handleJoin() {
    if (!user || !joinCode.trim()) return;
    setJoining(true);
    setFamilyError('');
    try {
      await joinFamilyByCode(user.uid, joinCode.trim());
      setJoinCode('');
    } catch (err) {
      setFamilyError(err instanceof Error ? err.message : 'Failed to join. Please check the code and try again.');
    } finally {
      setJoining(false);
    }
  }

  async function handleLeave() {
    if (!user || !familyId || !confirm('Leave family? You will no longer see shared people.')) return;
    setLeaving(true);
    try {
      await leaveFamily(user.uid, familyId);
    } catch {
      setFamilyError('Failed to leave family. Please try again.');
    } finally {
      setLeaving(false);
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

        {/* ── Family ────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-1 font-semibold text-purple-900">Family sharing</h2>
          <p className="mb-4 text-sm text-purple-500">
            Share birthdays and events with your family. People are shared by default — mark specific people as Private to hide them.
          </p>

          {familyError && <p className="mb-3 text-sm text-red-500">{familyError}</p>}

          {familyLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-200 border-t-purple-500" />
          ) : family ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl bg-purple-50 p-4">
                <p className="text-xs text-purple-500 mb-1">Your invite code</p>
                <p className="text-2xl font-mono font-bold tracking-widest text-purple-900">
                  {family.inviteCode}
                </p>
                <p className="mt-1 text-xs text-purple-400">
                  Share this code with family members so they can join.
                </p>
              </div>
              <p className="text-sm text-purple-700">
                {partnerUids.length === 0
                  ? 'No family members connected yet.'
                  : `${partnerUids.length} family member${partnerUids.length === 1 ? '' : 's'} connected.`}
              </p>
              <Button variant="ghost" onClick={handleLeave} disabled={leaving} className="self-start text-red-500 hover:bg-red-50 hover:text-red-600">
                {leaving ? 'Leaving…' : 'Leave family'}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Button onClick={handleCreateFamily} disabled={creatingFamily} className="self-start">
                {creatingFamily ? 'Creating…' : 'Create a family'}
              </Button>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    id="join-code"
                    label="Or join with a code"
                    placeholder="ABC123"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  />
                </div>
                <Button onClick={handleJoin} disabled={joining || !joinCode.trim()}>
                  {joining ? 'Joining…' : 'Join'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Export ────────────────────────────────────────────── */}
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

        {/* ── Account ───────────────────────────────────────────── */}
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
