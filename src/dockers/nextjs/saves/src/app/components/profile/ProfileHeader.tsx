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

type ProfileHeaderProps = {
  profile: UserProfileResponse;
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
            href="/game"
            className="red-button play-button text-lg"
          >
            {dictionary.common.play}
          </Link>

          <LanguageSwitcher />

          <Link
            href="#"
            className="logout-link text-base"
          >
            {dictionary.common.logout}
          </Link>
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
