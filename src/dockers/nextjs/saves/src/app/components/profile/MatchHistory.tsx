"use client";

import { useProfile } from "./ProfileProvider";
import ProfileAvatar from "./ProfileAvatar";
import SurfaceCard from "./SurfaceCard";
import defaultProfilePic from "../../../public/defaultProfilePic.svg"
import profile_sample from "../../../public/profile_sample.png"

const matches = [
  { id: 1, time: "TBD", mode: "Casual", enemy: "TBD", result: "Loss", rounds: "2/7", points: "—" },
  { id: 2, time: "TBD", mode: "Ranked", enemy: "TBD", result: "Win", rounds: "5/6", points: "+1" },
];

export default function MatchHistory() {
  const { profile } = useProfile();

  return (
    <SurfaceCard className="divide-y divide-zinc-500">
      {matches.map((match) => (
        <article key={match.id} className="grid gap-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-[80px_1fr_80px] sm:items-center">
          <ProfileAvatar src={profile_sample.src} alt={profile.displayName} className="size-16 rounded-md sm:size-20" />
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 sm:text-base">
            <Item label="Time" value={match.time} />
            <Item label="Mode" value={match.mode} />
            <Item label="Enemy" value={match.enemy} />
            <Item label="Result" value={match.result} emphasized={match.result === "Win"} />
            <Item label="Rounds" value={match.rounds} />
            <Item label="Points" value={match.points} />
          </dl>
          <ProfileAvatar src={defaultProfilePic.src} alt="Opponent" className="size-16 rounded-md sm:size-20" />
        </article>
      ))}
    </SurfaceCard>
  );
}

function Item({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className={`font-semibold ${emphasized ? "text-green-300" : "text-white"}`}>{value}</dd>
    </div>
  );
}
