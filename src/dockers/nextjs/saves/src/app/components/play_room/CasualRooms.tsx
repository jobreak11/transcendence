"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import PasswordDialog from "./PasswordDialog";
import RoomRow from "./RoomRow";
import { rooms } from "../../../lib/mock-data";
import type { JoinRole, Room } from "../../../lib/types";

const inputStyles =
  "max-w-full rounded-md border border-[#666] bg-[#2a2a2a] px-2.5 py-1 text-white outline-none focus:ring-2 focus:ring-red-600";

const redButtonStyles =
  "inline-flex cursor-pointer items-center justify-center rounded-lg border-0 bg-red-600 px-2.5 py-2 text-[clamp(14px,calc(6px+2vw),20px)] font-bold text-white hover:bg-red-700 focus-visible:bg-red-700";

export default function CasualRooms() {
  const [roomId, setRoomId] = useState("");
  const [pendingJoin, setPendingJoin] = useState<{
    room: Room;
    role: JoinRole;
  } | null>(null);
  const [message, setMessage] = useState("");

  function joinRoom(room: Room, role: JoinRole) {
    if (room.isPrivate) {
      setPendingJoin({ room, role });
      return;
    }
    setMessage(`Joining ${room.host}'s room as ${role}.`);
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
            Join
          </button>
        </div>
      </form>

      <div className="relative mt-0 flex h-fit w-[90vw] flex-col self-center bg-[rgba(42,42,42,0.75)] p-[1%] max-[800px]:w-[94vw] max-[800px]:p-[3%]">
        {rooms.map((room) => (
          <RoomRow key={room.id} room={room} onJoin={joinRoom} />
        ))}
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
          onClose={() => setPendingJoin(null)}
          onEnter={() => {
            setMessage(
              `Joining ${pendingJoin.room.host}'s room as ${pendingJoin.role}.`,
            );
            setPendingJoin(null);
          }}
        />
      )}
    </section>
  );
}
