"use client";

import Link from "next/link";

import LanguageSwitcher from "../language/LanguageSwitcher";
import { useLanguage } from "../language/LanguageProvider";

import type {
  ProfileTab,
} from "../../../lib/types";

import type {
  UserProfileResponse,
} from "../../../lib/profile-api";

// import {
//   getMyTitles,
//   type UserTitle,
// } from "../../../lib/title-api";

import { signOut } from "../../../lib/auth";

type ProfileHeaderProps = {
  profile: UserProfileResponse;
  // title: UserTitle;
  activeTab: ProfileTab;
  onTabChange: (
    tab: ProfileTab,
  ) => void;
};

const tabs: ProfileTab[] = [
  "main",
  "statistics",
  "history",
  "settings",
];

export default function ProfileHeader({
  profile,
  activeTab,
  onTabChange,
}: ProfileHeaderProps) {
  const { dictionary } =
    useLanguage();

  const tabLabels:
    Record<ProfileTab, string> = {
      main:
        dictionary.navigation.about,

      statistics:
        dictionary.navigation.statistics,

      history:
        dictionary.navigation.history,

      settings:
        dictionary.navigation.settings,
    };

  return (
    <header className="headerbar">
      <div className="deheader profile-header-row">
        <div className="usertitle">
          <div className="goldfont username">
            {profile.user_profile
              ?.displayName ??
              profile.email}
          </div>

          <div className="goldfont user-title">
            {profile.titleName ??
              "No active title"}
          </div>
        </div>


        <div className="ml-auto mr-16 flex items-center gap-3 sm:gap-5">
          <Link
            href="/lobby"
            className="red-button play-button text-lg"
          >
            {dictionary.common.lobby}
          </Link>

          <LanguageSwitcher />
          <form action={signOut} className="inline">
            <button type="submit" className="inline appearance-none border-0 bg-transparent p-0 font-[inherit] leading-[inherit] text-left text-[clamp(14px,calc(0.2vw+1rem),22px)] text-white underline whitespace-nowrap cursor-pointer max-[800px]:text-sm">
              {dictionary.common.logout}
             </button>
          </form>
        </div>
      </div>

      <nav
        className="bartab"
        aria-label="Profile sections"
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`tabcolumn ${
              activeTab === tab
                ? "active"
                : ""
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
