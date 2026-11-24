"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  acceptFriendRequest,
  getFriendData,
  rejectFriendRequest,
  type FriendData,
} from "../../../lib/friends-api";

export default function FriendRequestsPanel() {
  const [
    friendData,
    setFriendData,
  ] = useState<FriendData | null>(
    null,
  );

  const [error, setError] =
    useState("");

  const [
    processingUserId,
    setProcessingUserId,
  ] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadFriends() {
      try {
        const data =
          await getFriendData(
            controller.signal,
          );

        setFriendData(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load friend requests.",
          );
        }
      }
    }

    void loadFriends();

    return () => {
      controller.abort();
    };
  }, []);

  async function handleAccept(
    userId: string,
  ) {
    if (!friendData) {
      return;
    }

    setProcessingUserId(userId);
    setError("");

    try {
      await acceptFriendRequest(userId);

      const acceptedRequest =
        friendData.receivedRequests.find(
          (request) =>
            request.userId === userId,
        );

      setFriendData({
        ...friendData,

        receivedRequests:
          friendData.receivedRequests.filter(
            (request) =>
              request.userId !== userId,
          ),

        acceptedFriends:
          acceptedRequest
            ? [
                ...friendData.acceptedFriends,
                {
                  ...acceptedRequest,
                  status: "ACCEPTED",
                },
              ]
            : friendData.acceptedFriends,
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to accept request.",
      );
    } finally {
      setProcessingUserId(null);
    }
  }

  async function handleReject(
    userId: string,
  ) {
    if (!friendData) {
      return;
    }

    setProcessingUserId(userId);
    setError("");

    try {
      await rejectFriendRequest(userId);

      setFriendData({
        ...friendData,

        receivedRequests:
          friendData.receivedRequests.filter(
            (request) =>
              request.userId !== userId,
          ),
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to reject request.",
      );
    } finally {
      setProcessingUserId(null);
    }
  }

  if (!friendData) {
    return (
      <section className="blogbox">
        <p>
          {error ||
            "Loading friend requests…"}
        </p>
      </section>
    );
  }

  return (
    <section className="blogbox">
      <h2 className="goldfont">
        Friend Requests
      </h2>

      {friendData.receivedRequests
        .length === 0 ? (
        <p>No pending friend requests.</p>
      ) : (
        friendData.receivedRequests.map(
          (request) => (
            <div
              key={request.userId}
              className="
                flex items-center
                justify-between gap-4
                border-b border-zinc-600
                py-3
              "
            >
              <Link
                href={`/profile/${encodeURIComponent(request.userId)}`}
                className="hover:underline"
              >
                User: {request.userId}
              </Link>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="red-button"
                  disabled={
                    processingUserId ===
                    request.userId
                  }
                  onClick={() =>
                    handleAccept(
                      request.userId,
                    )
                  }
                >
                  Accept
                </button>

                <button
                  type="button"
                  disabled={
                    processingUserId ===
                    request.userId
                  }
                  onClick={() =>
                    handleReject(
                      request.userId,
                    )
                  }
                >
                  Reject
                </button>
              </div>
            </div>
          ),
        )
      )}

      <p
        role={error ? "alert" : undefined}
        aria-live="polite"
      >
        {error}
      </p>
    </section>
  );
}