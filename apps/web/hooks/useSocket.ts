'use client';

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';

let _socket: Socket | null = null;

export function getSocket(): Socket | null {
  return _socket;
}

export function initSocket(): Socket {
  if (_socket?.connected) return _socket;

  _socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
    transports: ['websocket'],
    withCredentials: true, // sends the httpOnly cookie with the WS handshake
  });
  return _socket;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = initSocket();
  }, []);

  return socketRef;
}
