'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <main className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-purple-900">Dashboard</h1>
        <Button variant="ghost" onClick={handleLogout}>Sign out</Button>
      </div>
      <p className="mt-2 text-sm text-purple-600">{user?.email}</p>
    </main>
  );
}
