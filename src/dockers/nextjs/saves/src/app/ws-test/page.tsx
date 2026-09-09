'use client';
import { useEffect, useState } from "react";
import { io, Socket } from 'socket.io-client'

export default function WebSocketTestPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string>('');
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    const socketInstance: Socket = io('https://localhost:4333', {
      path: '/socket.io/',
      transports: ['websocket'],
      secure: true,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      setSocketId(socketInstance.id || '');
      console.log('Connected to Nestjs WebSocket:', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      setSocketId('');
      console.log('Disconnected from WebSocket');
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    setSocket(socketInstance);
  }, []);

  const handleSendMessage = () => {
    if (!socket || !isConnected) {
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
          {isConnected ? `Connected (ID: ${socketId})` : 'Disconnected'}
        </span>
      </p>

      <div style={{ marginTop: '1rem'}}>
        <input
        type="text"
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
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

    </div>
  )

}