"use client";

import Link from "next/link";
import { UserProfileResponse } from "../../../lib/profile-api";
import LanguageSwitcher from "../language/LanguageSwitcher";
import { useLanguage } from "../language/LanguageProvider";
import { signOut } from "../../../lib/auth";

import type {
  GameTab,
} from "../../../lib/types";

const tabs: GameTab[] = [
  "casual",
  "ranked",
  "tournament",
  "custom",
];

type PlayRoomHeaderProps = {
  profile: UserProfileResponse;
  activeTab: GameTab;

  onTabChange: (
    tab: GameTab,
  ) => void;
};

export default function PlayRoomHeader({
  profile,
  activeTab,
  onTabChange,
}: PlayRoomHeaderProps) {
  const { dictionary } =
    useLanguage();

  /*
   * Map each internal tab ID to its
   * translated display label.
   */
  const tabLabels:
    Record<GameTab, string> = {
      casual:
        dictionary.lobby.casual,

      ranked:
        dictionary.lobby.rank,

      tournament:
        dictionary.lobby.tournament,

      custom:
        dictionary.lobby.custom,
    };

  return (
    <header className="sticky top-0 z-30 flex min-h-30 w-full flex-col bg-black max-[800px]:min-h-28">
      <div className="flex min-h-18 w-full items-center gap-4 pt-1 pl-[8%] text-center max-[800px]:min-h-16 max-[800px]:gap-2 max-[800px]:pl-[4%]">
        <Link
          href="/"
          className="font-serif text-[clamp(28px,calc(16px+2vw),40px)] font-bold text-[#ffd700] no-underline max-[800px]:text-[clamp(24px,7vw,34px)]"
        >
          Lobby
        </Link>

        <div className="ml-auto flex items-center gap-4 pr-[3%] max-[800px]:gap-2 max-[800px]:pr-[4%]">
          <div className="max-w-[25vw] [overflow-wrap:anywhere] font-serif text-[clamp(14px,calc(6px+2vw),30px)] font-bold text-[#ffd700] max-[800px]:max-w-[25vw] max-[800px]:text-[clamp(12px,3vw,18px)]">
            <Link href={`/profile`}
            >
              {profile?.user_profile
                ?.displayName ??
                profile?.email ?? "Guest"}
            </Link>
          </div>

          <LanguageSwitcher />
          <form action={signOut} className="inline">
              <button type="submit" className="inline appearance-none border-0 bg-transparent p-0 font-[inherit] leading-[inherit] text-left text-[clamp(14px,calc(0.2vw+1rem),22px)] text-white underline whitespace-nowrap cursor-pointer max-[800px]:text-sm">
                  {dictionary.common.logout}
              </button>
          </form>
        </div>
      </div>

      <nav
        className="flex min-h-12 w-full items-stretch border-b-4 border-[#f00000]"
        aria-label="Game mode"
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`mx-auto w-fit cursor-pointer rounded-t-md border-0 px-2.5 py-2 text-[clamp(14px,calc(6px+2vw),23px)] font-bold text-white focus-visible:outline-2 focus-visible:outline-white max-[800px]:px-1 max-[800px]:text-[clamp(11px,3vw,16px)] ${
              activeTab === tab
                ? "bg-[#f00000]"
                : "bg-black"
            }`}
            onClick={() =>
              onTabChange(tab)
            }
          >
            {tabLabels[tab]}
          </button>
        ))}
      </nav>
    </header>
  );
}
