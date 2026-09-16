'use client';

import { useRouter } from "next/router";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface MainSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  accessToken?: string
}

const MainSocketContext = createContext<MainSocketContextType>({
  socket: null,
  isConnected: false
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

  useEffect(() => {

    if (!accessToken)
      return ;

    const socketInstance: Socket = io('https://localhost:4333', {
      path: '/socket.io/',
      transports: ['websocket'],
      secure: true,
      auth: {
        accessToken: accessToken
      },
      autoConnect: true,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => setIsConnected(true));
    socketInstance.on('disconnect', () => setIsConnected(false));

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [accessToken]);

  return (
    <MainSocketContext.Provider value={{socket, isConnected,  accessToken}}>
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