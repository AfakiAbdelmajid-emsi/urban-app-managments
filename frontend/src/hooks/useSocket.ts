'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * Get the Socket.IO server URL - always uses Railway production backend
 */
function getSocketUrl(): string {
  // Always use Railway production backend
  return process.env.NEXT_PUBLIC_SOCKET_URL || 'https://urban-app-managments-production.up.railway.app';
}

export function useSocket(token: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup previous socket if exists
    if (socketRef.current) {
      console.log('🔌 Cleaning up previous socket connection');
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current.close();
      socketRef.current = null;
    }

    // Clear any pending reconnection timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const socketUrl = getSocketUrl();
    console.log('🔌 Connecting to Socket.IO server:', socketUrl);

    // Connect with or without token (anonymous viewing is allowed)
    const newSocket = io(socketUrl, {
      auth: token ? { token } : {},
      transports: ['websocket'], // Force WebSocket transport (no polling)
      upgrade: false, // Disable transport upgrades
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });

    // Connection successful
    newSocket.on('connect', () => {
      console.log('✅ Socket connected', token ? '(authenticated)' : '(anonymous)');
      console.log('   Socket ID:', newSocket.id);
      console.log('   Transport:', newSocket.io.engine?.transport?.name || 'unknown');
      setConnected(true);
      setConnectionError(null);
    });

    // Disconnection
    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setConnected(false);
      
      // Log disconnection reason for debugging
      if (reason === 'io server disconnect') {
        setConnectionError('Server disconnected');
      } else if (reason === 'io client disconnect') {
        // Client intentionally disconnected
        setConnectionError(null);
      } else {
        setConnectionError('Connection lost');
      }
    });

    // Connection error
    newSocket.on('connect_error', (error: Error & { type?: string; description?: string; context?: any }) => {
      const errorMessage = error.message || 'Unknown connection error';
      console.error('❌ Socket connection error:', errorMessage);
      console.error('   Error details:', {
        type: error.type || 'unknown',
        description: error.description || 'none',
        context: error.context || 'none',
      });
      setConnectionError(errorMessage);
      setConnected(false);
    });

    // Reconnection attempt
    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
    });

    // Reconnection successful
    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      setConnectionError(null);
      setConnected(true);
    });

    // Reconnection failed
    newSocket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed - all attempts exhausted');
      setConnectionError('Failed to reconnect to server');
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      console.log('🔌 Cleaning up socket on unmount');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      newSocket.removeAllListeners();
      newSocket.disconnect();
      newSocket.close();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    };
  }, [token]);

  return { socket, connected, connectionError };
}

