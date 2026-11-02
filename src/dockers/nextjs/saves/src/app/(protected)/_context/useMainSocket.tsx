'use client';

import { useRouter } from "next/router";
import React, { Children, createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

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
  accessToken: string; // accessToken of the user
}

export function MainSocketProvider({
  children,
  accessToken
}: MainSocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {

    if (!accessToken) {
      setSocket(null);
      setIsConnected(false);
      setConnectionError("No access token is available for the connection.");
      return;
    }

    const socketInstance: Socket = io(window.location.origin, {
      path: '/socket.io/',
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
    <MainSocketContext.Provider value={{
      socket,
      isConnected,
      accessToken,
      connectionError,
    }}>
      {children}
    </MainSocketContext.Provider>
  );
}

export function useMainSocket() {
  const context = useContext(MainSocketContext);
  if (!context) {
    throw new Error('useMainSocket must be used within a MainSocketProvider');
  }
  return (context);
}
