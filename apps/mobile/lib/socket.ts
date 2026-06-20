// Socket.IO singleton — mirrors apps/web/hooks/useSocket.ts.
// The gateway authenticates from handshake.auth.token, so we pass the bearer token there.
import { io, type Socket } from 'socket.io-client';
import { getTokenSync } from './auth';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';

let _socket: Socket | null = null;

export function getSocket(): Socket | null {
  return _socket;
}

export function initSocket(): Socket {
  if (_socket?.connected) return _socket;
  // Recreate if a stale (disconnected) instance exists so a fresh token is used.
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }

  _socket = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: { token: getTokenSync() },
  });
  return _socket;
}

export function disconnectSocket(): void {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}
