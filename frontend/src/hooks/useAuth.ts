'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, isAuthenticated, logout as doLogout } from '@/lib/auth';
import type { User } from '@/types';

export function useAuth(redirectIfUnauth = true) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      if (redirectIfUnauth) router.replace('/login');
      setLoading(false);
      return;
    }
    setUser(getStoredUser());
    setLoading(false);
  }, [redirectIfUnauth, router]);

  const logout = async () => {
    await doLogout();
    router.replace('/login');
  };

  return { user, loading, logout };
}
