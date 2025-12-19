'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// For WebSocket, we need to use the backend URL directly
// In production/ngrok, this should be the ngrok URL for the backend
// For local development, use localhost:3001
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useSocket(token: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect with or without token (anonymous viewing is allowed)
    const newSocket = io(SOCKET_URL, {
      auth: token ? { token } : {},
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected', token ? '(authenticated)' : '(anonymous)');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  return { socket, connected };
}

