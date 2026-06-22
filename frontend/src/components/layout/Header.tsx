'use client';

import { Bell, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { Notification } from '@/types';

export function Header() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/users/notifications');
      return data.data;
    },
  });

  const unread = (notifications || []).filter((n) => !n.read_at).length;

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <h2 className="text-lg font-semibold">Command Center</h2>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-md p-2 hover:bg-muted"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <div className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unread}
            </span>
          )}
        </div>
        <div className="text-right text-sm">
          <div className="font-medium">
            {user ? `${user.first_name} ${user.last_name}` : '...'}
          </div>
          <div className="text-xs text-muted-foreground">{user?.role}</div>
        </div>
        <button onClick={logout} className="rounded-md p-2 hover:bg-muted" aria-label="Logout">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
