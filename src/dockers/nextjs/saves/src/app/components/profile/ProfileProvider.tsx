"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { usePathname } from "next/navigation";
import { EMPTY_PROFILE, getProfile } from "../../../lib/profile-api";
import type { Profile } from "../../../lib/profile-api";
import { IS_DESIGN_PREVIEW } from "../../../lib/demo";
import profile_sample from "../../../public/profile_sample.png"

const MOCK_PROFILE: Profile = {
  ...EMPTY_PROFILE,
  id: "260801-0101",
  displayName: "USERNAME",
  email: "player@transcend888.test",
  pronoun: "they/them",
  title: "Poker Rookie",
  signature: "Poker Rookie",
  imageUrl: "../../../public/profile_sample.png",
  joinedAt: "03/08/2005",
  level: "12",
  status: "Online",
  matchesPlayed: 48,
  roundsWon: 126,
  winRate: 62.5,
  highestGain: 880,
  highestLoss: 320,
  highestBank: 8888,
};

type ProfileContextValue = {
  profile: Profile;
  isLoading: boolean;
  error: string;
  refreshProfile: () => Promise<void>;
  setProfile: Dispatch<SetStateAction<Profile>>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile>(
    IS_DESIGN_PREVIEW ? MOCK_PROFILE : EMPTY_PROFILE,
  );
  const [isLoading, setIsLoading] = useState(!IS_DESIGN_PREVIEW);
  const [error, setError] = useState("");

  const refreshProfile = useCallback(async () => {
    if (IS_DESIGN_PREVIEW) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      setProfile(await getProfile());
    } catch (cause) {
      if (cause instanceof Error && cause.message === "UNAUTHORIZED") {
        const callbackUrl = encodeURIComponent(pathname || "/profile");
        window.location.assign(`/auth/signin?callbackUrl=${callbackUrl}`);
        return;
      }
      setError("Unable to load your profile.");
    } finally {
      setIsLoading(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!IS_DESIGN_PREVIEW) void refreshProfile();
  }, [refreshProfile]);

  const value = useMemo(
    () => ({ profile, isLoading, error, refreshProfile, setProfile }),
    [profile, isLoading, error, refreshProfile],
  );

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used inside ProfileProvider");
  }
  return context;
}
