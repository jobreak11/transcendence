export type Profile = {
  id: string;
  displayName: string;
  email: string;
  pronoun: string;
  title: string;
  signature: string;
  imageUrl: string;
  joinedAt: string;
  level: string;
  status: string;
  matchesPlayed: number;
  roundsWon: number;
  winRate: number;
  highestGain: number;
  highestLoss: number;
  highestBank: number;
};

export type EditableProfile = Pick<
  Profile,
  "displayName" | "pronoun" | "title" | "signature" | "imageUrl"
>;

export const EMPTY_PROFILE: Profile = {
  id: "",
  displayName: "Player",
  email: "",
  pronoun: "",
  title: "Poker Rookie",
  signature: "Poker Rookie",
  imageUrl: "/defaultProfilePic.svg",
  joinedAt: "—",
  level: "—",
  status: "Pending",
  matchesPlayed: 0,
  roundsWon: 0,
  winRate: 0,
  highestGain: 0,
  highestLoss: 0,
  highestBank: 0,
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function normalizeProfile(payload: unknown): Profile {
  const root = isRecord(payload) ? payload : {};
  const nested = root.data ?? root.user ?? root.profile;
  const user = isRecord(nested) ? nested : root;

  return {
    id: stringValue(user.id ?? user.userId),
    displayName: stringValue(
      user.displayName ?? user.username ?? user.name,
      EMPTY_PROFILE.displayName,
    ),
    email: stringValue(user.email),
    pronoun: stringValue(user.pronoun),
    title: stringValue(user.title, EMPTY_PROFILE.title),
    signature: stringValue(user.signature, EMPTY_PROFILE.signature),
    imageUrl: stringValue(
      user.imageUrl ?? user.profilePicture ?? user.profilePic ?? user.image,
      EMPTY_PROFILE.imageUrl,
    ),
    joinedAt: stringValue(
      user.joinedAt ?? user.createdAt ?? user.joinDate,
      EMPTY_PROFILE.joinedAt,
    ),
    level: stringValue(user.level, EMPTY_PROFILE.level),
    status: stringValue(user.status, EMPTY_PROFILE.status),
    matchesPlayed: numberValue(user.matchesPlayed ?? user.totalMatches),
    roundsWon: numberValue(user.roundsWon ?? user.totalRoundsWon),
    winRate: numberValue(user.winRate),
    highestGain: numberValue(user.highestGain),
    highestLoss: numberValue(user.highestLoss),
    highestBank: numberValue(user.highestBank),
  };
}

export async function getProfile(signal?: AbortSignal): Promise<Profile> {
  const response = await fetch("/api/user/profile", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    signal,
  });

  if (response.status === 401) throw new Error("UNAUTHORIZED");
  if (!response.ok) throw new Error("Unable to load profile");

  return normalizeProfile(await response.json());
}

export async function updateProfile(
  profile: EditableProfile,
): Promise<Profile | null> {
  const response = await fetch("/api/user/profile", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // Rename these keys here if update-user.dto.ts uses different names.
      username: profile.displayName,
      pronoun: profile.pronoun,
      title: profile.title,
      signature: profile.signature,
      profilePicture: profile.imageUrl,
    }),
  });

  if (response.status === 401) throw new Error("UNAUTHORIZED");
  if (!response.ok) throw new Error("Unable to update profile");
  if (response.status === 204) return null;

  return normalizeProfile(await response.json());
}

export async function uploadProfilePicture(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch("/api/user/profile/uploadProfilePic", {
    method: "POST",
    credentials: "include",
    body,
  });

  if (response.status === 401) throw new Error("UNAUTHORIZED");
  if (!response.ok) throw new Error("Unable to upload profile picture");

  const payload: unknown = await response.json();
  const result = isRecord(payload) ? payload : {};
  const nested = isRecord(result.data) ? result.data : result;

  const imageUrl = stringValue(
    nested.imageUrl ?? nested.profilePicture ?? nested.profilePic ?? nested.url,
  );

  if (!imageUrl) throw new Error("Upload response did not contain an image URL");
  return imageUrl;
}
