"use client";

import { useEffect, useState } from "react";
import CasualRooms from "./CasualRooms";
import CustomMode from "./CustomMode";
import PlayRoomHeader from "./PlayRoomHeader";
import RankedMode from "./RankedMode";
import TournamentMode from "./TournamentMode";
import type { GameTab } from "../../../lib/types";
import { GetUserProfileDto } from "../../../types/dto";
import { UserProfileResponse } from "../../../lib/profile-api";

export default function PlayRoom() {
  const [activeTab, setActiveTab] = useState<GameTab>("casual");
  const [userProResponse, setUserProfileResponse] = useState<UserProfileResponse | undefined>(undefined);


  useEffect(() => {

    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab === "ranked" || requestedTab === "tournament") {
      setActiveTab(requestedTab);
    }
    const fetchUserProfile = async () => {
    let userProfile: GetUserProfileDto | null = null
      const res = await fetch('/api/user/profile', {
        method: 'GET',
      });

      if (res.ok) {
        userProfile = (await res.json()) as GetUserProfileDto;
      }

      setUserProfileResponse(userProfile === null ? undefined : {
        createdAt: userProfile.createdAt,
        email: userProfile.email,
        role: userProfile.role,
        tagId: userProfile.tagId,
        titleName: userProfile.titleName,
        user_profile: userProfile.user_profile
      })
    }

    fetchUserProfile();

  }

  , []);

  return (
    <div className="min-h-screen">
      <PlayRoomHeader activeTab={activeTab} onTabChange={setActiveTab} profile={userProResponse}/>

      <main>
        {activeTab === "casual" && <CasualRooms />}
        {activeTab === "ranked" && <RankedMode />}
        {activeTab === "tournament" && <TournamentMode />}
        {activeTab === "custom" && <CustomMode />}
      </main>
    </div>
  );
}
