'use client';

import { signOut } from "../lib/auth";

export function SignOutButton() {
  return (
    <button
      type="button"
      className="bg-red-600 hover:bg-black text-white font-bold px-4 py-1.5 rounded-md cursor-pointer text-sm"
    >
      Sign Out
    </button>
  );
}