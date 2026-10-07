"use client";

/* eslint-disable @next/next/no-img-element */

import type { ReactNode } from "react";
import { useProfile } from "./ProfileProvider";
import ProfileAvatar from "./ProfileAvatar";
import SurfaceCard from "./SurfaceCard";
import LoadingCard from "./LoadingCard";
import defaultProfilePic from "../../../public/defaultProfilePic.svg"
import iconLogo from "../../../public/iconLogo.svg"
import profile_sample from "../../../public/profile_sample.png"

const friendPlaceholders = Array.from({ length: 5 }, (_, index) => index);
const trophyPlaceholders = Array.from({ length: 5 }, (_, index) => index);

export default function MainProfile() {
  const { profile, isLoading, error } = useProfile();

  if (isLoading) return <LoadingCard message="Loading profile…" />;
  if (error) return <SurfaceCard className="text-red-300">{error}</SurfaceCard>;

  return (
    <div className="space-y-6">
      <SurfaceCard className="grid gap-5 md:grid-cols-[minmax(180px,260px)_1fr]">
        <ProfileAvatar
          // src={profile.imageUrl}
          // allow to edit and upload
          src={profile_sample.src}
          alt={`${profile.displayName}'s profile`}
          className="aspect-square w-full max-w-[260px] justify-self-center"
        />

        <div className="min-w-0 text-sm sm:text-base lg:text-lg">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Stat label="Join" value={profile.joinedAt} />
            <Stat label="Level" value={profile.level} />
            <Stat label="Status" value={profile.status} />
            <Stat label="Matches Played" value={profile.matchesPlayed} />
            <Stat label="Rounds Won" value={profile.roundsWon} />
            <Stat label="Win Rate" value={`${profile.winRate}%`} />
          </dl>
          <hr className="my-5 border-zinc-500" />
          <p className="break-words">
            <span className="font-semibold">Signature:</span> {profile.signature}
          </p>
        </div>
      </SurfaceCard>

      <SurfaceCard className="space-y-6">
        <IconCollection title="Friends">
          {friendPlaceholders.map((item) => (
            <img
              key={item}
              src={defaultProfilePic.src}
              alt="Friend profile placeholder"
              className="size-12 rounded-md object-cover sm:size-16"
            />
          ))}
        </IconCollection>

        <IconCollection title="Trophies">
          {trophyPlaceholders.map((item) => (
            <img
              key={item}
              src={iconLogo.src}
              alt="Poker trophy"
              className="size-12 object-contain sm:size-16"
            />
          ))}
        </IconCollection>
      </SurfaceCard>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-1 font-semibold text-white">{value}</dd>
    </div>
  );
}

function IconCollection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold sm:text-xl">{title}</h2>
      <div className="flex flex-wrap gap-3 pl-2 sm:pl-5">{children}</div>
    </div>
  );
}
