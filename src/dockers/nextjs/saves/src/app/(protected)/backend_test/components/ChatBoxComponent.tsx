'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useMainSocket } from '../../_context/useMainSocket';

export interface ChatRoom {
  id: string;
  roomName: string | null;
  type: 'PUBLIC' | 'PRIVATE' | 'DIRECT_MESSAGE' | string;
  role?: string;
  createdAt?: string;
  joinedAt?: string;
}

export interface IncomingMessagePayload {
  chatRoomId: string;
  senderUserId: string;
  message: string;
  type?: string;
  createdAt: string | Date;
}

export interface UnifiedMessage {
  id: string;
  chatRoomId: string;
  roomName: string;
  roomType: string;
  senderUserId: string;
  message: string;
  type: string;
  timestamp: string;
  rawCreatedAt: number;
}

function resolveFriendUserId(item: any): string {
  if (!item) return '';
  return (
    item.userId ||
    item.targetUserId ||
    item.friendUserId ||
    item.friendId ||
    item.friend?.id ||
    item.id ||
    ''
  );
}

function resolveFriendName(item: any): string {
  if (!item) return 'Unknown';
  return (
    item.username ||
    item.name ||
    item.friend?.username ||
    resolveFriendUserId(item).slice(0, 8)
  );
}

export function ChatBoxComponent() {
  const { socket, isConnected, accessToken } = useMainSocket();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [activeSendRoomId, setActiveSendRoomId] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [showTabs, setShowTabs] = useState<boolean>(true);
  const [loadingDmTarget, setLoadingDmTarget] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadedHistoryRooms = useRef<Set<string>>(new Set());

  const roomsRef = useRef<ChatRoom[]>([]);
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  // Helper to fetch history for a single room
  const fetchRoomHistory = async (roomId: string, currentRooms = roomsRef.current) => {
    try {
      const res = await fetch(`/api/chat/message?chatRoomId=${roomId}`);
      if (!res.ok) return [];

      const data = await res.json();
      if (!Array.isArray(data)) return [];

      const targetRoom = currentRooms.find((r) => r.id === roomId);

      return data.map((item: any) => {
        const d = item.createdAt ? new Date(item.createdAt) : new Date();
        const time = !isNaN(d.getTime())
          ? d.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : '--:--:--';
        return {
          id: item.chatMessageId || `${roomId}-${d.getTime()}-${Math.random()}`,
          chatRoomId: item.chatRoomId || roomId,
          roomName: targetRoom?.roomName || roomId.slice(0, 6),
          roomType: targetRoom?.type || 'PUBLIC',
          senderUserId: item.senderUserId || 'System',
          message: item.messageText || item.message || '',
          type: item.type || 'NORMAL',
          timestamp: time,
          rawCreatedAt: d.getTime(),
        } as UnifiedMessage;
      });
    } catch (err) {
      console.error(`Failed to fetch history for room ${roomId}:`, err);
      return [];
    }
  };

  // 1. Fetch available chat rooms and their initial message histories
  const loadRoomsAndHistory = async () => {
    try {
      const res = await fetch('/api/chat');
      if (!res.ok) return;

      const data = await res.json();
      if (!Array.isArray(data)) return;

      setRooms(data);
      if (data.length > 0 && !activeSendRoomId) {
        setActiveSendRoomId(data[0].id);
      }

      // Fetch history for all joined rooms in parallel
      const unvisitedRooms = data.filter((r) => !loadedHistoryRooms.current.has(r.id));
      if (unvisitedRooms.length === 0) return;

      const historyBatches = await Promise.all(
        unvisitedRooms.map((r) => fetchRoomHistory(r.id, data))
      );

      unvisitedRooms.forEach((r) => loadedHistoryRooms.current.add(r.id));

      const combinedHistory = historyBatches.flat();

      // Merge with any existing messages and sort chronologically
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newUniqueHistory = combinedHistory.filter((m) => !existingIds.has(m.id));
        return [...prev, ...newUniqueHistory].sort((a, b) => a.rawCreatedAt - b.rawCreatedAt);
      });
    } catch (err) {
      console.error('Failed to load chat rooms:', err);
    }
  };

  // 2. Fetch friends list
  const loadFriends = async () => {
    try {
      const res = await fetch('/api/friend');
      if (!res.ok) return;

      const data = await res.json();
      if (data && Array.isArray(data.acceptedFriends)) {
        setFriends(data.acceptedFriends);
      } else if (Array.isArray(data)) {
        setFriends(data.filter((f) => !f.status || f.status === 'ACCEPTED'));
      }
    } catch (err) {
      console.error('Failed to load friends:', err);
    }
  };

  useEffect(() => {
    loadRoomsAndHistory();
    loadFriends();
  }, [accessToken]);

  // Keep target room valid
  useEffect(() => {
    if (rooms.length > 0 && !rooms.some((r) => r.id === activeSendRoomId)) {
      setActiveSendRoomId(rooms[0].id);
    }
  }, [rooms, activeSendRoomId]);

  // 3. Socket real-time message handler
  useEffect(() => {
    if (!socket || !isConnected) return;

    rooms.forEach((room) => {
      socket.emit('newJoinChatRoom', { chatRoomId: room.id });
    });

    const handleIncomingMessage = (payload: IncomingMessagePayload) => {
      const room = roomsRef.current.find((r) => r.id === payload.chatRoomId);
      const d = payload.createdAt ? new Date(payload.createdAt) : new Date();
      const time = !isNaN(d.getTime())
        ? d.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        : '--:--:--';

      const newMsg: UnifiedMessage = {
        id: `${payload.chatRoomId}-${d.getTime()}-${Math.random()}`,
        chatRoomId: payload.chatRoomId,
        roomName: room?.roomName || payload.chatRoomId?.slice(0, 6) || 'General',
        roomType: room?.type || 'PUBLIC',
        senderUserId: payload.senderUserId || 'System',
        message: payload.message,
        type: payload.type || 'NORMAL',
        timestamp: time,
        rawCreatedAt: d.getTime(),
      };

      setMessages((prev) => [...prev.slice(-250), newMsg]);
    };

    socket.on('onChatMessage', handleIncomingMessage);

    return () => {
      socket.off('onChatMessage', handleIncomingMessage);
    };
  }, [socket, isConnected, rooms]);

  // Auto-scroll
  const displayedMessages = useMemo(() => {
    if (activeFilter === 'ALL') return messages;
    return messages.filter((m) => m.chatRoomId === activeFilter);
  }, [messages, activeFilter]);

  useEffect(() => {
    if (autoScroll && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [displayedMessages, autoScroll]);

  // Send message
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSendRoomId || !socket) return;

    socket.emit('newChatMessage', {
      chatRoomId: activeSendRoomId,
      message: inputText.trim(),
    });

    setInputText('');
    inputRef.current?.focus();
  };

  // Direct Message a friend & fetch DM history if new
  const handleDirectMessageUser = async (friendItem: any) => {
    const targetUserId = resolveFriendUserId(friendItem);
    if (!targetUserId) return;

    try {
      setLoadingDmTarget(targetUserId);
      const res = await fetch(`/api/chat/dm?targetUserId=${targetUserId}`, {
        method: 'POST',
      });
      if (!res.ok) return;

      const data = await res.json();
      const roomId = data?.chatRoomId || data?.id;

      if (roomId) {
        socket?.emit('newJoinChatRoom', { chatRoomId: roomId });
        await loadRoomsAndHistory();

        // If history hasn't been loaded for this DM room, fetch it
        if (!loadedHistoryRooms.current.has(roomId)) {
          loadedHistoryRooms.current.add(roomId);
          const history = await fetchRoomHistory(roomId);
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newUnique = history.filter((m) => !existingIds.has(m.id));
            return [...prev, ...newUnique].sort((a, b) => a.rawCreatedAt - b.rawCreatedAt);
          });
        }

        setActiveSendRoomId(roomId);
        setActiveFilter(roomId);
        inputRef.current?.focus();
      }
    } catch (err) {
      console.error('Error starting DM:', err);
    } finally {
      setLoadingDmTarget(null);
    }
  };

  const getTextColor = (roomType: string, msgType?: string) => {
    if (msgType === 'SYSTEM_MESSAGE') return 'text-yellow-400';
    switch (roomType) {
      case 'DIRECT_MESSAGE':
        return 'text-fuchsia-400';
      case 'PRIVATE':
        return 'text-cyan-400';
      case 'GUILD':
        return 'text-green-400';
      default:
        return 'text-neutral-200';
    }
  };

  const activeSendRoom = rooms.find((r) => r.id === activeSendRoomId);

  return (
    <div className="w-full max-w-4xl border border-neutral-700 bg-neutral-950 font-mono text-xs text-neutral-300">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between border-b border-neutral-700 bg-neutral-900 px-2 py-1 text-neutral-400">
        <span>Chat Terminal</span>
        <div className="flex items-center gap-3 text-[11px]">
          <button
            type="button"
            onClick={() => setShowTabs((prev) => !prev)}
            className="hover:text-neutral-200 text-neutral-400"
          >
            [{showTabs ? 'Hide Tabs' : 'Show Tabs'}]
          </button>
          <button
            type="button"
            onClick={() => {
              loadRoomsAndHistory();
              loadFriends();
            }}
            className="hover:text-neutral-200"
          >
            [Refresh]
          </button>
          <span>WS: {isConnected ? 'connected' : 'disconnected'}</span>
        </div>
      </div>

      {/* Main Layout: Left Chat Log & Right Sidebar */}
      <div className="flex flex-col md:flex-row">
        {/* Left Column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Close-able Channel Tabs Bar */}
          {showTabs && (
            <div className="flex items-center justify-between border-b border-neutral-700 bg-neutral-900/50 select-none">
              <div className="flex overflow-x-auto scrollbar-none flex-1">
                <button
                  type="button"
                  onClick={() => setActiveFilter('ALL')}
                  className={`px-3 py-1 border-r border-neutral-700 hover:bg-neutral-800 ${
                    activeFilter === 'ALL'
                      ? 'bg-neutral-800 text-white font-bold'
                      : 'text-neutral-400'
                  }`}
                >
                  [All]
                </button>

                {rooms.map((room) => {
                  const isCurrent = activeFilter === room.id;
                  const isTarget = activeSendRoomId === room.id;
                  const name = room.roomName || room.id.slice(0, 6);

                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => {
                        setActiveFilter(room.id);
                        setActiveSendRoomId(room.id);
                      }}
                      className={`px-2.5 py-1 border-r border-neutral-700 hover:bg-neutral-800 whitespace-nowrap ${
                        isCurrent
                          ? 'bg-neutral-800 text-white font-bold'
                          : 'text-neutral-400'
                      }`}
                    >
                      [{name}] {isTarget && '*'}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setShowTabs(false)}
                className="px-2 py-1 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 border-l border-neutral-700 text-[11px]"
                title="Close tabs bar"
              >
                ✕
              </button>
            </div>
          )}

          {/* Messages Board */}
          <div
            ref={chatContainerRef}
            className="h-72 overflow-y-auto p-2 space-y-0.5 bg-black/90 select-text leading-snug"
          >
            {displayedMessages.length === 0 && (
              <div className="text-neutral-600 italic">No messages</div>
            )}

            {displayedMessages.map((msg) => {
              const color = getTextColor(msg.roomType, msg.type);

              return (
                <div key={msg.id} className="break-all">
                  <span className="text-neutral-500 mr-1">[{msg.timestamp}]</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSendRoomId(msg.chatRoomId);
                      setActiveFilter(msg.chatRoomId);
                    }}
                    className="text-neutral-400 hover:underline mr-1"
                  >
                    [{msg.roomName}]
                  </button>
                  <span className="text-neutral-300 mr-1">
                    &lt;{msg.senderUserId.slice(0, 8)}&gt;:
                  </span>
                  <span className={color}>{msg.message}</span>
                </div>
              );
            })}
          </div>

          {/* Input Line */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-1 border-t border-neutral-700 bg-neutral-900 p-1.5"
          >
            <select
              value={activeSendRoomId}
              onChange={(e) => setActiveSendRoomId(e.target.value)}
              className="bg-neutral-950 text-neutral-300 border border-neutral-700 px-1 py-1 text-xs focus:outline-none max-w-[110px]"
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.roomName || room.id.slice(0, 6)}
                </option>
              ))}
            </select>

            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                activeSendRoom
                  ? `Message [${activeSendRoom.roomName || activeSendRoom.id.slice(0, 6)}]...`
                  : 'Type message...'
              }
              disabled={rooms.length === 0 || !isConnected}
              className="flex-1 bg-black text-neutral-100 border border-neutral-700 px-2 py-1 focus:outline-none disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || rooms.length === 0 || !isConnected}
              className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 px-3 py-1 text-neutral-200 disabled:opacity-40"
            >
              Send
            </button>

            <label className="flex items-center gap-1 text-[11px] text-neutral-400 ml-1 select-none">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              Scroll
            </label>
          </form>
        </div>

        {/* Right Column: Rooms and Friends */}
        <div className="w-full md:w-56 border-t md:border-t-0 md:border-l border-neutral-700 bg-neutral-950 flex flex-col h-auto md:h-[345px]">
          {/* Room List */}
          <div className="flex-1 flex flex-col min-h-[140px] border-b border-neutral-800">
            <div className="bg-neutral-900 px-2 py-1 border-b border-neutral-800 text-[11px] text-neutral-400 flex justify-between">
              <span>ROOMS ({rooms.length})</span>
            </div>
            <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
              {rooms.length === 0 && (
                <div className="text-neutral-600 p-1 italic text-[11px]">No rooms</div>
              )}
              {rooms.map((room) => {
                const isSelected = activeSendRoomId === room.id;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => {
                      setActiveFilter(room.id);
                      setActiveSendRoomId(room.id);
                    }}
                    className={`w-full text-left px-1.5 py-0.5 rounded-none flex items-center justify-between text-[11px] ${
                      isSelected
                        ? 'bg-neutral-800 text-white font-bold'
                        : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                    }`}
                  >
                    <span className="truncate">
                      {room.roomName || room.id.slice(0, 8)}
                    </span>
                    <span className="text-[9px] text-neutral-500 uppercase ml-1">
                      {room.type === 'DIRECT_MESSAGE' ? 'DM' : room.type.slice(0, 3)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Friends List */}
          <div className="flex-1 flex flex-col min-h-[140px]">
            <div className="bg-neutral-900 px-2 py-1 border-b border-neutral-800 text-[11px] text-neutral-400 flex justify-between">
              <span>FRIENDS ({friends.length})</span>
            </div>
            <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
              {friends.length === 0 && (
                <div className="text-neutral-600 p-1 italic text-[11px]">No friends found</div>
              )}
              {friends.map((friend, idx) => {
                const friendUserId = resolveFriendUserId(friend);
                const friendName = resolveFriendName(friend);
                const isResolving = loadingDmTarget === friendUserId;

                return (
                  <button
                    key={friend.id || friendUserId || idx}
                    type="button"
                    disabled={isResolving || !friendUserId}
                    onClick={() => handleDirectMessageUser(friend)}
                    className="w-full text-left px-1.5 py-0.5 flex items-center justify-between text-[11px] text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 disabled:opacity-50"
                    title={`Click to DM ${friendName}`}
                  >
                    <span className="truncate">{friendName}</span>
                    <span className="text-[10px] text-fuchsia-400 ml-1">
                      {isResolving ? '...' : '[DM]'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}