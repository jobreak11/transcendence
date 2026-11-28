export type FriendRecord = {
  userId: string;
  status: string;
  createdAt: string;
  tagId?: string;
  displayName?: string | null;
};

export type FriendshipStatus =
  | "NONE"
  | "OUTGOING_PENDING"
  | "INCOMING_PENDING"
  | "FRIENDS"
  | "SELF";

export type FriendData = {
  receivedRequests: FriendRecord[];
  sentRequests: FriendRecord[];
  acceptedFriends: FriendRecord[];
};

async function friendFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`/api/friend${path}`, {
    ...options,
    credentials: "same-origin",
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.message ?? body?.error;
    const fallback =
      response.status === 401
        ? "Sign in to use friend requests."
        : `Friend request failed (${response.status}).`;

    throw new Error(typeof message === "string" ? message : fallback);
  }

  return response;
}

export async function getFriendData(
  signal?: AbortSignal,
): Promise<FriendData> {
  const response = await friendFetch("", { signal });
  const data = await response.json();

  if (!Array.isArray(data?.receivedRequests)) {
    throw new Error("The server did not return an incoming friend request list.");
  }

  return data;
}

export async function sendFriendRequest(targetTagId: string): Promise<void> {
  const query = new URLSearchParams({ targetTagId });
  await friendFetch(`/request?${query}`, { method: "POST" });
}

export async function acceptFriendRequest(senderUserId: string): Promise<void> {
  const query = new URLSearchParams({ targetUserId: senderUserId });
  await friendFetch(`/accept?${query}`, { method: "PATCH" });
}

export async function rejectFriendRequest(senderUserId: string): Promise<void> {
  const query = new URLSearchParams({ targetUserId: senderUserId });
  await friendFetch(`/reject?${query}`, { method: "PATCH" });
}
