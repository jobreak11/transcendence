"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useProfile } from "./ProfileProvider";
import { IS_DESIGN_PREVIEW } from "../../../lib/demo";

const navigation = [
  { label: "Main Profile", shortLabel: "Profile", href: "/profile" },
  { label: "Player Statistics", shortLabel: "Statistics", href: "/statistics" },
  { label: "Match History", shortLabel: "History", href: "/history" },
  { label: "Account Settings", shortLabel: "Settings", href: "/setting" },
] as const;

export default function SiteHeader() {
  const pathname = usePathname();
  const { profile } = useProfile();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    if (IS_DESIGN_PREVIEW) {
      window.location.assign("/profile");
      return;
    }
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      window.location.assign("/");
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b-4 border-red-600 bg-black text-white shadow-xl">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <div className="min-w-0 flex-1 sm:flex sm:items-end sm:gap-7">
          <Link
            href="/profile"
            className="block truncate font-serif text-2xl font-bold text-yellow-400 sm:text-3xl lg:text-4xl"
          >
            {profile.displayName}
          </Link>
          <p className="truncate font-serif text-sm font-bold text-yellow-300 sm:text-lg lg:text-2xl">
            {profile.title}
          </p>
        </div>

        <Link
          href="/game"
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold shadow-md transition hover:bg-red-500 sm:px-6 sm:text-base"
        >
          Play
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-sm underline underline-offset-4 transition hover:text-red-300 disabled:opacity-60 sm:text-base"
        >
          {isSigningOut ? "Signing out…" : "Logout"}
        </button>
      </div>

      <nav aria-label="Profile navigation" className="mx-auto grid max-w-[1600px] grid-cols-4 px-1 sm:px-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-t-md px-1 py-2 text-center text-xs font-bold transition-colors sm:px-3 sm:text-base lg:text-lg ${
                isActive ? "bg-red-600 text-white" : "bg-black text-white hover:bg-white/10"
              }`}
            >
              <span className="sm:hidden">{item.shortLabel}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
