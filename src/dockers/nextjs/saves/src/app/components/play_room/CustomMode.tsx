"use client";

import { useState } from "react";
import CasualRoomForm from "./CasualRoomForm";
import TournamentRequestForm from "./TournamentRequestForm";
import type { CustomTab } from "../../../lib/types";
import { useLanguage } from "../language/LanguageProvider";

export default function CustomMode() {
  const [activeTab, setActiveTab] = useState<CustomTab>("casual-settings");
  const { dictionary } = useLanguage();

  return (
    <section className="flex flex-col">
      <div className="mt-[3vh] flex h-fit w-[90vw] flex-col self-center bg-[rgba(42,42,42,0.75)] p-[1%] max-[800px]:w-[94vw] max-[800px]:p-[3%]">
        <div className="flex w-full items-stretch border-b-2 border-white">
          <button
            type="button"
            className={`cursor-pointer rounded-t-md border-0 px-3.5 py-2 font-bold text-white ${
              activeTab === "casual-settings" ? "bg-red-600" : "bg-black"
            }`}
            onClick={() => setActiveTab("casual-settings")}
          >
            {dictionary.lobby.casual}
          </button>
          <button
            type="button"
            className={`ml-[2%] cursor-pointer rounded-t-md border-0 px-3.5 py-2 font-bold text-white ${
              activeTab === "tournament-settings" ? "bg-red-600" : "bg-black"
            }`}
            onClick={() => setActiveTab("tournament-settings")}
          >
            {dictionary.lobby.tournament}
          </button>
        </div>

        {activeTab === "casual-settings" ? (
          <CasualRoomForm />
        ) : (
          <TournamentRequestForm />
        )}
      </div>
    </section>
  );
}
