'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, LogOut, Moon, Sun, User, CheckCheck, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationStore } from '@/stores/notificationStore';
import { useSocket } from '@/hooks/useSocket';
import { formatDistanceToNow } from 'date-fns';

export function Header() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [showNotifs, setShowNotifs] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  useSocket(token);

  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotificationStore();

  // Close panel on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const notifIcons: Record<string, string> = {
    incident: '🚨',
    action: '⚠️',
    permit: '📋',
    training: '📚',
    general: '🔔',
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 z-30 relative">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">HSE Pro Enterprise</h2>

      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                <span className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1">
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-slate-500">
                    No notifications yet
                  </div>
                ) : (
                  notifications.slice(0, 15).map((n) => (
                    <div
                      key={n.id}
                      className={`flex gap-3 px-4 py-3 border-b border-gray-50 dark:border-slate-700/50 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition ${!n.read ? 'bg-sky-50/50 dark:bg-sky-900/10' : ''}`}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.href) { router.push(n.href); setShowNotifs(false); }
                      }}
                    >
                      <span className="text-lg flex-shrink-0 mt-0.5">{notifIcons[n.type] || '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${!n.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-slate-300'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{n.message}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                          {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                        className="flex-shrink-0 text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User info + profile link */}
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
        >
          <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="text-right text-sm hidden sm:block">
            <div className="font-medium text-gray-900 dark:text-white leading-tight">
              {user ? `${user.first_name} ${user.last_name}` : '...'}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400">{user?.role}</div>
          </div>
        </button>

        <button
          onClick={logout}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400"
          aria-label="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
