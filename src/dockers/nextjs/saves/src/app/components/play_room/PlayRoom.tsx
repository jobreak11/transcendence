"use client";

import { useState } from "react";
import CasualRooms from "./CasualRooms";
import CustomMode from "./CustomMode";
import PlayRoomHeader from "./PlayRoomHeader";
import RankedMode from "./RankedMode";
import TournamentMode from "./TournamentMode";
import type { GameTab } from "../../../lib/types";

export default function PlayRoom() {
  const [activeTab, setActiveTab] = useState<GameTab>("casual");

  return (
    <div className="min-h-screen">
      <PlayRoomHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <main>
        {activeTab === "casual" && <CasualRooms />}
        {activeTab === "ranked" && <RankedMode />}
        {activeTab === "tournament" && <TournamentMode />}
        {activeTab === "custom" && <CustomMode />}
      </main>
    </div>
  );
}
