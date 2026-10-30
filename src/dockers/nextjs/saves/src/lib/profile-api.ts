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

  // Null is included defensively in case a new user
  // does not yet have a profile row.
  user_profile: UserProfileDetails | null;
};

export type UpdateUserProfileRequest = {
  displayName?: string | null;
  pronoun?: PronounType | null;
  signature?: string | null;
  activeTitleId?: string | null;
  cardTheme?: PokerCardTheme;
};

export class ApiError extends Error {
  status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
  }
}

async function createApiError(
  response: Response,
) {
  const data = await response
    .json()
    .catch(() => null);

  const message =
    data?.message ??
    data?.error ??
    `Request failed with status ${response.status}`;

  return new ApiError(
    Array.isArray(message)
      ? message.join(", ")
      : String(message),
    response.status,
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
    },
  );

  if (!response.ok) {
    throw await createApiError(response);
  }

  return response.json();
}

export async function updateMyProfile(
  update: UpdateUserProfileRequest,
): Promise<UserProfileResponse> {
  const response = await fetch(
    "/api/user/update",
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(update),
    },
  );

  if (!response.ok) {
    throw await createApiError(response);
  }

  /*
   * The PATCH endpoint might return only a success
   * message. GET again so the component always receives
   * the complete, current profile.
   */
  return getMyProfile();
}

export async function uploadProfilePicture(
  file: File,
): Promise<UserProfileResponse> {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    "/api/user/profile/uploadProfilePic",
    {
      method: "POST",
      credentials: "include",
      body: formData,
    },
  );

  if (!response.ok) {
    throw await createApiError(response);
  }

  return getMyProfile();
}

// export const PRONOUN_OPTIONS = [
//   "he/him",
//   "she/her",
//   "they/them",
//   "prefer not to say",
// ] as const;

// export type PronounType =
//   (typeof PRONOUN_OPTIONS)[number];

// export type PokerCardTheme =
//   | "STANDARD"
//   | "FANTASY";

// export type UserProfileResponse = {
//   userId: string;
//   displayName: string | null;
//   avatarUrl: string | null;
//   pronoun: PronounType | null;
//   signature: string | null;
//   activeTitleId: string | null;
//   cardTheme: PokerCardTheme;
// };

// export type UpdateUserProfileRequest = {
//   displayName?: string | null;
//   pronoun?: PronounType | null;
//   signature?: string | null;
//   activeTitleId?: string | null;
//   cardTheme?: PokerCardTheme;
// };

// // const API_URL = process.env.NEXT_PUBLIC_API_URL;
// const API_URL ="https://localhost:4333/nestjs";

// function requireApiUrl() {
//   if (!API_URL) {
//     throw new Error(
//       "NEXT_PUBLIC_API_URL is missing from .env.local",
//     );
//   }

//   return API_URL;
// }

// export async function getMyProfile(): Promise<UserProfileResponse> {
//   const apiUrl = requireApiUrl();
 

//   const response = await fetch(`${apiUrl}/user/profile`, {
//     method: "GET",
//     credentials: "include",
//     cache: "no-store",
//   });

//   if (!response.ok) {
//     throw new Error(
//       `Unable to load profile: ${response.status}`,
//     );
//   }

//   return (await response.json()) as UserProfileResponse;
// }

// export async function updateMyProfile(
//   profile: UpdateUserProfileRequest,
// ): Promise<UserProfileResponse> {
//   const apiUrl = requireApiUrl();

//   const response = await fetch(`${apiUrl}/user/update`, {
//     method: "PATCH",
//     credentials: "include",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(profile),
//   });

//   if (!response.ok) {
//     const errorBody = await response.text();

//     throw new Error(
//       errorBody ||
//         `Unable to update profile: ${response.status}`,
//     );
//   }

//   /*
//    * We do not yet know whether PATCH /user/update returns
//    * the updated profile. Fetching it again works whether the
//    * PATCH response is empty or contains another response shape.
//    */
//   return getMyProfile();
// }