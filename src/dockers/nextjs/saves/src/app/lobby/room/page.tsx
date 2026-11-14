"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { signOut } from "../../../lib/auth";
import type { GetLobbyPublicDto } from "../../../types/dto";
import { useMainSocket } from "../../(protected)/_context/useMainSocket";
import { LobbyEvent } from "../../../websocket-events/main/lobby/lobby-events";

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
        { cache: "no-store" },
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

    async function loadLobby() {
      try {
        const response = await fetch(
          `/api/game/lobby?lobbyPinId=${encodeURIComponent(lobbyId)}`,
          { cache: "no-store" },
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

        if (isCurrent) setLobby(body);
      } catch (loadError) {
        if (isCurrent) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load lobby details.",
          );
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
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

    void loadLobby();
    void loadUsername();
    void refreshMembers(lobbyId, () => isCurrent);

    return () => {
      isCurrent = false;
    };
  }, [refreshMembers]);

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
    socket.on("exception", onSocketException);
    return () => {
      socket.off(LobbyEvent.game_started.to_client.event_name, onGameStarted);
      socket.off(LobbyEvent.ready.to_client.event_name, onReadyChanged);
      socket.off("exception", onSocketException);
    };
  }, [currentUserId, lobbyPinId, refreshMembers, socket]);

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
                <div
                  aria-label="Lobby chat history"
                  className="min-h-60 space-y-3"
                />
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
