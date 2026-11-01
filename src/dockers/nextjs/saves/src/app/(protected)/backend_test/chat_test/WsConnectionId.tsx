'use client';
import { useMainSocket } from "../../_context/useMainSocket";

export function WsConnectionId() {
  const {socket, isConnected, accessToken} = useMainSocket();
  return (
  <div className="p-4 m-4 bg-black/20 rounded-2xl">
    <span className="text-xl font-bold">
      WebsocketConnection:
    </span>
    <span>{isConnected ? `${socket.id}` : 'not connect yet'}</span>
  </div>)
}