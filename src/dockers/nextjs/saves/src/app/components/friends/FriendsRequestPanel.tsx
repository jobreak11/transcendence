"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  acceptFriendRequest,
  getFriendData,
  rejectFriendRequest,
  type FriendData,
} from "../../../lib/friends-api";
import {
  getPublicProfileByTagId,
  getPublicProfileByUserId,
} from "../../../lib/profile-api";

type SenderRecord = {
  userId: string;
  tagId?: string | null;
  displayName?: string | null;
};

type SenderDetails = {
  tagId: string;
  displayName: string | null;
};

function getSenderTagId(request: SenderRecord): string | undefined {
  const tagId = request.tagId?.trim();
  if (tagId) return tagId;

  // Some responses store the public tag in the userId field.
  const userId = request.userId.trim();
  return /^\d{6}_\d{4}$/.test(userId) ? userId : undefined;
}

export default function FriendRequestsPanel() {
  const [friendData, setFriendData] = useState<FriendData | null>(null);
  const [senders, setSenders] = useState<Record<string, SenderDetails>>({});
  const [error, setError] = useState("");
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function loadSender(request: SenderRecord) {
      const tagId = getSenderTagId(request);

      try {
        const profile = tagId
          ? await getPublicProfileByTagId(tagId, signal)
          : await getPublicProfileByUserId(request.userId, signal);

        if (signal.aborted) return;

        setSenders((current) => ({
          ...current,
          [request.userId]: {
            tagId: profile.tagId,
            displayName: profile.user_profile?.displayName?.trim() || null,
          },
        }));
      } catch (error) {
        if (!signal.aborted) {
          console.warn("Could not load the friend request sender's profile.", error);
        }
      }
    }

    async function loadFriends() {
      try {
        const data = await getFriendData(signal);
        if (signal.aborted) return;

        setFriendData(data);

        for (const request of data.receivedRequests) {
          const sender: SenderRecord = request;

          if (!getSenderTagId(sender) || !sender.displayName?.trim()) {
            void loadSender(sender);
          }
        }
      } catch (error) {
        if (!signal.aborted) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load friend requests.",
          );
        }
      }
    }

    void loadFriends();
    return () => controller.abort();
  }, []);

  async function handleResponse(action: "accept" | "reject", userId: string) {
    if (!friendData || processingUserId !== null) return;

    setProcessingUserId(userId);
    setError("");

    try {
      if (action === "accept") {
        await acceptFriendRequest(userId);
      } else {
        await rejectFriendRequest(userId);
      }

      setFriendData((current) => {
        if (!current) return current;

        const handledRequest = current.receivedRequests.find(
          (request) => request.userId === userId,
        );

        return {
          ...current,
          receivedRequests: current.receivedRequests.filter(
            (request) => request.userId !== userId,
          ),
          acceptedFriends:
            action === "accept" && handledRequest
              ? [
                  ...current.acceptedFriends,
                  { ...handledRequest, status: "ACCEPTED" },
                ]
              : current.acceptedFriends,
        };
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : `Unable to ${action} request.`,
      );
    } finally {
      setProcessingUserId(null);
    }
  }

  return (
    <section className="blogbox" aria-labelledby="friend-requests-heading">
      <div className="flex w-full min-w-0 flex-col gap-3">
        <h2 id="friend-requests-heading" className="goldfont text-lg">
          Friend Requests
        </h2>

        {!friendData && !error && (
          <p className="text-sm text-zinc-300" role="status">
            Loading friend requests…
          </p>
        )}

        {friendData?.receivedRequests.length === 0 && (
          <p className="text-sm text-zinc-300">No pending friend requests.</p>
        )}

        {friendData && friendData.receivedRequests.length > 0 && (
          <ul className="divide-y divide-white/10 border-t border-white/10">
            {friendData.receivedRequests.map((request) => {
              const record: SenderRecord = request;
              const sender = senders[record.userId];
              const tagId = sender?.tagId || getSenderTagId(record);
              const label =
                sender?.displayName ||
                record.displayName?.trim() ||
                tagId ||
                "Player";

              const isBusy = processingUserId !== null;

              return (
                <li
                  key={record.userId}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 break-words font-medium text-white">
                    {tagId ? (
                      <Link
                        href={`/profile/${encodeURIComponent(tagId)}`}
                        className="underline-offset-4 hover:text-amber-300 hover:underline"
                      >
                        {label}
                      </Link>
                    ) : (
                      <span>{label}</span>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      className="red-button disabled:opacity-50"
                      disabled={isBusy}
                      onClick={() => void handleResponse("accept", record.userId)}
                    >
                      Accept
                    </button>

                    <button
                      type="button"
                      className="rounded-md border border-zinc-500 px-3 py-1.5 text-sm font-semibold text-zinc-200 hover:bg-white/10 disabled:opacity-50"
                      disabled={isBusy}
                      onClick={() => void handleResponse("reject", record.userId)}
                    >
                      Reject
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
