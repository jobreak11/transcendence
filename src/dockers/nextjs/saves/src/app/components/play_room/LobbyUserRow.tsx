"use client";

import Link from "next/link";

import FriendActionButton from
  "../friends/FriendsActionButton";

import {
  getFriendshipStatus,
  type FriendData,
} from "../../../lib/friends-api";

export type LobbyMember = {
  userId: string;
  tagId: string;
  displayName: string;
};

type LobbyUserRowProps = {
  member: LobbyMember;
  isReady: boolean;
  currentUserId: string | null;
  friendData: FriendData | null;
  showFriendAction?: boolean;
};

export function LobbyUserRow({
  member,
  isReady,
  currentUserId,
  friendData,
  showFriendAction = true,
}: LobbyUserRowProps) {
  // NEW: calculate relationship status.
  const friendshipStatus =
    friendData
      ? getFriendshipStatus(
          friendData,
          member.userId,
          currentUserId ===
            member.userId,
        )
      : null;

  return (
    <li
      className="
        flex min-h-12 items-center
        justify-between gap-4
        border-b border-white/10
        px-2 py-2
      "
    >
      {/* NEW: link to public profile */}
      <Link
        href={`/profile/${encodeURIComponent(member.userId)}`}
        className={`
          min-w-0 truncate
          hover:underline
          ${
            isReady
              ? "font-semibold text-emerald-400"
              : "text-white"
          }
        `}
        title={
          isReady
            ? `${member.displayName} — Ready`
            : member.displayName
        }
      >
        {member.displayName}
      </Link>

      {/* NEW: friend request control */}
      {showFriendAction && (
        <FriendActionButton
          targetUserId={member.userId}
          initialStatus={
            friendshipStatus
          }
        />
      )}
    </li>
  );
}