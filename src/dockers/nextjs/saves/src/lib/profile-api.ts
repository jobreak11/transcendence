export const PRONOUN_OPTIONS = [
  "he/him",
  "she/her",
  "they/them",
  "prefer not to say",
] as const;

export type PronounType =
  (typeof PRONOUN_OPTIONS)[number];

export type PokerCardTheme =
  | "STANDARD"
  | "FANTASY";

/*
 * The nested user_profile object returned by GET.
 */
export type UserProfileDetails = {
  displayName: string | null;
  avatarUrl: string | null;
  pronoun: PronounType | null;
  signature: string | null;
  activeTitleId: string | null;
  cardTheme: PokerCardTheme;
};

/*
 * Complete GET /user/profile response.
 */
export type UserProfileResponse = {
  tagId: string;
  email: string;
  role: string;
  createdAt: string;
  titleName: string | null;

  /*
   * A new user might not have profile information yet.
   */
  user_profile:
    UserProfileDetails | null;
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

/*
 * Actual request body expected by PATCH /user/update.
 */
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

async function createApiError(
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

  /*
   * Swagger requires the editable fields to be
   * nested inside user_profile.
   */
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

  /*
   * The PATCH response may contain only a success
   * message, so fetch the complete updated profile.
   */
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

  /*
   * Reload the profile to receive the new avatarUrl.
   */
  return getMyProfile();
}

