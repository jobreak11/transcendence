'use client';
import { matchesGlob } from "path";
import { useEffect, useState } from "react";
import { io, Socket } from 'socket.io-client'
import { useMainSocket } from "../_context/useMainSocket";

interface BroadcastMessage {
  senderId?: string;
  content: {
    text: string;
    timestamp?: string;
  };
  timestamp?: string;
}

export function WebSocketTestComponent() {
  const {socket, isConnected, accessToken} = useMainSocket();

  //const [socket, setSocket] = useState<Socket | null>(null);
  //const [isConnected, setIsConnected] = useState(false);
  //const [socketId, setSocketId] = useState<string>('');

  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);

  useEffect(() => {

    if (!socket) {
      return ;
    }

    const handleIncomingMessage = (data: BroadcastMessage) => {
      console.log('New broadcast received', data);
      setMessages((prev) => [...prev, data]);
    }

    socket.on('onMessage', handleIncomingMessage);


    return () => {
      socket.off('onMessage', handleIncomingMessage)
    }
  }, [socket]);

  const handleSendMessage = () => {
    if (!socket || !isConnected || !messageText.trim()) {
      return ;
    }

    socket.emit('newMessage', {
      text: messageText,
      timestamp: new Date().toISOString(),
    });

    setMessageText('');
  };

  return (
    <div style={{padding: '2rem'}}>
      <h2> WebSocket Connection Status</h2>
      <p>
        Status:{' '}
        <span style={{color: isConnected ? 'green' : 'red', fontWeight: 'bold'}}>
          {isConnected ? `Connected (ID: ${socket.id})` : 'Disconnected'}
        </span>
      </p>

      <div style={{ marginTop: '1rem'}}>
        <input
        type="text"
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        placeholder="Enter message..."
        style={{padding: '0.5rem', marginRight: '0.5rem'}}
        ></input>
        <button
        onClick={handleSendMessage}
        disabled={!isConnected || !messageText.trim()}
        style={{ padding: '0.5rem 1rem'}}
        >
          Send to NestJS
        </button>

      </div>

      {/* Broadcast message feed */}
      <div className="mt-8 border-t border-zinc-100 pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-800">
            Broadcast Messages
          </h3>

          <span className="rounded-fulle bg-zinc-100 px-2.5
           py-0.5 text-xs font-medium text-zinc-600">
            {messages.length}
           </span>
        </div>

        {messages.length === 0 ? (
          <p className="mt-3 text-sm italic text-zinc-500">
            No messages received yet. Open another tab to test broadcasting!
          </p>
        ): (<div className="mt-4 flex max-h-96 flex-col
          gap-2.5 overflow-y-auto pr-1">
            {messages.map((msg, index) => (
              <div
                key={index}
                className="rounded-lg border border-zinc-200 
                bg-zinc-50 p-3.5 transition hover:bg-zinc-100/80"
              >
                <div className="text-xs font-semibold text-blue-600">
                    {msg.senderId ? `User: ${msg.senderId}` : 'Broadcast'}
                  </div>
                  <div className="mt-1 text-sm text-zinc-800 wrap-break-word">
                    {typeof msg.content === 'object'
                      ? msg.content.text
                      : String(msg.content)}
                  </div>
                  {msg.timestamp && (
                    <div className="mt-1.5 text-[11px] text-zinc-400">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  )}
              </div>
            ))}

          </div>)}

      </div>

    </div>
  )

}