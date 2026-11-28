
export const PRONOUN_OPTIONS = [
  "he/him",
  "she/her",
  "they/them",
  "prefer not to say",
] as const;

export type PronounType =
  (typeof PRONOUN_OPTIONS)[number];

export type PokerCardTheme =
  | "standard"
  | "Nasturzia";

export type UserProfileDetails = {
  displayName: string | null;
  avatarUrl: string | null;
  pronoun: PronounType | null;
  signature: string | null;
  activeTitleId: string | null;
  cardTheme: PokerCardTheme;
};

export type UserProfileResponse = {
  tagId: string;
  email: string;
  role: string;
  createdAt: string;
  titleName: string | null;

  user_profile:
    UserProfileDetails | null;
};

export type UserGameStatisticDto = {
  userId: string;
  expPoint: number;
  level: number;
  rankPoint: number;
  matchPlayed: number;
  totalMatchesWon: number;
  totalHandsPlayed: number;
  totalHandsWon: number;
};

/*
 * Editable fields inside user_profile.
 *
 * Every field is optional because PATCH should send
 * only properties that have changed.
 */
export type UserProfileUpdateFields = {
  displayName?: string | null;
  avatarUrl?: string | null;
  pronoun?: PronounType | null;
  signature?: string | null;
  activeTitleId?: string | null;
  cardTheme?: PokerCardTheme;
};


export type UpdateUserRequest = {
  password?: string;
  user_profile?:
    UserProfileUpdateFields;
};

type ApiIssue = {
  path?: Array<string | number>;
  message?: string;
};

type ApiErrorResponse = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
  issues?: ApiIssue[];
  details?: unknown;
};

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function readResponseBody(
  response: Response,
): Promise<unknown> {
  const responseText =
    await response.text();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
}

export async function createApiError(
  response: Response,
) {
  const responseBody =
    await readResponseBody(response);

  console.error(
    "Full API error response:",
    {
      status: response.status,
      data: responseBody,
    },
  );

  if (
    typeof responseBody === "string"
  ) {
    return new ApiError(
      responseBody,
      response.status,
    );
  }

  const data =
    responseBody as
      | ApiErrorResponse
      | null;

  let errorMessage =
    `Request failed: ${response.status}`;

  if (Array.isArray(data?.message)) {
    errorMessage =
      data.message.join(", ");
  } else if (
    typeof data?.message === "string"
  ) {
    errorMessage = data.message;
  } else if (
    typeof data?.error === "string"
  ) {
    errorMessage = data.error;
  }

  if (
    Array.isArray(data?.issues) &&
    data.issues.length > 0
  ) {
    const issueMessage =
      data.issues
        .map((issue) => {
          const field =
            issue.path?.join(".") ||
            "unknown field";

          return `${field}: ${
            issue.message ??
            "Invalid value"
          }`;
        })
        .join(", ");

    errorMessage +=
      ` — ${issueMessage}`;
  }

  return new ApiError(
    errorMessage,
    response.status,
    data?.details ?? data?.issues,
  );
}

export async function getMyProfile():
Promise<UserProfileResponse> {
  const response = await fetch(
    "/api/user/profile",
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw await createApiError(
      response,
    );
  }

  return response.json() as
    Promise<UserProfileResponse>;
}

export async function getMyGameStatistics():
Promise<UserGameStatisticDto | null> {
  const response = await fetch(
    "/api/game/statistics/find",
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    const responseBody =
      response.status === 404
        ? null
        : await readResponseBody(response.clone());
    const errorData =
      typeof responseBody === "object" &&
      responseBody !== null
        ? responseBody as ApiErrorResponse
        : null;

    if (
      response.status === 404 ||
      errorData?.statusCode === 404
    ) {
      return null;
    }

    throw await createApiError(response);
  }

  return response.json() as
    Promise<UserGameStatisticDto>;
}

export async function updateMyProfile(
  profileChanges:
    UserProfileUpdateFields,
): Promise<UserProfileResponse> {
  if (
    Object.keys(profileChanges).length ===
    0
  ) {
    throw new Error(
      "No profile changes were provided.",
    );
  }

  const requestBody:
    UpdateUserRequest = {
      user_profile: profileChanges,
    };

  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    console.log(
      "PATCH request body:",
      requestBody,
    );
  }

  const response = await fetch(
    "/api/user/update",
    {
      method: "PATCH",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type":
          "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(
        requestBody,
      ),
    },
  );

  if (!response.ok) {
    throw await createApiError(
      response,
    );
  }

  return getMyProfile();
}

export async function uploadProfilePicture(
  file: File,
): Promise<UserProfileResponse> {
  const acceptedTypes = [
    "image/jpeg",
    "image/png",
  ];

  if (!acceptedTypes.includes(file.type)){
    throw new Error(
      "Only JPG, JPEG, and PNG images are supported.",
    );
  }
  const maximumFileSize =
    5 * 1024 * 1024;

  if (file.size > maximumFileSize) {
    throw new Error(
      "Profile picture must be smaller than 5 MB.",
    );
  }

  const formData = new FormData();

  formData.append(
    "file",
    file,
    file.name,
  );

  const response = await fetch(
    "/api/user/profile/uploadProfilePic",
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    },
  );

  if (!response.ok) {
    throw await createApiError(
      response,
    );
  }
  return getMyProfile();
}


// Friend Profile
export type PublicUserProfileResponse = {
  /*
   * Internal UUID used by the friend API.
   */
  userId: string;
  /*
   * Public identifier used in the URL.
   */
  tagId: string;

  createdAt: string;
  titleName: string | null;
  isSelf?: boolean;

  user_profile: {
    displayName: string | null;
    avatarUrl: string | null;
    pronoun: PronounType | null;
    signature: string | null;
    activeTitleId: string | null;
    cardTheme: PokerCardTheme;
  } | null;
};

export async function getPublicProfileByTagId(
  tagId: string,
  signal?: AbortSignal,
): Promise<PublicUserProfileResponse> {
  
  
  const trimmedTagId =
    tagId.trim();

  if (!trimmedTagId) {
    throw new Error(
      "A profile tag ID is required.",
    );
  }

  const searchParams =
    new URLSearchParams({
      tagId: trimmedTagId,
    });

  const response = await fetch(
    `/api/user/profile?${searchParams.toString()}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      signal,
    },
  );

  if (!response.ok) {
    throw await createApiError(
      response,
    );
  }

  return response.json();
}

export async function getPublicProfileByUserId(
  userId: string,
  signal?: AbortSignal,
): Promise<PublicUserProfileResponse> {
  const query = new URLSearchParams({ id: userId });

  const response = await fetch(`/api/user/profile?${query}`, {
    credentials: "include",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw await createApiError(response);
  }

  return response.json();
}