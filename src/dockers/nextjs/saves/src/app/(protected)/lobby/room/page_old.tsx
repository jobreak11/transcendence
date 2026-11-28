"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { signOut } from "../../../../lib/auth";
import type { GetLobbyPublicDto } from "../../../../types/dto";
import { useMainSocket } from "../../_context/useMainSocket";
import { LobbyEvent } from "../../../../websocket-events/main/lobby/lobby-events";
import { ChatEvent } from "../../../../websocket-events/main/chat/chat-events";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLobbyResponse(value: unknown): value is GetLobbyPublicDto {
  if (!isRecord(value) || !isRecord(value.details)
    || !isRecord(value.gameSettings) || !isRecord(value.generalSettings)) {
    return false;
  }

  return typeof value.details.roomPinId === "string"
    && typeof value.details.createdAt === "string"
    && (value.details.gameRoomId === null
      || typeof value.details.gameRoomId === "string")
    && (value.details.createdByUserId === null
      || typeof value.details.createdByUserId === "string")
    && (value.details.hostUserId === null
      || typeof value.details.hostUserId === "string")
    && typeof value.details.chatRoomId === "string"
    && typeof value.details.hostDisplayName === "string"
    && typeof value.details.currentPlayerCount === "number"
    && (value.details.currentSpectatorCount === undefined
      || typeof value.details.currentSpectatorCount === "number")
    && typeof value.details.roomStatus === "string"
    && typeof value.gameSettings.maxPlayer === "number"
    && typeof value.gameSettings.maxSpectator === "number"
    && typeof value.gameSettings.format === "string"
    && typeof value.gameSettings.startingChips === "number"
    && typeof value.gameSettings.bigBlind === "number"
    && (value.gameSettings.ante === null
      || typeof value.gameSettings.ante === "number")
    && (value.generalSettings.catchPhrase === null
      || typeof value.generalSettings.catchPhrase === "string")
    && typeof value.generalSettings.roomType === "string"
    && typeof value.generalSettings.hasPassword === "boolean";
}

type LobbyMembers = {
  playerList: string[];
  spectatorList: string[];
  readyPlayerList: string[];
};

function isLobbyMembers(value: unknown): value is LobbyMembers {
  return isRecord(value)
    && Array.isArray(value.playerList)
    && value.playerList.every((name) => typeof name === "string")
    && Array.isArray(value.spectatorList)
    && value.spectatorList.every((name) => typeof name === "string")
    && Array.isArray(value.readyPlayerList)
    && value.readyPlayerList.every((name) => typeof name === "string");
}

function getUserIdFromToken(token?: string): string | null {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded: unknown = JSON.parse(
      atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")),
    );
    if (
      isRecord(decoded)
      && typeof decoded.sub === "string"
    ) {
      return decoded.sub;
    }
  } catch {
    return null;
  }

  return null;
}

function LobbyPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0">
      <h2 className="rounded-t-lg border-b border-neutral-950 bg-neutral-900 px-4 py-3 text-lg font-semibold sm:text-xl">
        {title}
      </h2>
      <div className="rounded-b-lg border-4 border-neutral-900 bg-neutral-950/75 p-4 sm:p-6">
        {children}
      </div>
    </section>
  );
}

function LobbyRoster({
  names,
  readyNames = [],
  isLoading,
}: {
  names: string[];
  readyNames?: string[];
  isLoading: boolean;
}) {
  return (
    <ul className="mx-auto min-h-60 w-full max-w-2xl content-start text-sm sm:text-base">
      {isLoading ? (
        <li className="flex min-h-12 items-center px-2 text-neutral-400">
          Loading members…
        </li>
      ) : names.length > 0 ? names.map((name, index) => (
        <li
          key={`${name}-${index}`}
          className="flex min-h-12 items-center border-b border-white/10 px-2"
        >
          <span
            className={readyNames.includes(name) ? "font-semibold text-emerald-400" : ""}
            title={readyNames.includes(name) ? "Ready" : undefined}
          >
            {name}
          </span>
        </li>
      )) : (
        <li className="flex min-h-12 items-center px-2 text-neutral-400">
          No members yet.
        </li>
      )}
    </ul>
  );
}

type LobbyChatMessage = {
  id: string;
  senderUserId: string | null;
  messageText: string;
  type: "USER_MESSAGE" | "SYSTEM_MESSAGE";
  createdAt: string;
  createdAtMs: number;
};

const CHAT_EMOJIS = ["😀", "😂", "👍", "❤️", "🔥", "🎉", "🙏", "👀"];

function parseLobbyChatMessage(
  value: unknown,
  chatRoomId: string,
): LobbyChatMessage | null {
  if (
    !isRecord(value)
    || typeof value.messageText !== "string"
    || (value.userId !== null && typeof value.userId !== "string")
    || (value.type !== "USER_MESSAGE" && value.type !== "SYSTEM_MESSAGE")
    || typeof value.createdAt !== "string"
  ) {
    return null;
  }

  const createdAtMs = Date.parse(value.createdAt);
  if (!Number.isFinite(createdAtMs)) return null;

  const senderUserId: string | null = typeof value.userId !== "string" ? null : value.userId;
  return {
    id: `${chatRoomId}-${senderUserId ?? "System"}-${createdAtMs}-${value.messageText}`,
    senderUserId,
    messageText: value.messageText,
    type: value.type,
    createdAt: value.createdAt,
    createdAtMs,
  };
}

function mergeLobbyChatMessages(
  current: LobbyChatMessage[],
  incoming: LobbyChatMessage[],
): LobbyChatMessage[] {
  const messages = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) messages.set(message.id, message);
  return [...messages.values()]
    .sort((messageA, messageB) => messageA.createdAtMs - messageB.createdAtMs)
    .slice(-250);
}

function LobbyChat({ chatRoomId }: { chatRoomId: string }) {
  const { socket, isConnected, accessToken } = useMainSocket();
  const [messages, setMessages] = useState<LobbyChatMessage[]>([]);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [chatError, setChatError] = useState("");
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fetchedUserIds = useRef(new Set<string>());

  const addMessage = useCallback((message: LobbyChatMessage) => {
    setMessages((current) => mergeLobbyChatMessages(current, [message]));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setMessages([]);
    setChatError("");

    async function loadHistory() {
      try {
        const headers = new Headers();
        if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
        const response = await fetch(
          `/api/chat/message?chatRoomId=${encodeURIComponent(chatRoomId)}`,
          { cache: "no-store", headers, signal: controller.signal },
        );
        const payload: unknown = await response.json();

        if (!response.ok) {
          const message = isRecord(payload) && typeof payload.message === "string"
            ? payload.message
            : `Could not load lobby chat (${response.status}).`;
          throw new Error(message);
        }
        if (!Array.isArray(payload)) {
          throw new Error("The server returned invalid lobby chat history.");
        }

        const history = payload.map((item) =>
          parseLobbyChatMessage(item, chatRoomId),
        );
        if (history.some((message) => message === null)) {
          throw new Error("The server returned invalid lobby chat history.");
        }

        setMessages((current) =>
          mergeLobbyChatMessages(
            current,
            history.filter((message): message is LobbyChatMessage => message !== null),
          ),
        );
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setChatError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load lobby chat history.",
        );
      }
    }

    void loadHistory();
    return () => controller.abort();
  }, [accessToken, chatRoomId]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleIncomingMessage = (payload: unknown) => {
      if (!isRecord(payload) || payload.chatRoomId !== chatRoomId) return;
      const message = parseLobbyChatMessage(payload, chatRoomId);
      if (message) addMessage(message);
    };

    socket.on(ChatEvent.message.to_client.event_name, handleIncomingMessage);
    return () => {
      socket.off(ChatEvent.message.to_client.event_name, handleIncomingMessage);
    };
  }, [addMessage, chatRoomId, isConnected, socket]);

  const loadMemberName = useCallback(async (userId: string) => {
    const headers = new Headers();
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

    const response = await fetch(
      `/api/user/profile?id=${encodeURIComponent(userId)}`,
      { headers },
    );
    const payload: unknown = await response.json();
    if (!response.ok) {
      throw new Error(`Could not load a chat member profile (${response.status}).`);
    }
    if (!isRecord(payload)) {
      throw new Error("The server returned invalid chat member details.");
    }

    const profile = isRecord(payload.user_profile) ? payload.user_profile : null;
    const displayName = profile && typeof profile.displayName === "string"
      ? profile.displayName.trim()
      : "";
    const tagId = typeof payload.tagId === "string" ? payload.tagId.trim() : "";
    if (displayName || tagId) {
      setMemberNames((current) => ({
        ...current,
        [userId]: displayName || tagId,
      }));
    }
  }, [accessToken]);

  useEffect(() => {
    const senderIds = new Set(
      messages
        .map((message) => message.senderUserId)
        .filter((userId): userId is string =>
          Boolean(userId)
          && !memberNames[userId]
          && !fetchedUserIds.current.has(userId),
        ),
    );

    for (const userId of senderIds) {
      fetchedUserIds.current.add(userId);
      void loadMemberName(userId).catch((profileError: unknown) => {
        setChatError(
          profileError instanceof Error
            ? profileError.message
            : "Could not load a chat member profile.",
        );
      });
    }
  }, [loadMemberName, memberNames, messages]);

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = messageText.trim();
    if (!content || !socket || !isConnected || isSending) return;

    setChatError("");
    setIsSending(true);
    socket.timeout(10_000).emit(
      ChatEvent.message.to_server.event_name,
      { chatRoomId, messageText: content },
      (timeoutError: Error | null, payload: unknown) => {
        setIsSending(false);
        if (timeoutError) {
          setChatError("The chat server did not respond. Please try again.");
          return;
        }

        const sentMessage = parseLobbyChatMessage(payload, chatRoomId);
        if (!sentMessage) {
          setChatError("The server returned an invalid chat message.");
          return;
        }

        addMessage(sentMessage);
        setMessageText("");
        inputRef.current?.focus();
      },
    );
  }

  return (
    <div className="flex h-80 min-h-60 flex-col gap-3">
      <div
        ref={messagesRef}
        aria-label="Lobby chat messages"
        aria-live="polite"
        className="flex-1 space-y-3 overflow-y-auto rounded-md bg-black/30 p-3"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-neutral-400">
            {isConnected ? "No messages yet. Say hello!" : "Connecting to lobby chat…"}
          </p>
        ) : messages.map((message) => {
          const senderName = message.senderUserId
            ? memberNames[message.senderUserId] || message.senderUserId.slice(0, 8)
            : "System";

          return (
            <article key={message.id} className="break-words text-sm">
              <p className="text-xs text-neutral-400">
                <button className="font-semibold text-amber-200">{senderName}</button>
                {" · "}
                {new Date(message.createdAtMs).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </p>
              <p className={message.type === "SYSTEM_MESSAGE" ? "text-amber-300" : "text-white"}>
                {message.messageText}
              </p>
            </article>
          );
        })}
      </div>

      {chatError && (
        <p className="text-sm text-amber-200" role="alert">
          {chatError}
        </p>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2">
        <input
          ref={inputRef}
          aria-label="Message lobby members"
          autoComplete="off"
          maxLength={5000}
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          disabled={!isConnected || isSending}
          placeholder={isConnected ? "Message everyone in the room…" : "Connecting…"}
          className="min-w-0 flex-1 rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus-visible:outline-2 focus-visible:outline-amber-300 disabled:opacity-50"
        />
        <div className="relative">
          <button
            type="button"
            aria-label="Choose emoji"
            aria-expanded={showEmojis}
            onClick={() => setShowEmojis((visible) => !visible)}
            className="rounded-md border border-white/15 px-3 py-2 hover:bg-white/10"
          >
            😊
          </button>
          {showEmojis && (
            <div className="absolute bottom-full right-0 mb-2 grid grid-cols-4 gap-1 rounded-md border border-white/15 bg-neutral-900 p-2 shadow-lg">
              {CHAT_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  aria-label={`Add ${emoji}`}
                  onClick={() => {
                    setMessageText((current) => current + emoji);
                    setShowEmojis(false);
                    inputRef.current?.focus();
                  }}
                  className="rounded p-1 text-lg hover:bg-white/10"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={!messageText.trim() || !isConnected || isSending}
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSending ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}

export default function LobbyRoomPage() {
  const { socket, isConnected, accessToken } = useMainSocket();
  const [lobby, setLobby] = useState<GetLobbyPublicDto | null>(null);
  const [members, setMembers] = useState<LobbyMembers>({
    playerList: [],
    spectatorList: [],
    readyPlayerList: [],
  });
  const [lobbyPinId, setLobbyPinId] = useState("");
  const [username, setUsername] = useState("You");
  const [isLoading, setIsLoading] = useState(true);
  const [isMembersLoading, setIsMembersLoading] = useState(true);
  const [error, setError] = useState("");
  const [membersError, setMembersError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUserId = getUserIdFromToken(accessToken);

  const refreshMembers = useCallback(async (
    lobbyId: string,
    isCurrent: () => boolean = () => true,
  ) => {
    try {
      const response = await fetch(
        `/api/game/lobby/members?lobbyPinId=${encodeURIComponent(lobbyId)}`,
        { 
          method: "GET",
          cache: "no-store",
          headers: {
            authorization: `Bearer ${accessToken}`
          }
        },
      );
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage =
          isRecord(body) && typeof body.message === "string"
            ? body.message
            : `Could not load lobby members (${response.status}).`;
        throw new Error(errorMessage);
      }

      if (!isLobbyMembers(body)) {
        throw new Error("The server returned an invalid lobby member list.");
      }

      if (isCurrent()) {
        setMembers(body);
        setMembersError("");
      }
    } catch (loadError) {
      if (isCurrent()) {
        setMembersError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load lobby members.",
        );
      }
    } finally {
      if (isCurrent()) setIsMembersLoading(false);
    }
  }, []);

  const refreshLobbyDetails = useCallback(async (
    lobbyId: string,
    isCurrent: () => boolean = () => true,
  ) => {
    try {
      const response = await fetch(
        `/api/game/lobby?lobbyPinId=${encodeURIComponent(lobbyId)}`,
        { 
          cache: "no-store",
          headers: {
            authorization: `Bearer ${accessToken}`
          }
        },
      );
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage =
          isRecord(body) && typeof body.message === "string"
            ? body.message
            : `Could not load lobby (${response.status}).`;
        throw new Error(errorMessage);
      }
      if (!isLobbyResponse(body)) {
        throw new Error("The server returned invalid lobby details.");
      }

      if (isCurrent()) {
        setLobby(body);
        setError("");
      }
    } catch (loadError) {
      if (isCurrent()) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load lobby details.",
        );
      }
    } finally {
      if (isCurrent()) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCurrent = true;
    const lobbyId = new URLSearchParams(window.location.search).get("lobbyPinId")?.trim() ?? "";
    setLobbyPinId(lobbyId);

    if (!lobbyId) {
      setError("A lobby ID is required to view this room.");
      setIsLoading(false);
      return () => {
        isCurrent = false;
      };
    }

    async function loadUsername() {
      try {
        const response = await fetch("/api/user/profile", { cache: "no-store" });
        const body: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(`Could not load your profile (${response.status}).`);
        }

        if (!isRecord(body)) {
          throw new Error("The server returned invalid profile details.");
        }

        const profile = isRecord(body.user_profile) ? body.user_profile : null;
        const displayName =
          profile && typeof profile.displayName === "string"
            ? profile.displayName.trim()
            : "";
        const tagId = typeof body.tagId === "string" ? body.tagId.trim() : "";
        if (isCurrent) setUsername(displayName || tagId || "You");
      } catch (loadError) {
        if (isCurrent) {
          setProfileError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load your profile.",
          );
        }
      }
    }

    void refreshLobbyDetails(lobbyId, () => isCurrent);
    void loadUsername();
    void refreshMembers(lobbyId, () => isCurrent);

    return () => {
      isCurrent = false;
    };
  }, [refreshLobbyDetails, refreshMembers]);

  useEffect(() => {
    if (!socket || !lobbyPinId) return;

    const onGameStarted = (event: LobbyEvent.game_started.to_client.payload) => {
      if (
        !isRecord(event)
        || typeof event.lobbyPinId !== "string"
        || typeof event.tableSessionId !== "string"
      ) {
        setActionError("The server sent an invalid game start notification.");
        return;
      }
      if (event.lobbyPinId !== lobbyPinId) return;

      window.location.assign(
        `/game?tableSessionId=${encodeURIComponent(event.tableSessionId)}`,
      );
    };
    const onReadyChanged = (event: LobbyEvent.ready.to_client.payload) => {
      if (
        !isRecord(event)
        || typeof event.lobbyPinId !== "string"
        || typeof event.userId !== "string"
        || typeof event.isReady !== "boolean"
      ) {
        setActionError("The server sent an invalid ready status.");
        setIsSubmitting(false);
        return;
      }
      if (event.lobbyPinId !== lobbyPinId) return;

      if (event.userId === currentUserId) {
        setMembers((currentMembers) => ({
          ...currentMembers,
          readyPlayerList: event.isReady
            ? [...new Set([...currentMembers.readyPlayerList, username])]
            : currentMembers.readyPlayerList.filter((name) => name !== username),
        }));
        setIsSubmitting(false);
      }
      void refreshMembers(lobbyPinId);
    };
    const onMemberChanged = (event: unknown) => {
      if (
        !isRecord(event)
        || typeof event.lobbyPinId !== "string"
        || typeof event.userId !== "string"
        || typeof event.status !== "string"
        || ![
          "MEMBER_JOIN",
          "MEMBER_LEAVE",
          "MEMBER_CHANGE_ROLE",
          "MEMBER_CHANGE_HOST",
        ].includes(event.status)
        || (event.role !== "PLAYER" && event.role !== "SPECTATOR")
      ) {
        setActionError("The server sent an invalid lobby member update.");
        return;
      }
      if (event.lobbyPinId !== lobbyPinId) return;

      void refreshMembers(lobbyPinId);
      void refreshLobbyDetails(lobbyPinId);
    };
    const onSocketException = (exception: unknown) => {
      const message = typeof exception === "string"
        ? exception
        : isRecord(exception) && typeof exception.message === "string"
          ? exception.message
          : "The server rejected the ready request.";
      setActionError(message);
      setIsSubmitting(false);
    };

    socket.on(LobbyEvent.game_started.to_client.event_name, onGameStarted);
    socket.on(LobbyEvent.ready.to_client.event_name, onReadyChanged);
    socket.on(LobbyEvent.member_notify.to_client.event_name, onMemberChanged);
    socket.on("exception", onSocketException);
    return () => {
      socket.off(LobbyEvent.game_started.to_client.event_name, onGameStarted);
      socket.off(LobbyEvent.ready.to_client.event_name, onReadyChanged);
      socket.off(LobbyEvent.member_notify.to_client.event_name, onMemberChanged);
      socket.off("exception", onSocketException);
    };
  }, [currentUserId, lobbyPinId, refreshLobbyDetails, refreshMembers, socket]);

  useEffect(() => {
    const returnedFromMatch =
      new URLSearchParams(window.location.search).get("returnFromMatch") === "1";
    if (returnedFromMatch) return;

    const gameRoomId = lobby?.details.gameRoomId;
    if (lobby?.details.roomStatus !== "PLAYING" || !gameRoomId) return;

    window.location.assign(
      `/game?tableSessionId=${encodeURIComponent(gameRoomId)}`,
    );
  }, [lobby]);

  const title =
    lobby?.generalSettings.catchPhrase || (lobbyPinId ? `Lobby ${lobbyPinId}` : "Lobby");
  const playerCount = lobby?.details.currentPlayerCount ?? 0;
  const spectatorCount = lobby?.details.currentSpectatorCount ?? 0;
  const isHost = Boolean(
    lobby?.details.hostUserId
    && currentUserId
    && lobby.details.hostUserId === currentUserId,
  );
  const isWaiting = lobby?.details.roomStatus === "WAITING";
  const isReady = members.readyPlayerList.includes(username);
  const allPlayersReady = members.readyPlayerList.length
    >= Math.max(0, members.playerList.length - 1);

  function handleReady() {
    if (!socket || !isConnected || !lobbyPinId) {
      setActionError("The lobby connection is unavailable. Please try again.");
      return;
    }

    setActionError("");
    setIsSubmitting(true);
    socket.emit(LobbyEvent.ready.to_server.event_name, { lobbyPinId });
  }

  async function handleSwapRole() {
    if (!lobbyPinId || !isWaiting || isSubmitting) return;

    setActionError("");
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/game/lobby/swap-role?lobbyPinId=${encodeURIComponent(lobbyPinId)}`,
        { method: "POST" },
      );
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = isRecord(body) && typeof body.message === "string"
          ? body.message
          : `Could not switch lobby role (${response.status}).`;
        throw new Error(message);
      }
      if (
        !isRecord(body)
        || (body.role !== "PLAYER" && body.role !== "SPECTATOR")
      ) {
        throw new Error("The server returned an invalid lobby role.");
      }

      await Promise.all([
        refreshMembers(lobbyPinId),
        refreshLobbyDetails(lobbyPinId),
      ]);
    } catch (swapError) {
      setActionError(
        swapError instanceof Error
          ? swapError.message
          : "Could not switch lobby role.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStart() {
    if (!lobbyPinId) return;

    setActionError("");
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/game/lobby/startgame?lobbyPinId=${encodeURIComponent(lobbyPinId)}`,
        { method: "POST" },
      );
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = isRecord(body) && typeof body.message === "string"
          ? body.message
          : `Could not start the game (${response.status}).`;
        throw new Error(message);
      }
      if (
        !isRecord(body)
        || !isRecord(body.details)
        || typeof body.details.gameRoomId !== "string"
      ) {
        throw new Error("The server did not return a game room ID.");
      }

      window.location.assign(
        `/game?tableSessionId=${encodeURIComponent(body.details.gameRoomId)}`,
      );
    } catch (startError) {
      setActionError(
        startError instanceof Error
          ? startError.message
          : "Could not start the game.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLeave() {
    if (!lobbyPinId) return;

    setActionError("");
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/game/lobby/leave?lobbyPinId=${encodeURIComponent(lobbyPinId)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const message = isRecord(body) && typeof body.message === "string"
          ? body.message
          : `Could not leave the lobby (${response.status}).`;
        throw new Error(message);
      }

      window.location.assign("/lobby");
    } catch (leaveError) {
      setActionError(
        leaveError instanceof Error
          ? leaveError.message
          : "Could not leave the lobby.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-amber-300/20 bg-black/70 shadow-lg">
        <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 sm:px-8">
          <h1 className="bg-yellow-400 bg-clip-text text-2xl font-bold text-transparent sm:text-4xl">
            Lobby
          </h1>
          <p className="max-w-[35vw] break-words bg-yellow-400 bg-clip-text text-lg font-bold text-transparent sm:text-2xl">
            {title}
          </p>
          <div className="ml-auto flex items-center gap-3 sm:gap-6">
            <p className="ml-auto bg-yellow-400 bg-clip-text text-right font-semibold text-transparent sm:text-xl">
              {username}
            </p>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/10 hover:text-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
        <div className="h-1 bg-red-600 to-transparent" />
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-8 sm:py-10">
        {isLoading && <p role="status">Loading lobby details…</p>}
        {error && (
          <p className="text-amber-200" role="alert">
            {error}
          </p>
        )}
        {profileError && (
          <p className="text-amber-200" role="status">
            {profileError}
          </p>
        )}
        {lobby && (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              <LobbyPanel
                title={`Players (${playerCount}/${lobby.gameSettings.maxPlayer})`}
              >
                <LobbyRoster
                  names={members.playerList}
                  readyNames={members.readyPlayerList}
                  isLoading={isMembersLoading}
                />
              </LobbyPanel>

              <LobbyPanel
                title={`Spectators (${spectatorCount}/${lobby.gameSettings.maxSpectator})`}
              >
                <LobbyRoster
                  names={members.spectatorList}
                  isLoading={isMembersLoading}
                />
              </LobbyPanel>
            </div>
            {membersError && (
              <p className="text-amber-200" role="alert">
                {membersError}
              </p>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <LobbyPanel title="Lobby Chat">
                <LobbyChat chatRoomId={lobby.details.chatRoomId} />
              </LobbyPanel>

              <section className="flex flex-col justify-center gap-6 rounded-lg p-4 sm:p-6">
                <div>
                  <h2 className="mb-4 text-xl font-bold text-amber-100 sm:text-2xl">
                    Lobby Details
                  </h2>
                  <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 sm:text-base">
                    <div>
                      <dt className="sr-only">Room ID</dt>
                      <dd>Room ID: {lobby.details.roomPinId}</dd>
                    </div>
                    <div>
                      <dt className="sr-only">Status</dt>
                      <dd>Status: {lobby.details.roomStatus}</dd>
                    </div>
                    <div>
                      <dt className="sr-only">Host</dt>
                      <dd>Host: {lobby.details.hostDisplayName}</dd>
                    </div>
                    <div>
                      <dt className="sr-only">Room type</dt>
                      <dd>
                        Room type: {lobby.generalSettings.roomType}
                      </dd>
                    </div>
                    <div>
                      <dt className="sr-only">Format</dt>
                      <dd>Format: {lobby.gameSettings.format}</dd>
                    </div>
                    <div>
                      <dt className="sr-only">Starting chips</dt>
                      <dd>Starting chips: {lobby.gameSettings.startingChips}</dd>
                    </div>
                    <div>
                      <dt className="sr-only">Big blind</dt>
                      <dd>Big blind: {lobby.gameSettings.bigBlind}</dd>
                    </div>
                    <div>
                      <dt className="sr-only">Ante</dt>
                      <dd>Ante: {lobby.gameSettings.ante ?? "None"}</dd>
                    </div>
                    <div>
                      <dt className="sr-only">Created</dt>
                      <dd>
                        Created: {new Date(lobby.details.createdAt).toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <button
                    type="button"
                    onClick={isHost ? handleStart : handleReady}
                    disabled={
                      isSubmitting
                      || !isWaiting
                      || (isHost && (isMembersLoading || !allPlayersReady))
                      || (!isHost && (!socket || !isConnected))
                    }
                    className="rounded bg-amber-500 px-5 py-2 font-semibold text-neutral-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {isSubmitting
                      ? (isHost ? "Starting…" : "Updating…")
                      : (isHost ? "Start" : (isReady ? "Unready" : "Ready"))}
                  </button>
                  <button
                    type="button"
                    onClick={handleSwapRole}
                    disabled={isSubmitting || !isWaiting || isMembersLoading}
                    className="rounded border border-amber-300/60 px-5 py-2 font-semibold text-amber-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {isSubmitting ? "Updating…" : " Swap ⇄"}
                  </button>
                  {actionError && (
                    <p className="text-right text-sm text-amber-200" role="alert">
                      {actionError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleLeave}
                    disabled={isSubmitting}
                    className="rounded bg-red-700 px-5 py-2 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
                  >
                    {isSubmitting ? "Please wait…" : "Leave"}
                  </button>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
