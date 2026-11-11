"use client";

import { useState } from "react";
import type { JoinRole, Room } from "../../../lib/types";

type PasswordDialogProps = {
  room: Room;
  role: JoinRole;
  onClose: () => void;
  onEnter: () => void;
};

export default function PasswordDialog({
  room,
  role,
  onClose,
  onEnter,
}: PasswordDialogProps) {
  const [password, setPassword] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4"
      onMouseDown={onClose}
    >
      <form
        className="w-[min(92vw,620px)] rounded-lg bg-white p-8 text-center text-black"
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-heading"
        onSubmit={(event) => {
          event.preventDefault();
          if (password) onEnter();
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <strong id="password-heading">
          This Room Requires A Password To Enter
        </strong>
        <p className="text-[0.7em]">
          {room.host} · {role}
        </p>
        <div className="mt-4 flex items-center justify-center gap-3 max-[520px]:flex-col max-[520px]:items-stretch">
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            autoFocus
            onChange={(event) => setPassword(event.target.value)}
            className="max-w-full rounded-md border border-[#666] bg-[#2a2a2a] px-2.5 py-1 text-white outline-none focus:ring-2 focus:ring-red-600"
          />
          <button
            className="inline-flex cursor-pointer items-center justify-center rounded-lg border-0 bg-red-600 px-2.5 py-2 text-[clamp(14px,calc(6px+2vw),20px)] font-bold text-white hover:bg-red-700 focus-visible:bg-red-700"
            type="submit"
          >
            Enter
          </button>
        </div>
        <button
          className="mt-4 cursor-pointer border-0 bg-transparent text-[#333] underline"
          type="button"
          onClick={onClose}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
