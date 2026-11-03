'use client';

import { ChatRoomDto } from  '../../../../types/dto';
import { FindAllFriendshipsDto } from  '../../../../types/dto';
import { FormEvent, useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useMainSocket } from '../../_context/useMainSocket';


export interface ChatRoom {
    id: string;
    roomName: string;
    visibilityType: "PUBLIC" | "PRIVATE" | "DIRECT_MESSAGE";
    createdAt: string;
}

// export interface ChatMessage.ResponseZodDto {
//  chatRoomId: string | null;
//  type: ChatMessageType;
//  createdAt: Date;
//  userId: string | null;
//  messageText: string;
// }

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

interface PublicChatMessagePayload {
    userId?: string | null;
    messageText?: string;
    type?: string;
    createdAt?: string | Date;
}

function publicMessageId(message: PublicChatMessagePayload): string {
    return `${message.userId || 'System'}-${message.createdAt || ''}-${message.messageText || ''}`;
}

export function ChatEmbbed() {
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

  const loadPublicChatHistory = async () => {
    try {
        const res = await fetch('/api/chat/public');
        if (!res.ok) throw new Error(`Public chat request failed: ${res.status}`);

        const data = (await res.json()) as PublicChatMessagePayload[];
        if (!Array.isArray(data)) return [];

        const history = data.slice().reverse().map((item) => {
            const d = item.createdAt ? new Date(item.createdAt) : new Date();
            const time = !isNaN(d.getTime())
                ? d.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                })
                : '--:--:--';
            return {
                id: publicMessageId(item),
                chatRoomId: 'public',
                roomName: 'Global',
                roomType: 'PUBLIC',
                senderUserId: item.userId || 'System',
                message: item.messageText || '',
                type: item.type || 'USER_MESSAGE',
                timestamp: time,
                rawCreatedAt: d.getTime(),
            } as UnifiedMessage;
        });
        setMessages(history);
    } catch (err) {
        console.error('Failed to fetch public chat history:', err);
    }
  };

    const loadFriends = async () => {
        try {
            const res = await fetch('/api/friend');
            if (!res.ok) return;
            
            const data = (await res.json()) as FindAllFriendshipsDto;
            if (data && Array.isArray(data.acceptedFriends)) {
                setFriends(data.acceptedFriends);
            } else if (Array.isArray(data)) {
                setFriends(data.filter((f) => !f.status || f.status ==='ACCEPTED'));
            }
        } catch (err) {
            console.error('Failed to load friends:', err);
        }
    }

    useEffect(() => {
        setRooms([{
            id: 'public',
            roomName: 'Global',
            visibilityType: 'PUBLIC',
            createdAt: new Date().toISOString(),
        }]);
        setActiveSendRoomId('public');
        loadPublicChatHistory();
        loadFriends();
    }, [accessToken]);

    useEffect(() => {
        if (rooms.length > 0 && !rooms.some((r) => r.id === activeSendRoomId)) {
            setActiveSendRoomId(rooms[0].id);
        }
    }, [rooms, activeSendRoomId]);


    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleIncomingMessage = (payload: PublicChatMessagePayload) => {
            const d = payload.createdAt ? new Date(payload.createdAt) : new Date();
            const time = !isNaN(d.getTime())
                ? d.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                })
                : '--:--:--';
            const newMsg: UnifiedMessage = {
                id: publicMessageId(payload),
                chatRoomId: 'public',
                roomName: 'Global',
                roomType: 'PUBLIC',
                senderUserId: payload.userId || 'System',
                message: payload.messageText || '',
                type: payload.type || 'USER_MESSAGE',
                timestamp: time,
                rawCreatedAt: d.getTime(),
            };
            
            setMessages((prev) => {
                if (prev.some((message) => message.id === newMsg.id)) return prev;
                return [...prev.slice(-250), newMsg];
            });
        };

        socket.on('main:chat:message:to_client', handleIncomingMessage);

        return () => {
            socket.off('main:chat:message:to_client', handleIncomingMessage);
        }
    }, [socket, isConnected]);

    const displayMessages = useMemo(() => {
        if (activeFilter === 'ALL') return messages;
        return messages.filter((m) => m.chatRoomId === activeFilter);
    }, [messages, activeFilter]);


    useEffect(() => {
        if (autoScroll && chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [displayMessages, autoScroll]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !socket || !isConnected) return;
        const messageText = inputText.trim();
        socket.emit(
            'main:chat:message:to_server',
            { chatRoomId: null, messageText },
            (payload: PublicChatMessagePayload) => {
                if (!payload?.createdAt) return;
                const d = new Date(payload.createdAt);
                const timestamp = !isNaN(d.getTime())
                    ? d.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                    })
                    : '--:--:--';
                const acknowledgedMessage: UnifiedMessage = {
                    id: publicMessageId(payload),
                    chatRoomId: 'public',
                    roomName: 'Global',
                    roomType: 'PUBLIC',
                    senderUserId: payload.userId || 'System',
                    message: payload.messageText || '',
                    type: payload.type || 'USER_MESSAGE',
                    timestamp,
                    rawCreatedAt: d.getTime(),
                };
                setMessages((previous) => previous.some((item) => item.id === acknowledgedMessage.id)
                    ? previous
                    : [...previous.slice(-250), acknowledgedMessage]);
            },
        );
        setInputText('');
        inputRef.current?.focus();
    };

    const getTextColor = (roomType: string, msgType?: string) => {
        if (msgType === 'SYSTEM_MESSAGE') return 'text-yellow-400';
        switch (roomType) {
            case 'DIRECT_MESSAGE':
                return  'text-fuchsia-400';
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
        <div className="flex flex-col p-10 items-center z-50 shadow-2xl">
            {/* กล่องหลัก */}
            <div className="w-[1465px] h-[867px] bg-[#B23441] rounded-lg shadow-md overflow-hidden flex flex-col font-sans">
                
                {/* แถบด้านบน */}
                <div className="w-full h-[75px] bg-[#7E090B] flex items-center shrink-0">
                    <div className="h-full flex items-center px-6 border-r-[3px] border-[#1D1D1D]">
                        <Image 
                            src="/Brand.svg"
                            alt="Logo"
                            width={40}
                            height={40}
                        />
                    </div>
                    {/* Tab ด้านบน */}
                    <div className="flex-1 h-full flex items-center px-6 gap-4">
                        <button className="bg-[#B23441] text-white px-6 py-2 rounded-md text-sm font-semibold">#General</button>
                        <button className="bg-[#B23441]/70 text-white/80 px-6 py-2 rounded-md text-sm">Nong Cat</button>
                        <button className="bg-black text-white px-6 py-2 rounded-md text-sm flex items-center gap-2">💬 Global</button>
                    </div>
                </div>
                
                {/* พื้นที่ด้านล่าง (เพิ่ม overflow-hidden ตรงนี้เพื่อไม่ให้กล่องขยายทะลุกรอบ 867px) */}
                <div className="flex-1 w-full flex overflow-hidden">
                    
                    {/* พื้นที่แชทสีดำด้านซ้าย */}
                    <div className="flex-1 h-full bg-[#1D1D1D] flex flex-col">
                        
                        {/* ข้อความแชท (ย้าย overflow-y-auto และตั้งค่า Scrollbar มาไว้ที่กล่องนี้) */}
                        <div className="flex-1 p-6 flex flex-col gap-3 text-sm text-white/80 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-[#111111] [&::-webkit-scrollbar-thumb]:bg-[#FFD700] [&::-webkit-scrollbar-thumb]:rounded-full">
                            
                            {/* ดันข้อความให้ไปเริ่มจากด้านล่าง (แทนการใช้ justify-end) */}
                            <div className="mt-auto"></div>
                                {displayMessages.length === 0 && (
                                <div className="text-neutral-600 italic">No messages</div>
                                )}

                                {displayMessages.map((msg) => {
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
                            {/* ข้อความจำลอง */}
                        </div>
                        
                        {/* กล่องพิมพ์ข้อความด้านล่าง (ใส่ shrink-0 เพื่อบังคับไม่ให้กล่องนี้หดตัวเวลาแชทเยอะๆ) */}
                        <form onSubmit={handleSend} className="w-full px-6 pb-6 pt-2 flex items-center gap-4 shrink-0">
                            {/* ปุ่ม Global */}
                            <button className="bg-[#111111] text-white/60 text-sm px-4 py-3 rounded-lg border border-white/10 flex items-center gap-2">
                                Global <span className="text-[10px]">▼</span>
                            </button>
                            {/* ช่อง Input */}
                            <div className="flex-1 bg-[#111111] rounded-lg flex items-center px-4 py-3 border border-white/10">
                                <input 
                                    ref={inputRef}
                                    type="text" 
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Type a message..." 
                                    disabled={rooms.length === 0 || !isConnected}
                                    className="bg-transparent flex-1 outline-none text-white/70 text-sm placeholder:text-white/30" 
                                />
                                <button type="submit"
                                 disabled={!inputText.trim() || rooms.length === 0 || !isConnected}
              className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 px-3 py-1 text-neutral-200 disabled:opacity-40">
                                    Send
                                </button>
                                <span className="text-white/40 cursor-pointer">😊</span>
                            </div>
                            </form>
                        </div>

                    {/* พื้นที่ Sidebar สีแดงด้านขวา */}
                    <div className="w-[238px] h-full bg-[#B23441] flex flex-col shrink-0 overflow-y-auto">
                        
                        {/* โซนบน: Friends & Channels */}
                        <div className="h-[60px] w-full flex items-center justify-between px-4 border-b-[1.5px] border-[#7E090B] shrink-0">
                            <span className="text-white font-semibold text-sm">Friends & Channels</span>
                            <span className="text-white/70">👥</span>
                        </div>

                        {/* โซนกลาง: Channels */}
                        <div className="w-full flex flex-col shrink-0">
                            {/* เส้นคั่น CHANNELS */}
                            <div className="flex justify-between items-center px-4 py-2 border-b-[1.5px] border-[#7E090B] text-white/60 text-[10px] font-semibold tracking-wider">
                                <span>CHANNELS</span>
                                <span>01</span>
                            </div>
                            <div className="p-3">
                                {/* ปุ่มห้องแชทสีเขียว */}
                                <div className="bg-[#123928] text-white text-xs px-3 py-2 rounded-md flex justify-between items-center shadow-sm">
                                    <span># General Room</span>
                                    <span className="text-[10px]">▼</span>
                                </div>
                            </div>
                        </div>

                        {/* โซนล่าง: Friends */}
                        <div className="flex-1 w-full flex flex-col mt-4">
                            {/* เส้นคั่น FRIENDS */}
                            <div className="flex justify-between items-center px-4 py-2 border-b-[1.5px] border-[#7E090B] border-t-[1.5px] text-white/60 text-[10px] font-semibold tracking-wider">
                                <span>FRIENDS</span>
                                <span>02</span>
                            </div>
                            
                            {/* รายชื่อเพื่อน */}
                            <div className="p-3 flex flex-col gap-4 mt-2">
                                {
                                    friends.length === 0 && (
                                        <div className="text-yellow-500 p-1 text-[11px]">No friends found</div>
                                    )
                                }
                                {friends.map((friend, idx) => {
                                    const friendUserId = resolveFriendUserId(friend);
                                    const friendName = resolveFriendName(friend);
                                     const isResolving = loadingDmTarget === friendUserId;
                                     return (                  <button
                    key={friend.id || friendUserId || idx}
                    type="button"
                    disabled={isResolving || !friendUserId}
                    className="w-full text-left px-1.5 py-0.5 flex items-center justify-between text-[11px] text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 disabled:opacity-50"
                    title={`Click to DM ${friendName}`}
                  >
                    <span className="truncate">{friendName}</span>
                    <span className="text-[10px] text-fuchsia-400 ml-1">
                      {isResolving ? '...' : '[DM]'}
                    </span>
                  </button>);
                                    })
                                }
                                {/* คนที่ 1 */}
                                {/* <div className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#123928] flex items-center justify-center text-white text-[10px] font-bold">NC</div>
                                        <div className="flex flex-col">
                                            <span className="text-white text-xs font-semibold">Nong Cat</span>
                                            <span className="text-white/50 text-[10px]">Online</span>
                                        </div>
                                    </div>
                                    <span className="text-white/40 text-xs">💬</span>
                                </div> */}
                                {/* คนที่ 2 */}
                                {/* <div className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#38423B] flex items-center justify-center text-white text-[10px] font-bold">JD</div>
                                        <div className="flex flex-col">
                                            <span className="text-white text-xs font-semibold">John Doe</span>
                                            <span className="text-white/50 text-[10px] flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Away
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-white/40 text-xs">💬</span>
                                </div> */}
                            </div>
                        </div>

                    </div>
                    
                </div>
                
            </div>
        </div>
    );
}