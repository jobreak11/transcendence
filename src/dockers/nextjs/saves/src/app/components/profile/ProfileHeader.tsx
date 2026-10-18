import Link from "next/link";
import type { Profile, ProfileTab } from "../../../lib/types";

const tabs: Array<{ id: ProfileTab; label: string }> = [
  { id: "main", label: "Main Profile" },
  { id: "statistics", label: "Player Statistics" },
  { id: "history", label: "Match History" },
  { id: "settings", label: "Account Settings" },
];

type ProfileHeaderProps = {
  profile: Profile;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
};

export default function ProfileHeader({
  profile,
  activeTab,
  onTabChange,
}: ProfileHeaderProps) {
  return (
    <header className="headerbar">
      <div className="deheader profile-header-row">
        <div className="usertitle">
          <div className="goldfont username">{profile.username}</div>
          <div className="goldfont user-title">{profile.title}</div>
        </div>
        <Link href="/game" className="red-button play-button">
          Play
        </Link>
        <Link href="#" className="logout-link">
          Logout
        </Link>
      </div>

      <nav className="bartab" aria-label="Profile sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tabcolumn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
