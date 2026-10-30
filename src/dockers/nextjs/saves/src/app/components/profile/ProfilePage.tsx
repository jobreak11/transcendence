"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AccountSettings from "./AccountSettings";
import MainProfile from "./MainProfile";
import MatchHistory from "./MatchHistory";
import PlayerStatistics from "./PlayerStatistics";
import ProfileHeader from "./ProfileHeader";

import {
  ApiError,
  // createEmptyProfile,
  getMyProfile,
  type UserProfileResponse,
} from "../../../lib/profile-api";

import type { ProfileTab } from "../../../lib/types";

export default function ProfilePage() {
  const router = useRouter();

  const [activeTab, setActiveTab] =
    useState<ProfileTab>("main");

  const [profile, setProfile] =
    useState<UserProfileResponse | null>(null);

  const [isNewProfile, setIsNewProfile] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        setError("");
        /*
         * No accessToken argument is needed.
         * The browser sends its HttpOnly cookie.
         */
        const loadedProfile = await getMyProfile();

        if (!isMounted) return;

        if (loadedProfile) {
          setProfile(loadedProfile);
          setIsNewProfile(false);
        } else {
          /*
           * HTTP 404:
           * authenticated account exists,
           * but profile information is not saved yet.
           */
          // setProfile(createEmptyProfile());
          setIsNewProfile(true);
          setActiveTab("settings");
        }
      } catch (error) {
        if (!isMounted) return;

        /*
         * HTTP 401:
         * no valid access token, or the token expired.
         */
        if (
          error instanceof ApiError &&
          error.status === 401
        ) {
          router.replace(
            "/auth/signin?callbackUrl=/profile",
          );

          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load profile.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isLoading) {
    return (
      <main className="profile-page">
        <p>Loading profile...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="profile-page">
        <p role="alert">{error}</p>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  function handleProfileSaved(
    updatedProfile: UserProfileResponse,
  ) {
    setProfile(updatedProfile);
    setIsNewProfile(false);
  }

  return (
    <div className="app-shell">
      <ProfileHeader
        profile={profile}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main>
        {isNewProfile && activeTab === "settings" && (
          <p role="status" className="profile-notice">
            Complete your profile and select Save.
          </p>
        )}

        {activeTab === "main" && (
          <MainProfile profile={profile} />
        )}

        {activeTab === "statistics" && (
          <PlayerStatistics />
        )}

        {activeTab === "history" && (
          <MatchHistory />
        )}

        {activeTab === "settings" && (
          <AccountSettings
            profile={profile}
            onSaved={handleProfileSaved}
          />
        )}
      </main>
    </div>
  );
}

// "use client";

// import { useState } from "react";
// import AccountSettings from "./AccountSettings";
// import MainProfile from "./MainProfile";
// import MatchHistory from "./MatchHistory";
// import PlayerStatistics from "./PlayerStatistics";
// import ProfileHeader from "./ProfileHeader";
// import { initialProfile } from "../../../lib/mock-data";
// import type { Profile, ProfileTab } from "../../../lib/types";

// export default function ProfilePage() {
//   const [activeTab, setActiveTab] = useState<ProfileTab>("main");
//   const [profile, setProfile] = useState<Profile>(initialProfile);

//   return (
//     <div className="app-shell">
//       <ProfileHeader
//         profile={profile}
//         activeTab={activeTab}
//         onTabChange={setActiveTab}
//       />

//       <main>
//         {activeTab === "main" && <MainProfile profile={profile} />}
//         {activeTab === "statistics" && (
//           <PlayerStatistics profile={profile} />
//         )}
//         {activeTab === "history" && <MatchHistory />}
//         {activeTab === "settings" && (
//           <AccountSettings profile={profile} onSave={setProfile} />
//         )}
//       </main>
//     </div>
//   );
// }
