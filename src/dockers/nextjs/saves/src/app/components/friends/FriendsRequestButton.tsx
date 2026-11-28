"use client";

import { useState } from "react";
import { sendFriendRequest } from "../../../lib/friends-api";

type FriendRequestButtonProps = {
  targetTagId: string;
};

export default function FriendRequestButton({
  targetTagId,
}: FriendRequestButtonProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function handleClick() {
    if (!targetTagId || status !== "idle") return;

    setStatus("sending");
    setError("");

    try {
      await sendFriendRequest(targetTagId);
      setStatus("sent");
    } catch (error) {
      setStatus("idle");
      setError(
        error instanceof Error ? error.message : "Unable to send request.",
      );
    }
  }

  return (
    <div className="mt-6 flex flex-col items-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={!targetTagId || status !== "idle"}
        className="rounded-md bg-red-700 px-5 py-2 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
      >
        {status === "sending"
          ? "Sending…"
          : status === "sent"
            ? "Request sent"
            : "Add Friend"}
      </button>

      <span className="sr-only" role="status">
        {status === "sent" ? "Friend request sent." : ""}
      </span>

      {error && (
        <p className="mt-2 max-w-64 text-center text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
