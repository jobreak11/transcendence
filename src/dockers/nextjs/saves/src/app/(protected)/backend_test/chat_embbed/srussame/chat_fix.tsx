'use client';

import {
  ChatRoomDto,
  FindAllFriendshipsDto,
  ChatMessageDto,
  GetUserProfileDto,
} from '../../../../../types/dto'
import React, { FormEvent, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useMainSocket } from '../../../_context/useMainSocket';

export interface ChatRoom {
  id: string;
  roomName: string | null;
  visibilityType: 'PUBLIC' | 'PRIVATE' | 'DIRECT_MESSAGE';
  createdAt: string;
}

export interface UnifiedMessage {
  id: string;
  chatRoomId: string;
  roomName: string;
  roomType: string;
  senderUserId: string;
  message: string;
  type: 'USER_MESSAGE' | 'SYSTEM_MESSAGE' | string;
  timestamp: string;
  rawCreatedAt: number;
}

interface IncomingChatMessagePayload {
  id?: string;
  chatMessageId?: string;
  chatRoomId?: string | null;
  userId?: string | null;
  senderUserId?: string | null;
  messageText?: string;
  message?: string;
  type?: 'USER_MESSAGE' | 'SYSTEM_MESSAGE' | string;
  createdAt?: string | Date;
}

interface EventNotifyPayload {
  notifyStatus: 'JOIN_CHAT' | 'LEAVE_CHAT';
  chatRoomId: string;
}

const PUBLIC_ROOM: ChatRoom = {
  id: 'public',
  roomName: 'Global',
  visibilityType: 'PUBLIC',
  createdAt: new Date(0).toISOString(),
};

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

function buildMessageId(roomId: string, payload: IncomingChatMessagePayload): string {
  if (payload.id) return payload.id;
  if (payload.chatMessageId) return payload.chatMessageId;
  const sender = payload.userId || payload.senderUserId || 'System';
  const timeMs = payload.createdAt ? new Date(payload.createdAt).getTime() : Date.now();
  const text = payload.messageText || payload.message || '';
  return `${roomId}-${sender}-${timeMs}-${text}`;
}

function formatTimestamp(dateInput?: string | Date): { timestamp: string; rawCreatedAt: number } {
  const d = dateInput ? new Date(dateInput) : new Date();
  const isValid = !isNaN(d.getTime());
  return {
    timestamp: isValid
      ? d.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      : '--:--:--',
    rawCreatedAt: isValid ? d.getTime() : Date.now(),
  };
}

export function ChatEmbbed() {
  const { socket, isConnected, accessToken } = useMainSocket();

  const [rooms, setRooms] = useState<ChatRoom[]>([PUBLIC_ROOM]);
  const [friends, setFriends] = useState<any[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('public');
  const [activeSendRoomId, setActiveSendRoomId] = useState<string>('public');
  const [inputText, setInputText] = useState<string>('');
  const [autoScroll] = useState<boolean>(true);
  const [loadingDmTarget, setLoadingDmTarget] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadedHistoryRooms = useRef<Set<string>>(new Set());
  const roomsRef = useRef<ChatRoom[]>(rooms);

  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  const getAuthHeaders = useCallback((): HeadersInit => {
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  }, [accessToken]);

  const resolveFriendName = useCallback(
    (item: any): string => {
      if (!item) return 'Unknown';
      const uid = resolveFriendUserId(item);
      return (
         (uid && userNames[uid]) ||
        item.displayName ||
        item.username ||
        item.name ||
        item.friend?.username ||
        (uid ? uid.slice(0, 8) : 'Unknown')
      );
    },
    [userNames]
  );

  // Fetch display name from /api/user/profile?id=...
  const fetchUserProfileName = useCallback(
    async (userId: string) => {
      if (!userId || userId === 'System' || userNames[userId]) return;
      try {
        const res = await fetch(`/api/user/profile?id=${encodeURIComponent(userId)}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) return;
        const profile = (await res.json()) as GetUserProfileDto;
        const displayName = profile?.user_profile?.displayName || profile?.tagId;
        if (displayName) {
          setUserNames((prev) => ({ ...prev, [userId]: displayName }));
        }
      } catch {
        // Ignore profile lookup failures silently
      }
    },
    [getAuthHeaders, userNames]
  );

  // Fetch Public Chat History (/api/chat/public)
  const loadPublicChatHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/public', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Public chat request failed: ${res.status}`);

      const data = (await res.json()) as ChatMessageDto[];
      if (!Array.isArray(data)) return;

      const history: UnifiedMessage[] = data
        .slice()
        .reverse()
        .map((item) => {
          const { timestamp, rawCreatedAt } = formatTimestamp(item.createdAt);
          return {
            id: buildMessageId('public', item),
            chatRoomId: 'public',
            roomName: 'Global',
            roomType: 'PUBLIC',
            senderUserId: item.userId || 'System',
            message: item.messageText || '',
            type: item.type || 'USER_MESSAGE',
            timestamp,
            rawCreatedAt,
          };
        });

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newHistory = history.filter((m) => !existingIds.has(m.id));
        return [...prev, ...newHistory].sort((a, b) => a.rawCreatedAt - b.rawCreatedAt);
      });
    } catch (err) {
      console.error('Failed to fetch public chat history:', err);
    }
  }, [getAuthHeaders]);

  // Fetch History for a single room (/api/chat/message?chatRoomId=...)
  const fetchRoomHistory = useCallback(
    async (roomId: string, currentRooms = roomsRef.current): Promise<UnifiedMessage[] | null> => {
      if (roomId === 'public') return null;
      try {
        const res = await fetch(`/api/chat/message?chatRoomId=${encodeURIComponent(roomId)}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          const errorMsg = await res.text();
          console.error(`Failed to fetch history for room ${roomId}: ${res.status} ${errorMsg}`);
          return null;
        }

        const data = (await res.json()) as ChatMessageDto[];
        if (!Array.isArray(data)) return null;

        const targetRoom = currentRooms.find((r) => r.id === roomId);

        return data.map((item: any) => {
          const { timestamp, rawCreatedAt } = formatTimestamp(item.createdAt);
          return {
            id: buildMessageId(roomId, item),
            chatRoomId: roomId,
            roomName: targetRoom?.roomName || roomId.slice(0, 6),
            roomType: targetRoom?.visibilityType || 'PUBLIC',
            senderUserId: item.userId || item.senderUserId || 'System',
            message: item.messageText || item.message || '',
            type: item.type || 'USER_MESSAGE',
            timestamp,
            rawCreatedAt,
          };
        });
      } catch (err) {
        console.error(`Failed to fetch history for room ${roomId}:`, err);
        return null;
      }
    },
    [getAuthHeaders]
  );

  // Load Rooms & Initial Histories (/api/chat)
  const loadRoomsAndHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/chat', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return;

      const data = (await res.json()) as ChatRoomDto[];
      if (!Array.isArray(data)) return;

      let savedDmRooms: ChatRoom[] = [];
      try {
        const savedRooms = JSON.parse(localStorage.getItem('savedDmRooms') || '[]');
        if (Array.isArray(savedRooms)) {
          savedDmRooms = savedRooms.filter((room: ChatRoom) => room?.id && room.id !== 'public');
        }
      } catch (err) {
        console.error('Failed to restore saved DM rooms:', err);
      }

      const roomsById = new Map<string, ChatRoom>();
      roomsById.set(PUBLIC_ROOM.id, PUBLIC_ROOM);

      // Add saved DM rooms first, then let fresh API rooms override if present
      savedDmRooms.forEach((room) => roomsById.set(room.id, room));
      data.forEach((room) => {
        const existingSaved = roomsById.get(room.id);
        roomsById.set(room.id, {
          ...room,
          roomName: room.roomName || existingSaved?.roomName || room.id.slice(0, 6),
        });
      });

      const availableRooms = Array.from(roomsById.values());
      setRooms(availableRooms);

      const unvisitedRooms = availableRooms.filter(
        (r) => r.id !== 'public' && !loadedHistoryRooms.current.has(r.id)
      );
      if (unvisitedRooms.length === 0) return;

      const historyBatches = await Promise.all(
        unvisitedRooms.map((r) => fetchRoomHistory(r.id, availableRooms))
      );

      const combinedHistory = historyBatches.flatMap((history, index) => {
        if (history === null) return [];
        loadedHistoryRooms.current.add(unvisitedRooms[index].id);
        return history;
      });

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newUniqueHistory = combinedHistory.filter((m) => !existingIds.has(m.id));
        return [...prev, ...newUniqueHistory].sort((a, b) => a.rawCreatedAt - b.rawCreatedAt);
      });
    } catch (err) {
      console.error('Failed to load chat rooms:', err);
    }
  }, [fetchRoomHistory, getAuthHeaders]);

  // Load Friends (/api/friend)
  const loadFriends = useCallback(async () => {
    try {
      const res = await fetch('/api/friend', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return;

      const data = (await res.json()) as FindAllFriendshipsDto;
      let acceptedList: any[] = [];

      if (data && Array.isArray(data.acceptedFriends)) {
        acceptedList = data.acceptedFriends;
      } else if (Array.isArray(data)) {
        acceptedList = data.filter((f) => !f.status || f.status === 'ACCEPTED');
      }

      setFriends(acceptedList);
      acceptedList.forEach((f) => {
        const uid = resolveFriendUserId(f);
        if (uid) fetchUserProfileName(uid);
      });
    } catch (err) {
      console.error('Failed to load friends:', err);
    }
  }, [fetchUserProfileName, getAuthHeaders]);

  // Start or Focus Direct Message (/api/chat/dm)
  const handleDirectMessageUser = async (friendItem: any) => {
    const targetUserId = resolveFriendUserId(friendItem);
    if (!targetUserId) return;

    try {
      setLoadingDmTarget(targetUserId);
      const res = await fetch(`/api/chat/dm?targetUserId=${encodeURIComponent(targetUserId)}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) return;

      const data = (await res.json()) as ChatRoomDto & { chatRoomId?: string };
      const roomId = data?.id || data?.chatRoomId;

      if (roomId) {
        const friendLabel = resolveFriendName(friendItem);
        const newRoom: ChatRoom = {
          id: roomId,
          roomName: data.roomName || friendLabel,
          visibilityType: data.visibilityType || 'DIRECT_MESSAGE',
          createdAt: data.createdAt || new Date().toISOString(),
        };

        let nextRoomsSnapshot: ChatRoom[] = [];
        setRooms((prev) => {
          const exists = prev.some((r) => r.id === roomId);
          const updatedRooms = exists
            ? prev.map((r) => (r.id === roomId ? { ...r, roomName: r.roomName || friendLabel } : r))
            : [...prev, newRoom];
          nextRoomsSnapshot = updatedRooms;
          localStorage.setItem(
            'savedDmRooms',
            JSON.stringify(updatedRooms.filter((r) => r.id !== 'public'))
          );
          return updatedRooms;
        });

        if (!loadedHistoryRooms.current.has(roomId)) {
          const history = await fetchRoomHistory(
            roomId,
            nextRoomsSnapshot.length ? nextRoomsSnapshot : [...roomsRef.current, newRoom]
          );
          if (history !== null) {
            loadedHistoryRooms.current.add(roomId);
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const newUnique = history.filter((m) => !existingIds.has(m.id));
              return [...prev, ...newUnique].sort((a, b) => a.rawCreatedAt - b.rawCreatedAt);
            });
          }
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

  // Initial Data Load on Mount / Token Change
  useEffect(() => {
    loadedHistoryRooms.current.clear();
    loadPublicChatHistory();
    loadRoomsAndHistory();
    loadFriends();
  }, [accessToken, loadPublicChatHistory, loadRoomsAndHistory, loadFriends]);

  // Fallback if active room is closed
  useEffect(() => {
    if (rooms.length > 0 && !rooms.some((r) => r.id === activeSendRoomId)) {
      setActiveSendRoomId('public');
      setActiveFilter('public');
    }
  }, [rooms, activeSendRoomId]);

  // WebSocket Listeners: main:chat:message:to_client & main:chat:event_notify:to_client
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleIncomingMessage = (payload: IncomingChatMessagePayload) => {
      const { timestamp, rawCreatedAt } = formatTimestamp(payload.createdAt);
      const targetRoomId = payload.chatRoomId || 'public';
      const roomData = roomsRef.current.find((r) => r.id === targetRoomId);

      const newMsg: UnifiedMessage = {
        id: buildMessageId(targetRoomId, payload),
        chatRoomId: targetRoomId,
        roomName:
          roomData?.roomName || (targetRoomId === 'public' ? 'Global' : targetRoomId.slice(0, 6)),
        roomType: roomData?.visibilityType || (targetRoomId === 'public' ? 'PUBLIC' : 'DIRECT_MESSAGE'),
        senderUserId: payload.userId || payload.senderUserId || 'System',
        message: payload.messageText || payload.message || '',
        type: payload.type || 'USER_MESSAGE',
        timestamp,
        rawCreatedAt,
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev.slice(-250), newMsg];
      });
    };

    const handleEventNotify = (payload: EventNotifyPayload) => {
      if (!payload?.chatRoomId) return;
      if (payload.notifyStatus === 'JOIN_CHAT') {
        loadRoomsAndHistory();
      } else if (payload.notifyStatus === 'LEAVE_CHAT') {
        setRooms((prev) => {
          const updated = prev.filter((r) => r.id !== payload.chatRoomId);
          localStorage.setItem(
            'savedDmRooms',
            JSON.stringify(updated.filter((r) => r.id !== 'public'))
          );
          return updated;
        });
      }
    };

    socket.on('main:chat:message:to_client', handleIncomingMessage);
    socket.on('main:chat:event_notify:to_client', handleEventNotify);

    return () => {
      socket.off('main:chat:message:to_client', handleIncomingMessage);
      socket.off('main:chat:event_notify:to_client', handleEventNotify);
    };
  }, [socket, isConnected, loadRoomsAndHistory]);

  // Filter Messages by Selected Room Tab
  const displayMessages = useMemo(() => {
    if (activeFilter === 'ALL') return messages;
    return messages.filter((m) => m.chatRoomId === activeFilter);
  }, [messages, activeFilter]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (autoScroll && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [displayMessages, autoScroll]);

  // Send Message via WebSocket (main:chat:message:to_server)
  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !isConnected) return;

    const messageText = inputText.trim();
    const targetRoomId = activeSendRoomId;
    const targetRoom = roomsRef.current.find((r) => r.id === targetRoomId);

    socket.emit(
      'main:chat:message:to_server',
      {
        chatRoomId: targetRoomId === 'public' ? null : targetRoomId,
        messageText,
      },
      (payload: IncomingChatMessagePayload) => {
        if (!payload?.createdAt) return;
        const { timestamp, rawCreatedAt } = formatTimestamp(payload.createdAt);
        const resolvedRoomId = payload.chatRoomId || targetRoomId;

        const acknowledgedMessage: UnifiedMessage = {
          id: buildMessageId(resolvedRoomId, payload),
          chatRoomId: resolvedRoomId,
          roomName:
            targetRoom?.roomName ||
            (resolvedRoomId === 'public' ? 'Global' : resolvedRoomId.slice(0, 6)),
          roomType: targetRoom?.visibilityType || 'PUBLIC',
          senderUserId: payload.userId || 'System',
          message: payload.messageText || messageText,
          type: payload.type || 'USER_MESSAGE',
          timestamp,
          rawCreatedAt,
        };

        setMessages((previous) =>
          previous.some((item) => item.id === acknowledgedMessage.id)
            ? previous
            : [...previous.slice(-250), acknowledgedMessage]
        );
      }
    );

    setInputText('');
    inputRef.current?.focus();
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

  const nonDmChannels = useMemo(
    () => rooms.filter((r) => r.visibilityType !== 'DIRECT_MESSAGE'),
    [rooms]
  );

  return (
    <div className="flex flex-col p-10 items-center z-50 shadow-2xl">
      {/* กล่องหลัก */}
      <div className="w-[1465px] h-[867px] bg-[#B23441] rounded-lg shadow-md overflow-hidden flex flex-col font-sans">
        {/* แถบด้านบน */}
        <div className="w-full h-[75px] bg-[#7E090B] flex items-center shrink-0">
          <div className="h-full flex items-center px-6 border-r-[3px] border-[#1D1D1D]">
            <Image src="/Brand.svg" alt="Logo" width={40} height={40} />
          </div>

          {/* Tab ด้านบน */}
          <div className="flex-1 h-full flex items-center px-6 gap-3 overflow-x-auto">
            {rooms.map((room) => {
              const isCurrent = activeFilter === room.id;
              const isTarget = activeSendRoomId === room.id;
              const name = room.roomName || room.id.slice(0, 6);

              return (
                <div
                  key={room.id}
                  role="tab"
                  tabIndex={0}
                  onClick={() => {
                    setActiveFilter(room.id);
                    setActiveSendRoomId(room.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setActiveFilter(room.id);
                      setActiveSendRoomId(room.id);
                    }
                  }}
                  className={`${
                    isCurrent ? 'bg-black text-white' : 'bg-[#B23441]/70 text-white/80'
                  } pl-4 pr-2 py-2 rounded-md text-sm flex items-center gap-2 cursor-pointer select-none shrink-0`}
                >
                  <span>
                    [{name}] {isTarget && '*'}
                  </span>

                  {room.id !== 'public' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRooms((prev) => {
                          const updatedRooms = prev.filter((r) => r.id !== room.id);
                          localStorage.setItem(
                            'savedDmRooms',
                            JSON.stringify(updatedRooms.filter((r) => r.id !== 'public'))
                          );
                          return updatedRooms;
                        });
                        if (isCurrent) {
                          setActiveFilter('public');
                          setActiveSendRoomId('public');
                        }
                      }}
                      className="px-1.5 py-0.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded text-[11px]"
                      title="Close tab"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* พื้นที่ด้านล่าง */}
        <div className="flex-1 w-full flex overflow-hidden">
          {/* พื้นที่แชทสีดำด้านซ้าย */}
          <div className="flex-1 h-full bg-[#1D1D1D] flex flex-col">
            {/* ข้อความแชท */}
            <div
              ref={chatContainerRef}
              className="flex-1 p-6 flex flex-col gap-3 text-sm text-white/80 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-[#111111] [&::-webkit-scrollbar-thumb]:bg-[#FFD700] [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              <div className="mt-auto" />
              {displayMessages.length === 0 && (
                <div className="text-neutral-600 italic">No messages</div>
              )}

              {displayMessages.map((msg) => {
                const color = getTextColor(msg.roomType, msg.type);
                const senderLabel =
                  userNames[msg.senderUserId] ||
                  (msg.senderUserId === 'System' ? 'System' : msg.senderUserId.slice(0, 8));

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
                    <span className="text-neutral-300 mr-1">&lt;{senderLabel}&gt;:</span>
                    <span className={color}>{msg.message}</span>
                  </div>
                );
              })}
            </div>

            {/* กล่องพิมพ์ข้อความด้านล่าง */}
            <form
              onSubmit={handleSend}
              className="w-full px-6 pb-6 pt-2 flex items-center gap-4 shrink-0"
            >
              {/* ตัวเลือกห้องส่งข้อความ */}
              <select
                value={activeSendRoomId}
                onChange={(e) => {
                  setActiveSendRoomId(e.target.value);
                  setActiveFilter(e.target.value);
                }}
                className="bg-[#111111] text-white/80 text-sm px-4 py-3 rounded-lg border border-white/10 outline-none"
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.roomName || room.id.slice(0, 6)}
                  </option>
                ))}
              </select>

              {/* ช่อง Input */}
              <div className="flex-1 bg-[#111111] rounded-lg flex items-center px-4 py-3 border border-white/10 gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isConnected ? 'Type a message...' : 'Connecting to chat...'}
                  disabled={!isConnected}
                  className="bg-transparent flex-1 outline-none text-white/70 text-sm placeholder:text-white/30"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || rooms.length === 0 || !isConnected}
                  className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 px-3 py-1 rounded text-neutral-200 text-xs disabled:opacity-40"
                >
                  Send
                </button>
                <span className="text-white/40 cursor-pointer select-none">😊</span>
              </div>
            </form>
          </div>

          {/* พื้นที่ Sidebar สีแดงด้านขวา */}
          <div className="w-[238px] h-full bg-[#B23441] flex flex-col shrink-0 overflow-y-auto">
            {/* โซนบน: Friends & Channels */}
            <div className="h-[60px] w-full flex items-center justify-between px-4 border-b-[1.5px] border-[#7E090B] shrink-0">
              <span className="text-white font-semibold text-sm">Friends &amp; Channels</span>
              <span className="text-white/70">👥</span>
            </div>

            {/* โซนกลาง: Channels */}
            <div className="w-full flex flex-col shrink-0">
              <div className="flex justify-between items-center px-4 py-2 border-b-[1.5px] border-[#7E090B] text-white/60 text-[10px] font-semibold tracking-wider">
                <span>CHANNELS</span>
                <span>{String(nonDmChannels.length).padStart(2, '0')}</span>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {nonDmChannels.map((channel) => {
                  const isActive = activeFilter === channel.id;
                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => {
                        setActiveFilter(channel.id);
                        setActiveSendRoomId(channel.id);
                      }}
                      className={`${
                        isActive ? 'bg-[#123928] ring-1 ring-white/40' : 'bg-[#123928]/70 hover:bg-[#123928]'
                      } text-white text-xs px-3 py-2 rounded-md flex justify-between items-center shadow-sm w-full text-left`}
                    >
                      <span className="truncate"># {channel.roomName || 'General Room'}</span>
                      <span className="text-[10px]">▼</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* โซนล่าง: Friends */}
            <div className="flex-1 w-full flex flex-col mt-4">
              <div className="flex justify-between items-center px-4 py-2 border-b-[1.5px] border-t-[1.5px] border-[#7E090B] text-white/60 text-[10px] font-semibold tracking-wider">
                <span>FRIENDS</span>
                <span>{String(friends.length).padStart(2, '0')}</span>
              </div>

              {/* รายชื่อเพื่อน */}
              <div className="p-3 flex flex-col gap-2 mt-2">
                {friends.length === 0 && (
                  <div className="text-yellow-300 p-1 text-[11px]">No friends found</div>
                )}

                {friends.map((friend, idx) => {
                  const friendUserId = resolveFriendUserId(friend);
                  const friendName = resolveFriendName(friend);
                  const isResolving = loadingDmTarget === friendUserId;
                  const initials = friendName.slice(0, 2).toUpperCase();

                  return (
                    <button
                      key={friend.id || friendUserId || idx}
                      type="button"
                      disabled={isResolving || !friendUserId}
                      className="w-full flex items-center gap-3 hover:bg-black/20 text-white disabled:opacity-50 p-1.5 rounded-md text-left transition-colors"
                      title={`Click to DM ${friendName}`}
                      onClick={() => handleDirectMessageUser(friend)}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#123928] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {initials}
                      </div>
                      <span className="truncate text-xs font-medium">{friendName}</span>
                      {isResolving && (
                        <span className="text-[10px] text-yellow-300 ml-auto">...</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
