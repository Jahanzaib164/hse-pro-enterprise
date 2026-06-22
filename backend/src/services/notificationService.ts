import { query } from '../config/database';
import type { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

export function setSocketServer(server: SocketServer): void {
  io = server;
}

export interface NotificationInput {
  userId: string;
  type: string;
  title: string;
  message?: string;
  data?: Record<string, unknown>;
}

export async function createNotification(
  input: NotificationInput
): Promise<void> {
  const result = await query(
    `INSERT INTO notifications(user_id, type, title, message, data)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [
      input.userId,
      input.type,
      input.title,
      input.message || null,
      JSON.stringify(input.data || {}),
    ]
  );
  if (io) {
    io.to(`user:${input.userId}`).emit('notification', result.rows[0]);
  }
}

export async function listNotifications(userId: string) {
  const result = await query(
    `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );
  return result.rows;
}

export async function markRead(userId: string, id: string) {
  await query(
    `UPDATE notifications SET read_at=now() WHERE id=$1 AND user_id=$2`,
    [id, userId]
  );
}
