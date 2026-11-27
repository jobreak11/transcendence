export type FriendRecord = {
  userId: string;
  status: string;
  createdAt: string;
};

export type FriendData = {
  sentRequests: FriendRecord[];
  receivedRequests: FriendRecord[];
  acceptedFriends: FriendRecord[];
};

export type FriendshipStatus =
  | "NONE"
  | "OUTGOING_PENDING"
  | "INCOMING_PENDING"
  | "FRIENDS"
  | "SELF";

type FriendUserRequest = {
  userId: string;
};

type ApiErrorResponse = {
  message?: string | string[];
  error?: string;
};

export class FriendApiError extends Error {
  status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);

    this.name = "FriendApiError";
    this.status = status;
  }
}

async function createFriendApiError(
  response: Response,
): Promise<FriendApiError> {
  const data: ApiErrorResponse | null =
    await response
      .json()
      .catch(() => null);

  let message =
    `Friend request failed (${response.status}).`;

  if (Array.isArray(data?.message)) {
    message = data.message.join(", ");
  } else if (
    typeof data?.message === "string"
  ) {
    message = data.message;
  } else if (
    typeof data?.error === "string"
  ) {
    message = data.error;
  }

  return new FriendApiError(
    message,
    response.status,
  );
}

async function friendFetch<T>(
  path: string,
  options: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw await createFriendApiError(
      response,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isFriendRecord(
  value: unknown,
): value is FriendRecord {
  return (
    isRecord(value) &&
    typeof value.userId === "string" &&
    typeof value.status === "string" &&
    typeof value.createdAt === "string"
  );
}

function isFriendData(
  value: unknown,
): value is FriendData {
  return (
    isRecord(value) &&
    Array.isArray(
      value.sentRequests,
    ) &&
    value.sentRequests.every(
      isFriendRecord,
    ) &&
    Array.isArray(
      value.receivedRequests,
    ) &&
    value.receivedRequests.every(
      isFriendRecord,
    ) &&
    Array.isArray(
      value.acceptedFriends,
    ) &&
    value.acceptedFriends.every(
      isFriendRecord,
    )
  );
}

/**
 * GET /friend
 */
export async function getFriendData(
  signal?: AbortSignal,
): Promise<FriendData> {
  const data =
    await friendFetch<unknown>(
      "/api/friend",
      {
        method: "GET",
        signal,
      },
    );

  if (!isFriendData(data)) {
    throw new Error(
      "The friend API returned an invalid response.",
    );
  }

  return data;
}

/**
 * POST /friend/request
 */
export async function sendFriendRequest(
  targetUserId: string,
): Promise<void> {
  const body: FriendUserRequest = {
    userId: targetUserId,
  };

  await friendFetch<void>(
    "/api/friend/request",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(body),
    },
  );
}

/**
 * PATCH /friend/accept
 */
export async function acceptFriendRequest(
  senderUserId: string,
): Promise<void> {
  const body: FriendUserRequest = {
    userId: senderUserId,
  };

  await friendFetch<void>(
    "/api/friend/accept",
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(body),
    },
  );
}

/**
 * PATCH /friend/reject
 */
export async function rejectFriendRequest(
  senderUserId: string,
): Promise<void> {
  const body: FriendUserRequest = {
    userId: senderUserId,
  };

  await friendFetch<void>(
    "/api/friend/reject",
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(body),
    },
  );
}

export function getFriendshipStatus(
  friendData: FriendData,
  otherUserId: string,
  isSelf = false,
): FriendshipStatus {
  if (isSelf) {
    return "SELF";
  }

  if (
    friendData.acceptedFriends.some(
      (friend) =>
        friend.userId ===
        otherUserId,
    )
  ) {
    return "FRIENDS";
  }

  if (
    friendData.receivedRequests.some(
      (request) =>
        request.userId ===
        otherUserId,
    )
  ) {
    return "INCOMING_PENDING";
  }

  if (
    friendData.sentRequests.some(
      (request) =>
        request.userId ===
        otherUserId,
    )
  ) {
    return "OUTGOING_PENDING";
  }

  return "NONE";
}