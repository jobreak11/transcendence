"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Socket } from "socket.io-client";
import {
  GameChatEvent,
  type GameChatMessage,
} from "../../../../websocket-events/game/chat/chat-events";

interface GameChatProps {
  socket: Socket | null;
  isConnected: boolean;
  tableSessionId: string;
  playerNames: Record<string, string>;
}

function isGameChatMessage(value: unknown): value is GameChatMessage {
  return typeof value === "object"
    && value !== null
    && "id" in value
    && typeof value.id === "string"
    && "tableSessionId" in value
    && typeof value.tableSessionId === "string"
    && "playerId" in value
    && typeof value.playerId === "string"
    && "messageText" in value
    && typeof value.messageText === "string"
    && "createdAt" in value
    && typeof value.createdAt === "string";
}

function mergeMessages(
  current: GameChatMessage[],
  incoming: GameChatMessage[],
) {
  const messagesById = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => messagesById.set(message.id, message));
  return [...messagesById.values()]
    .sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt))
    .slice(-100);
}

export default function GameChat({
  socket,
  isConnected,
  tableSessionId,
  playerNames,
}: GameChatProps) {
  const [messages, setMessages] = useState<GameChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setError("");
    setMessageText("");
    setIsSending(false);
    if (!socket || !isConnected || !tableSessionId) return;

    let active = true;
    const handleMessage = (message: unknown) => {
      if (!isGameChatMessage(message) || message.tableSessionId !== tableSessionId) {
        return;
      }
      setMessages((current) => mergeMessages(current, [message]));
    };

    socket.on(GameChatEvent.message.to_client.event_name, handleMessage);
    socket.timeout(10_000).emit(
      GameChatEvent.history.to_server.event_name,
      { tableSessionId } satisfies GameChatEvent.history.to_server.payload,
      (timeoutError: Error | null, response: unknown) => {
        if (!active) return;
        if (timeoutError) {
          setError("The server did not respond while loading game chat history.");
          return;
        }
        if (
          typeof response !== "object"
          || response === null
          || !("ok" in response)
          || typeof response.ok !== "boolean"
        ) {
          setError("Could not load game chat history.");
          return;
        }
        if (!response.ok) {
          setError(
            "message" in response && typeof response.message === "string"
              ? response.message
              : "Could not load game chat history.",
          );
          return;
        }
        // if (!("messages" in response) || !Array.isArray(response.messages)) {
        //   setError("The server returned invalid game chat history.");
        //   return;
        // }
        // if (!response.messages.every(isGameChatMessage)) {
        //   setError("The server returned invalid game chat history.");
        //   return;
        // }
        // setMessages((current) => mergeMessages(
        //   current,
        //   response.messages.filter((message) => message.tableSessionId === tableSessionId),
        // ));
        // setError("");
        if (!("messages" in response) || !Array.isArray(response.messages)) {
          setError("The server returned invalid game chat history.");
          return;
        }
        if (!response.messages.every(isGameChatMessage)) {
          setError("The server returned invalid game chat history.");
          return;
        }

        // Capture the narrowed GameChatMessage[] in a const before the closure
        const validMessages = response.messages.filter(
          (message) => message.tableSessionId === tableSessionId,
        );
        setMessages((current) => mergeMessages(current, validMessages));
        setError("");
      },
    );

    return () => {
      active = false;
      socket.off(GameChatEvent.message.to_client.event_name, handleMessage);
    };
  }, [isConnected, socket, tableSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || !socket || !isConnected || !tableSessionId || isSending) {
      return;
    }

    setIsSending(true);
    setError("");
    socket.timeout(10_000).emit(
      GameChatEvent.message.to_server.event_name,
      {
        tableSessionId,
        messageText: trimmedMessage,
      } satisfies GameChatEvent.message.to_server.payload,
      (timeoutError: Error | null, response: unknown) => {
        setIsSending(false);
        if (timeoutError) {
          setError("The server did not respond while sending your message.");
          return;
        }
        if (
          typeof response !== "object"
          || response === null
          || !("ok" in response)
          || typeof response.ok !== "boolean"
        ) {
          setError("The server returned an invalid game chat response.");
          return;
        }
        if (!response.ok) {
          setError(
            "message" in response && typeof response.message === "string"
              ? response.message
              : "Could not send game chat message.",
          );
          return;
        }
        const sentMessage = "message" in response ? response.message : null;
        if (
          !isGameChatMessage(sentMessage)
          || sentMessage.tableSessionId !== tableSessionId
        ) {
          setError("The server returned an invalid game chat message.");
          return;
        }

        setMessages((current) => mergeMessages(current, [sentMessage]));
        setMessageText("");
        // if (
        //   !("message" in response)
        //   || !isGameChatMessage(response.message)
        //   || response.message.tableSessionId !== tableSessionId
        // ) {
        //   setError("The server returned an invalid game chat message.");
        //   return;
        // }
        // setMessages((current) => mergeMessages(current, [response.message]));
        // setMessageText("");
      },
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#1D1D1D] text-sm text-white/80">
      <div
        aria-live="polite"
        className="flex-1 space-y-2 overflow-y-auto p-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-[#111111] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#FFD700]"
      >
        {messages.length === 0 && (
          <p className="text-neutral-600">
            {isConnected ? "No messages yet." : "Connect to chat with table players."}
          </p>
        )}
        {messages.map((message) => {
          const createdAt = new Date(message.createdAt);
          const timestamp = Number.isNaN(createdAt.getTime())
            ? "--:--"
            : createdAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
          const senderName = playerNames[message.playerId]
            ?? message.playerId.slice(0, 8);

          return (
            <p key={message.id} className="break-words">
              <span className="mr-1 text-neutral-500">[{timestamp}]</span>
              <span className="mr-1 font-semibold text-[#FFD700]">
                {senderName}:
              </span>
              {message.messageText}
            </p>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      {error && <p role="alert" className="px-3 pb-2 text-red-300">{error}</p>}
      <form onSubmit={sendMessage} className="flex gap-2 border-t border-[#7E090B] p-2">
        <input
          type="text"
          maxLength={500}
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          placeholder="Message table players..."
          aria-label="Message table players"
          disabled={!isConnected || !tableSessionId || isSending}
          className="min-w-0 flex-1 rounded border border-white/10 bg-[#111111] px-2 py-1 text-white/70 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#FFD700] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!messageText.trim() || !isConnected || !tableSessionId || isSending}
          className="rounded border border-white/10 bg-[#7E090B] px-3 py-1 font-semibold text-white hover:bg-[#B23441] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
