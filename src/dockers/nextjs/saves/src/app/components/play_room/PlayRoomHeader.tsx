import Link from "next/link";
import type { GameTab } from "../../../lib/types";

const tabs: Array<{ id: GameTab; label: string }> = [
  { id: "casual", label: "Casual" },
  { id: "ranked", label: "Ranked" },
  { id: "tournament", label: "Tournament" },
  { id: "custom", label: "Custom" },
];

type PlayRoomHeaderProps = {
  activeTab: GameTab;
  onTabChange: (tab: GameTab) => void;
};

export default function PlayRoomHeader({
  activeTab,
  onTabChange,
}: PlayRoomHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex min-h-30 w-full flex-col bg-black max-[800px]:min-h-28">
      <div className="flex min-h-18 w-full items-center pt-1 pl-[8%] text-center max-[800px]:min-h-16 max-[800px]:pl-[4%]">
        <Link
          href="/"
          className="font-serif text-[clamp(28px,calc(16px+2vw),40px)] font-bold text-[#ffd700] no-underline max-[800px]:text-[clamp(24px,7vw,34px)]"
        >
          Play Room
        </Link>
        <div className="ml-auto mr-[4%] max-w-[25vw] [overflow-wrap:anywhere] font-serif text-[clamp(14px,calc(6px+2vw),30px)] font-bold text-[#ffd700] max-[800px]:mr-4 max-[800px]:max-w-[32vw] max-[800px]:text-[clamp(14px,4vw,20px)]">
          USERNAME
        </div>
        <Link
          href="/"
          className="mr-[3%] text-[clamp(14px,calc(0.2vw+1rem),22px)] text-white underline max-[800px]:mr-[4%] max-[800px]:text-sm"
        >
          Logout
        </Link>
      </div>

      <nav
        className="flex min-h-12 w-full items-stretch border-b-4 border-[#f00000]"
        aria-label="Game modes"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`mx-auto w-fit cursor-pointer rounded-t-md border-0 px-2.5 py-2 text-[clamp(14px,calc(6px+2vw),23px)] font-bold text-white focus-visible:outline-2 focus-visible:outline-white max-[800px]:px-1 max-[800px]:text-[clamp(11px,3vw,16px)] ${
              activeTab === tab.id ? "bg-[#f00000]" : "bg-black"
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
