'use client';


import {
    ChatRoomDto, // fetch current chat room not sure use it
    LobbyDetailsDto, // this one must use for fetch chatroomid form lobby
    ChatMessageDto, // fetch message from chat message
    GetUserProfileDto // fetch all user profile to display who send the message
} from '../../../../types/dto'
import { FormEvent, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useMainSocket } from '../../_context/useMainSocket';

export interface LobbyMessage {
  id: string;
  chatRoomId: string;
  senderUserId: string;
  message: string;
  type: 'USER_MESSAGE' | 'SYSTEM_MESSAGE' | string;
  timestamp: string;
  rawCreatedAt: number;
}

export interface UnifiedMessage {
    id: string;
    chatRoomId: string;
    roomName: string;
    roomType: string;
    senderUserId: string;
    senderUserName: string;
    message: string;
    type: 'USER+MESSAGE' | 'SYSTEM_MESSAGE' | string;
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

interface LobbyChatProps {
    chatRoomId: string;
    memberRoles?: Record<string, string>
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


export function LobbyChat({ chatRoomId: propChatRoomId, memberRoles = {} }: LobbyChatProps) {
    const { socket, isConnected, accessToken } = useMainSocket();
    const [lobbyChatRoomId, setLobbyChatRoomId] = useState<string | null>(propChatRoomId ?? null);
    const [userNames, setUserNames] = useState<Record<string, string>>({});
    const [messages, setMessages] = useState<LobbyMessage[]>([]);
    const [activeFilter, setActiveFilter] = useState<string>('');

    const [activeSendRoomId, setActiveSendRoomId] = useState<string>();
    const [inputText, setInputText] = useState<string>('');
    const [autoScroll] = useState<boolean>(true);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const loadedHistoryRooms = useRef<Set<string>>(new Set());
    const lobbyRoomIdRef = useRef<string | null>(lobbyChatRoomId);
    const fetchedUserIds = useRef<Set<string>>(new Set());


    useEffect(() => {
        lobbyRoomIdRef.current = lobbyChatRoomId;
    }, [lobbyChatRoomId]);

    useEffect(() => {
        if (propChatRoomId) {
        setLobbyChatRoomId(propChatRoomId);
        }
    }, [propChatRoomId]);

    const getAuthHeaders = useCallback((): HeadersInit => {
        return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    }, [accessToken]);




    const fetchUserProfileName = useCallback(
        async (userId: string) => {
            if (!userId || userId === 'System' || userNames[userId] || fetchedUserIds.current.has(userId)) return;
            fetchedUserIds.current.add(userId);
            try {
                const res = await fetch(`/api/user/profile?id=${encodeURIComponent(userId)}`, {
                    headers: getAuthHeaders(),
                });
                if (!res.ok) return;
                const profile = (await res.json()) as GetUserProfileDto;
                const displayName = profile?.user_profile?.displayName || profile?.tagId;
                if (displayName) {
                    setUserNames((prev) => ({...prev, [userId]: displayName }));
                }
            }catch {

            }
        },
        [getAuthHeaders, userNames]
    );

    useEffect(() => {
        if (propChatRoomId || !accessToken) return;

        let isMounted = true;
        const loadMyLobby = async () => {
            try {
                const res = await fetch('/api/game/lobby/my-lobby', {
                    headers: getAuthHeaders(),
                });
                if (!res.ok) return;
                const dataLobby = (await res.json()) as LobbyDetailsDto;
                if (isMounted && dataLobby?.chatRoomId) {
                    setLobbyChatRoomId(dataLobby.chatRoomId);
                }
            } catch (err) {
                console.error('Failed to fetch lobby details:', err);
            }
        };

        loadMyLobby();
        return () => {
            isMounted = false;
        };
    }, [propChatRoomId, accessToken, getAuthHeaders]);


    useEffect(() => {
        if (!lobbyChatRoomId || !accessToken) return;

        let isMounted = true;
        setMessages([]);

        const loadHistory = async () => {
            try {
                const res = await fetch(
                    `/api/chat/message?chatRoomId=${encodeURIComponent(lobbyChatRoomId)}`,
                    { headers: getAuthHeaders() }
                );
                if (!res.ok) return;

                const data = (await res.json()) as ChatMessageDto[];
                if (!Array.isArray(data) || !isMounted) return;

                const history: LobbyMessage[] = data.map((item: any) => {
                    const { timestamp, rawCreatedAt } = formatTimestamp(item.createdAt);
                    return {
                        id: buildMessageId(lobbyChatRoomId, item),
                        chatRoomId: lobbyChatRoomId,
                        senderUserId: item.userId || item.senderUserId || 'System',
                        message: item.messageText || item.message || '',
                        type: item.type || 'USER_MESSAGE',
                        timestamp,
                        rawCreatedAt,
                    };
                });

                setMessages(history.sort((a, b) => a.rawCreatedAt - b.rawCreatedAt));
            } catch (err) {
                console.error('Failed to fetch lobby chat history:', err);
            }
        };

        loadHistory();
        return () => {
            isMounted = false;
        };
    }, [lobbyChatRoomId, accessToken, getAuthHeaders]);


    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleIncomingMessage = (payload: IncomingChatMessagePayload) => {
            const currentRoomId = lobbyRoomIdRef.current;
            if (!currentRoomId || payload.chatRoomId !== currentRoomId) return;

            const { timestamp, rawCreatedAt } = formatTimestamp(payload.createdAt);
            const newMsg: LobbyMessage = {
                id: buildMessageId(currentRoomId, payload),
                chatRoomId: currentRoomId,
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

        socket.on('main:chat:message:to_client', handleIncomingMessage);
        return () => {
            socket.off('main:chat:message:to_client', handleIncomingMessage);
        };
    }, [socket, isConnected]);

    useEffect(() => {
        messages.forEach((msg) => {
            if (msg.senderUserId && msg.senderUserId !== 'System') {
                fetchUserProfileName(msg.senderUserId);
            }
        });
    }, [messages, fetchUserProfileName]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e: FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !socket || !isConnected || !lobbyChatRoomId) return;

        const messageText = inputText.trim();
        const targetRoomId = lobbyChatRoomId;
        
        socket.emit(
            'main:chat:message:to_server',
            {
                chatRoomId: targetRoomId,
                messageText,
            },
            (payload: IncomingChatMessagePayload) => {
                if (!payload?.createdAt) return;
                const { timestamp, rawCreatedAt } = formatTimestamp(payload.createdAt);
                const resolveRoomId = payload.chatRoomId || targetRoomId;

                const acknowledgedMessage: LobbyMessage = {
                    id: buildMessageId(resolveRoomId, payload),
                    chatRoomId: resolveRoomId,
                    senderUserId: payload.userId || payload.senderUserId || 'System',
                    message: payload.messageText || payload.message || messageText,
                    type: payload.type || 'USER_MESSAGE',
                    timestamp,
                    rawCreatedAt,
                };

                setMessages((prev) =>
                    prev.some((item) => item.id === acknowledgedMessage.id)
                        ? prev
                        : [...prev.slice(-250), acknowledgedMessage]
                );
            }
        );

        setInputText('');
        inputRef.current?.focus();
    };
return (
    <div className="flex flex-col p-10 items-center z-50 shadow-2xl">
      <div className="w-[652px] h-[287px] rounded-lg shadow-md overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="w-full h-[50px] bg-[#7E090B] flex items-center justify-between px-4 shrink-0">
          <span className="text-white font-bold text-lg">Lobby chat</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="w-8 h-8 bg-white/20 rounded-md flex items-center justify-center"
            >
              <Image src="/Members.svg" alt="Members" width={20} height={20} />
            </button>
            <button
              type="button"
              className="w-8 h-8 bg-black/40 rounded-md flex items-center justify-center"
            >
              <Image src="/Search.svg" alt="Search" width={20} height={20} />
            </button>
          </div>
        </div>

        {/* พื้นที่แชท */}
        <div
          ref={chatContainerRef}
          className="flex-1 w-full bg-[#1D1D1D] p-4 flex flex-col gap-3 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-[#111111] [&::-webkit-scrollbar-thumb]:bg-[#FFD700] [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {messages.length === 0 && (
            <div className="text-neutral-500 italic text-sm my-auto text-center">
              {lobbyChatRoomId ? 'No messages yet' : 'Joining lobby chat...'}
            </div>
          )}

          {messages.map((msg) => {
            const isSystem = msg.type === 'SYSTEM_MESSAGE' || msg.senderUserId === 'System';
            const senderLabel = isSystem
              ? 'System'
              : userNames[msg.senderUserId] || msg.senderUserId.slice(0, 8);
            const roleLabel = isSystem
              ? 'System'
              : memberRoles[msg.senderUserId] || 'Player';

            return (
              <div key={msg.id} className="flex items-start gap-4">
                <div className="w-[180px] shrink-0 flex items-center gap-2 pt-1.5 text-sm">
                  <span className="text-white/70 font-semibold shrink-0">[{roleLabel}]</span>
                  <span className="text-white font-bold truncate">{senderLabel}</span>
                  <span className="text-white/40 text-[11px] shrink-0">{msg.timestamp}</span>
                </div>
                <div
                  className={`flex-1 border p-3 rounded-lg shadow-sm text-sm break-all ${
                    isSystem
                      ? 'bg-yellow-950/40 border-yellow-700/50 text-yellow-300'
                      : 'bg-[#133424] border-[#1A4531] text-white'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })}
        </div>

        {/* แถบพิมพ์ข้อความ */}
        <form
          onSubmit={handleSend}
          className="w-full h-[50px] bg-[#111111] border-t border-white/10 flex items-center shrink-0"
        >
          <div className="h-full px-4 flex items-center border-r border-white/10 text-white/70 text-sm select-none">
            Lobby
          </div>
          <div className="flex-1 px-4 flex justify-between items-center text-white/50 text-sm gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!isConnected || !lobbyChatRoomId}
              placeholder={
                !isConnected
                  ? 'Connecting...'
                  : !lobbyChatRoomId
                  ? 'Waiting for lobby...'
                  : 'Type a message...'
              }
              className="bg-transparent flex-1 outline-none text-white placeholder:text-white/40"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || !isConnected || !lobbyChatRoomId}
              className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 px-3 py-1 rounded text-neutral-200 text-xs disabled:opacity-40"
            >
              Send
            </button>
            <span className="cursor-pointer hover:text-white transition select-none">😊</span>
          </div>
        </form>
      </div>
    </div>
  );
}