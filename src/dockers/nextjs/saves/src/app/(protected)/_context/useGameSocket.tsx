'use client';

import { useRouter } from "next/router";
import React, { Children, createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

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
  accessToken: string; // accessToken of the user
}

export function GameSocketProvider({
  children,
  accessToken
}: GameSocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {

    if (!accessToken) {
      setSocket(null);
      setIsConnected(false);
      setConnectionError("No access token is available for the game connection.");
      return;
    }

    const socketInstance: Socket = io(window.location.origin, {
      path: '/socket.io/game',
      transports: ['websocket'],
      auth: {
        accessToken: accessToken
      },
      autoConnect: true,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
    });
    socketInstance.on('disconnect', (reason: string) => {
      setIsConnected(false);
      setConnectionError(`Socket disconnected: ${reason}`);
    });
    socketInstance.on('connect_error', (error: Error) => {
      setIsConnected(false);
      setConnectionError(error.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    };
  }, [accessToken]);

  return (
    <GameSocketContext.Provider value={{
      socket,
      isConnected,
      accessToken,
      connectionError,
    }}>
      {children}
    </GameSocketContext.Provider>
  );
}

export function useGameSocket() {
  const context = useContext(GameSocketContext);
  if (!context) {
    throw new Error('useGameSocket must be used within a GameSocketProvider');
  }
  return (context);
}
