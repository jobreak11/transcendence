'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { refreshViaAuthBridge } from '../../../lib/socketAuthBridge';

interface MainSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  accessToken?: string;
  connectionError: string | null;
}

const MainSocketContext = createContext<MainSocketContextType>({
  socket: null,
  isConnected: false,
  connectionError: null,
});

interface MainSocketProviderProps {
  children: React.ReactNode;
  accessToken: string;
}

export function MainSocketProvider({
  children,
  accessToken,
}: MainSocketProviderProps) {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const hasTriedRefreshRef = useRef(false);

  useEffect(() => {
    hasTriedRefreshRef.current = false;

    if (!accessToken) {
      setSocket(null);
      setIsConnected(false);
      setConnectionError('No access token is available for the connection.');
      return;
    }

    let isMounted = true;
    let fallbackReconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const socketInstance: Socket = io('/', {
      path: '/socket.io',
      transports: ['websocket'],
      auth: { accessToken },
      autoConnect: true,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      hasTriedRefreshRef.current = false;
      setIsConnected(true);
      setConnectionError(null);
    });

    socketInstance.on('disconnect', (reason: string) => {
      setIsConnected(false);
      setConnectionError(`Socket disconnected: ${reason}`);
    });

    socketInstance.on('connect_error', async (error: Error) => {
      setIsConnected(false);

      if (!hasTriedRefreshRef.current) {
        hasTriedRefreshRef.current = true;
        socketInstance.disconnect(); // Stop retrying with stale token

        const ok = await refreshViaAuthBridge(() => router.refresh());
        if (!isMounted) return;

        if (ok) {
          // If token was rotated, router.refresh() updates `accessToken` prop and re-runs this effect.
          // If token was still valid (e.g., brief server restart), reconnect after 1.5s.
          fallbackReconnectTimer = setTimeout(() => {
            if (isMounted && !socketInstance.connected) {
              socketInstance.connect();
            }
          }, 1500);
          return;
        }
      }

      setConnectionError(error.message);
    });

    setSocket(socketInstance);

    return () => {
      isMounted = false;
      if (fallbackReconnectTimer) clearTimeout(fallbackReconnectTimer);
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    };
  }, [accessToken, router]);

  return (
    <MainSocketContext.Provider
      value={{
        socket,
        isConnected,
        accessToken,
        connectionError,
      }}
    >
      {children}
    </MainSocketContext.Provider>
  );
}

export function useMainSocket() {
  const context = useContext(MainSocketContext);
  if (!context) {
    throw new Error('useMainSocket must be used within a MainSocketProvider');
  }
  return context;
}
