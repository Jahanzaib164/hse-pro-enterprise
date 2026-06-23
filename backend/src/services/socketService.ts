import { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

export function setSocketIO(server: SocketServer): void {
  io = server;
}

export function emitToOrg(orgId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`org:${orgId}`).emit(event, data);
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

export function emitToRole(orgId: string, role: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`role:${orgId}:${role}`).emit(event, data);
}
