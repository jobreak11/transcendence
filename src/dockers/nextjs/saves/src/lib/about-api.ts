import { getFriendData } from "./friends-api";
import { getPublicProfileByUserId } from "./profile-api";

export type AboutFriend = {
  userId: string;
  tagId: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export type AboutTrophy = {
  unlockedAt: string;
  trophy: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    createdAt: string;
  };
};

export async function getAboutFriends(
  signal?: AbortSignal,
): Promise<{ total: number; friends: AboutFriend[] }> {
  const { acceptedFriends } = await getFriendData(signal);

  const friends = await Promise.all(
    acceptedFriends.map(async ({ userId }): Promise<AboutFriend> => {
      try {
        const profile = await getPublicProfileByUserId(userId, signal);

        return {
          userId,
          tagId: profile.tagId,
          displayName: profile.user_profile?.displayName ?? null,
          avatarUrl: profile.user_profile?.avatarUrl ?? null,
        };
      } catch (error) {
        if (signal?.aborted) throw error;

        // Keep the accepted friend in the list if their profile lookup fails.
        return { userId, tagId: null, displayName: null, avatarUrl: null };
      }
    }),
  );

  return { total: acceptedFriends.length, friends };
}

export async function getAboutTrophies(
  signal?: AbortSignal,
): Promise<AboutTrophy[]> {
  const query = new URLSearchParams({ limit: "20", offset: "0" });
  const response = await fetch(`/api/trophies?${query}`, {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Unable to load trophies (${response.status}).`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("The server did not return a trophy list.");
  }

  return data;
}