"use client";

import { useState } from "react";
import AccountSettings from "./AccountSettings";
import MainProfile from "./MainProfile";
import MatchHistory from "./MatchHistory";
import PlayerStatistics from "./PlayerStatistics";
import ProfileHeader from "./ProfileHeader";
import { initialProfile } from "../../../lib/mock-data";
import type { Profile, ProfileTab } from "../../../lib/types";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("main");
  const [profile, setProfile] = useState<Profile>(initialProfile);

  return (
    <div className="app-shell">
      <ProfileHeader
        profile={profile}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main>
        {activeTab === "main" && <MainProfile profile={profile} />}
        {activeTab === "statistics" && (
          <PlayerStatistics profile={profile} />
        )}
        {activeTab === "history" && <MatchHistory />}
        {activeTab === "settings" && (
          <AccountSettings profile={profile} onSave={setProfile} />
        )}
      </main>
    </div>
  );
}
