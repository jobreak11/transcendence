"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import CasualRoomForm from "./CasualRoomForm";
import PasswordDialog from "./PasswordDialog";
import RoomRow from "./RoomRow";
import type { GetLobbyPublicDto } from "../../../types/dto";
import type { JoinRole, Room } from "../../../lib/types";
import { useMainSocket } from "../../(protected)/_context/useMainSocket";

const inputStyles =
  "max-w-full rounded-md border border-[#666] bg-[#2a2a2a] px-2.5 py-1 text-white outline-none focus:ring-2 focus:ring-red-600";

const redButtonStyles =
  "inline-flex cursor-pointer items-center justify-center rounded-lg border-0 bg-red-600 px-2.5 py-2 text-[clamp(14px,calc(6px+2vw),20px)] font-bold text-white hover:bg-red-700 focus-visible:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50";

function isLobbyIdList(
  value: unknown,
): value is Array<{ details: { roomPinId: string } }> {
  return Array.isArray(value)
    && value.every((lobby) =>
      typeof lobby === "object"
      && lobby !== null
      && "details" in lobby
      && typeof lobby.details === "object"
      && lobby.details !== null
      && "roomPinId" in lobby.details
      && typeof lobby.details.roomPinId === "string",
    );
}

export default function CasualRooms() {
  const router = useRouter();
  const { isConnected, connectionError } = useMainSocket();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [joinedRoomIds, setJoinedRoomIds] = useState<Set<string>>(new Set());
  const [roomId, setRoomId] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [roomsError, setRoomsError] = useState("");
  const [pendingJoin, setPendingJoin] = useState<{
    room: Room;
    role: JoinRole;
  } | null>(null);
  const [joinError, setJoinError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [message, setMessage] = useState("");

  const loadRooms = useCallback(async () => {
    setIsLoadingRooms(true);
    setRoomsError("");

    try {
      const [response, joinedResponse] = await Promise.all([
        fetch("/api/game/lobby/allRooms", { cache: "no-store" }),
        fetch("/api/game/lobby/my-lobby", { cache: "no-store" }),
      ]);
      const body: unknown = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof body === "object"
          && body !== null
          && "message" in body
          && typeof body.message === "string"
            ? body.message
            : `Could not load lobbies (${response.status}).`;
        throw new Error(errorMessage);
      }

      if (!Array.isArray(body)) {
        throw new Error("The server returned an invalid lobby list.");
      }

      let joinedBody: unknown = [];
      if (joinedResponse.status !== 404) {
        joinedBody = await joinedResponse.json().catch(() => null);
        if (!joinedResponse.ok) {
          const errorMessage =
            typeof joinedBody === "object"
            && joinedBody !== null
            && "message" in joinedBody
            && typeof joinedBody.message === "string"
              ? joinedBody.message
              : `Could not load your lobbies (${joinedResponse.status}).`;
          throw new Error(errorMessage);
        }
      }

      if (!isLobbyIdList(joinedBody)) {
        throw new Error("The server returned an invalid list of joined lobbies.");
      }

      const lobbyList = body as GetLobbyPublicDto[];
      setJoinedRoomIds(
        new Set(joinedBody.map((lobby) => lobby.details.roomPinId)),
      );
      setRooms(
        lobbyList.map((lobby) => ({
          id: lobby.details.roomPinId,
          host: lobby.details.hostDisplayName,
          catchphrase: lobby.generalSettings.catchPhrase ?? "",
          isPrivate: lobby.generalSettings.roomType === "PRIVATE",
          players: lobby.details.currentPlayerCount,
          maxPlayers: lobby.gameSettings.maxPlayer,
          spectators: lobby.details.currentSpectatorCount ?? 0,
          maxSpectators: lobby.gameSettings.maxSpectator,
        })),
      );
    } catch (error) {
      setRoomsError(
        error instanceof Error ? error.message : "Could not load lobbies.",
      );
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    if (isConnected) {
      void loadRooms();
      return;
    }

    setIsLoadingRooms(false);
    setRoomsError("");
  }, [isConnected, loadRooms]);

  async function handleLobbyCreated(lobbyPinId: string) {
    setIsCreatingRoom(false);
    setMessage(`Lobby ${lobbyPinId} created.`);
    await loadRooms();
  }

  if (isCreatingRoom) {
    return (
      <section className="flex flex-col">
        <div className="mt-[3vh] flex h-fit w-[90vw] flex-col self-center bg-[rgba(42,42,42,0.75)] p-[1%] max-[800px]:w-[94vw] max-[800px]:p-[3%]">
          <div className="flex items-center justify-between gap-4 border-b-2 border-white pb-3 max-[520px]:flex-col max-[520px]:items-stretch">
            <h1 className="text-xl font-bold text-white">Create a new lobby</h1>
            <button
              type="button"
              className={redButtonStyles}
              onClick={() => setIsCreatingRoom(false)}
            >
              Back to lobby list
            </button>
          </div>
          <CasualRoomForm onCreated={handleLobbyCreated} />
        </div>
      </section>
    );
  }

  function joinRoom(room: Room, role: JoinRole) {
    if (room.isPrivate) {
      setJoinError("");
      setPendingJoin({ room, role });
      return;
    }

    void submitJoin(room, role);
  }

  async function submitJoin(room: Room, role: JoinRole, password?: string) {
    setIsJoining(true);
    setJoinError("");
    setMessage("");

    try {
      const response = await fetch("/api/game/lobby/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lobbyPinId: room.id,
          isSpectator: role === "spectator",
          ...(password ? { password } : {}),
        }),
      });
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage =
          typeof body === "object"
          && body !== null
          && "message" in body
          && typeof body.message === "string"
            ? body.message
            : `Could not join lobby (${response.status}).`;
        throw new Error(errorMessage);
      }

      setPendingJoin(null);
      jumpIntoRoom(room);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Could not join this lobby.";
      setJoinError(errorMessage);
      setMessage(errorMessage);
    } finally {
      setIsJoining(false);
    }
  }

  function jumpIntoRoom(room: Room) {
    router.push(`/lobby/room?lobbyPinId=${encodeURIComponent(room.id)}`);
  }

  function searchRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = rooms.find(
      (room) => room.id.toLowerCase() === roomId.trim().toLowerCase(),
    );
    setMessage(found ? `Room hosted by ${found.host} found.` : "Room not found.");
  }

  return (
    <section className="flex flex-col">
      <form
        className="mt-[3vh] grid w-[92vw] grid-cols-[1fr_5fr] self-center overflow-hidden rounded-t-md max-[800px]:w-[94vw] max-[800px]:grid-cols-1"
        onSubmit={searchRoom}
      >
        <div className="flex items-center bg-[rgba(42,42,42,0.75)] p-[1vw] max-[800px]:px-4 max-[800px]:py-3">
          Rooms
        </div>
        <div className="flex items-center gap-4 bg-[rgba(29,29,29,0.85)] p-[1vw] pl-[5%] max-[800px]:flex-wrap max-[800px]:px-4 max-[800px]:py-3">
          <label htmlFor="playroom">Search by ID:</label>
          <input
            id="playroom"
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
            className={inputStyles}
          />
          <button className={redButtonStyles} type="submit">
            Search
          </button>
          <button
            className={redButtonStyles}
            type="button"
            disabled={!isConnected}
            onClick={() => setIsCreatingRoom(true)}
          >
            Create Room
          </button>
        </div>
      </form>

      <div className="relative mt-0 flex h-fit w-[90vw] flex-col self-center bg-[rgba(42,42,42,0.75)] p-[1%] max-[800px]:w-[94vw] max-[800px]:p-[3%]">
        {!isConnected && (
          <p role={connectionError ? "alert" : "status"}>
            {connectionError ?? "Connecting to lobby service…"}
          </p>
        )}
        {isLoadingRooms && <p role="status">Loading lobbies…</p>}
        {roomsError && (
          <p className="text-[#ffe77f]" role="alert">
            {roomsError}{" "}
            <button
              type="button"
              className="underline"
              disabled={!isConnected}
              onClick={() => void loadRooms()}
            >
              Retry
            </button>
          </p>
        )}
        {rooms.map((room) => (
          <RoomRow
            key={room.id}
            room={room}
            isJoined={joinedRoomIds.has(room.id)}
            onJoin={joinRoom}
            onJumpIn={jumpIntoRoom}
          />
        ))}
        {isConnected && !isLoadingRooms && !roomsError && rooms.length === 0 && (
          <p>No lobbies are available. Create one to get started.</p>
        )}
        <p
          className="mt-2 min-h-[1.4em] text-[0.65em] text-[#ffe77f]"
          aria-live="polite"
        >
          {message}
        </p>
      </div>

      {pendingJoin && (
        <PasswordDialog
          room={pendingJoin.room}
          role={pendingJoin.role}
          error={joinError}
          isSubmitting={isJoining}
          onClose={() => setPendingJoin(null)}
          onEnter={(password) =>
            void submitJoin(pendingJoin.room, pendingJoin.role, password)
          }
        />
      )}
    </section>
  );
}
