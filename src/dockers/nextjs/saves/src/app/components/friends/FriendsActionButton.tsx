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
    useState<
      FriendshipStatus | null
    >(initialStatus);

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

  async function handleAddFriend() {
    if (
      status !== "NONE" ||
      isLoading
    ) {
      return;
    }

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
          : "Unable to send friend request.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAccept() {
    if (
      status !==
        "INCOMING_PENDING" ||
      isLoading
    ) {
      return;
    }

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
          : "Unable to accept friend request.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReject() {
    if (
      status !==
        "INCOMING_PENDING" ||
      isLoading
    ) {
      return;
    }

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
          : "Unable to reject friend request.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  /*
   * Friendship data is still loading.
   */
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

  /*
   * The two users are already friends.
   */
  if (status === "FRIENDS") {
    return (
      <span className="text-sm text-green-400">
        Friends
      </span>
    );
  }

  /*
   * The current user has already sent
   * a request to this user.
   */
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

  /*
   * This user has sent a friend request
   * to the current user.
   */
  if (
    status ===
    "INCOMING_PENDING"
  ) {
    return (
      <div>
        <div className="flex flex-wrap gap-2">
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
              border-zinc-500
              bg-zinc-800 px-3 py-1
              text-white transition
              hover:bg-zinc-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Reject
          </button>
        </div>

        <p
          className="mt-1 text-sm text-zinc-300"
          aria-live="polite"
        >
          {message}
        </p>
      </div>
    );
  }

  /*
   * status === "NONE"
   */
  return (
    <div>
      <button
        type="button"
        className="rounded-sm text-sm"
        disabled={isLoading}
        onClick={handleAddFriend}
      >
        {isLoading
          ? "Sending…"
          : "Add Friend"}
      </button>

      <p
        className="mt-1 text-sm text-zinc-300"
        aria-live="polite"
      >
        {message}
      </p>
    </div>
  );
}