'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from '@/stores/notificationStore';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export function useSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!token) return;

    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => console.log('[socket] connected'));
    socket.on('disconnect', () => console.log('[socket] disconnected'));

    socket.on('incident:new', (data: { reference_no: string; title: string; severity: string }) => {
      addNotification({
        type: 'incident',
        title: `New Incident: ${data.reference_no}`,
        message: `${data.title} — Severity: ${data.severity}`,
        href: '/incidents',
      });
    });

    socket.on('incident:updated', (data: { reference_no: string; status: string }) => {
      addNotification({
        type: 'incident',
        title: 'Incident Updated',
        message: `${data.reference_no} status changed to ${data.status}`,
        href: '/incidents',
      });
    });

    socket.on('permit:approval_needed', (data: { permit_number: string; title: string }) => {
      addNotification({
        type: 'permit',
        title: 'Permit Approval Required',
        message: `${data.permit_number}: ${data.title}`,
        href: '/permits',
      });
    });

    socket.on('action:overdue', (data: { title: string }) => {
      addNotification({
        type: 'action',
        title: 'Action Overdue',
        message: data.title,
        href: '/actions',
      });
    });

    socket.on('notification:new', (data: { title: string; message: string; href?: string }) => {
      addNotification({
        type: 'general',
        title: data.title,
        message: data.message,
        href: data.href,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [token, addNotification]);

  return socketRef.current;
}
