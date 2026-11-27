"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  acceptFriendRequest,
  rejectFriendRequest,
  sendFriendRequest,
  type FriendshipStatus,
} from "../../../lib/friends-api";

type FriendActionButtonProps = {
  targetUserId: string;
  initialStatus:
    | FriendshipStatus
    | null;

  onStatusChange?: (
    status: FriendshipStatus,
  ) => void;
};

export default function FriendActionButton({
  targetUserId,
  initialStatus,
  onStatusChange,
}: FriendActionButtonProps) {
  const [status, setStatus] =
    useState(initialStatus);

  const [isLoading, setIsLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  function updateStatus(
    nextStatus: FriendshipStatus,
  ) {
    setStatus(nextStatus);
    onStatusChange?.(nextStatus);
  }

  async function handleAdd() {
    setIsLoading(true);
    setMessage("");

    try {
      await sendFriendRequest(
        targetUserId,
      );

      updateStatus(
        "OUTGOING_PENDING",
      );

      setMessage(
        "Friend request sent.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to send request.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAccept() {
    setIsLoading(true);
    setMessage("");

    try {
      await acceptFriendRequest(
        targetUserId,
      );

      updateStatus("FRIENDS");

      setMessage(
        "Friend request accepted.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to accept request.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReject() {
    setIsLoading(true);
    setMessage("");

    try {
      await rejectFriendRequest(
        targetUserId,
      );

      updateStatus("NONE");

      setMessage(
        "Friend request rejected.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to reject request.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (status === null) {
    return (
      <span className="text-sm text-zinc-400">
        Loading…
      </span>
    );
  }

  if (status === "SELF") {
    return null;
  }

  if (status === "FRIENDS") {
    return (
      <span className="text-sm text-green-400">
        Friends
      </span>
    );
  }

  if (
    status ===
    "OUTGOING_PENDING"
  ) {
    return (
      <span className="text-sm text-yellow-300">
        Request sent
      </span>
    );
  }

  if (
    status ===
    "INCOMING_PENDING"
  ) {
    return (
      <div>
        <div className="flex gap-2">
          <button
            type="button"
            className="red-button"
            disabled={isLoading}
            onClick={handleAccept}
          >
            {isLoading
              ? "Please wait…"
              : "Accept"}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={handleReject}
            className="
              rounded-md border
              border-zinc-500 px-3 py-1
              text-white hover:bg-zinc-700
              disabled:opacity-50
            "
          >
            Reject
          </button>
        </div>

        <p
          className="text-sm text-zinc-300"
          aria-live="polite"
        >
          {message}
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        className="red-button"
        disabled={isLoading}
        onClick={handleAdd}
      >
        {isLoading
          ? "Sending…"
          : "Add Friend"}
      </button>

      <p
        className="text-sm text-zinc-300"
        aria-live="polite"
      >
        {message}
      </p>
    </div>
  );
}