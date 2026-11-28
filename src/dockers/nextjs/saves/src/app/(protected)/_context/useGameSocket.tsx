'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { refreshViaAuthBridge } from '../../../lib/socketAuthBridge';

interface GameSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  accessToken?: string;
  connectionError: string | null;
}

const GameSocketContext = createContext<GameSocketContextType>({
  socket: null,
  isConnected: false,
  connectionError: null,
});

interface GameSocketProviderProps {
  children: React.ReactNode;
  accessToken: string;
}

export function GameSocketProvider({
  children,
  accessToken,
}: GameSocketProviderProps) {
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
      setConnectionError('No access token is available for the game connection.');
      return;
    }

    let isMounted = true;
    let fallbackReconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const socketInstance: Socket = io('/game', {
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
    <GameSocketContext.Provider
      value={{
        socket,
        isConnected,
        accessToken,
        connectionError,
      }}
    >
      {children}
    </GameSocketContext.Provider>
  );
}

export function useGameSocket() {
  const context = useContext(GameSocketContext);
  if (!context) {
    throw new Error('useGameSocket must be used within a GameSocketProvider');
  }
  return context;
}
