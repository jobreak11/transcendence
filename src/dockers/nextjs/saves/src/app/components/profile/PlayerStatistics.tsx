"use client";

import LoadingCard from "./LoadingCard";
import { useProfile } from "./ProfileProvider";
import RadarChart from "./RadarChart";
import SurfaceCard from "./SurfaceCard";

export default function PlayerStatistics() {
  const { profile, isLoading, error } = useProfile();
  if (isLoading) return <LoadingCard message="Loading statistics…" />;
  if (error) return <SurfaceCard className="text-red-300">{error}</SurfaceCard>;

  const rows = [
    ["Join", profile.joinedAt, "Level", profile.level, "Status", profile.status],
    ["Matches Played", profile.matchesPlayed, "Rounds Won", profile.roundsWon, "Win Rate", `${profile.winRate}%`],
    ["Highest Gain", profile.highestGain, "Highest Loss", profile.highestLoss, "Highest Bank", profile.highestBank],
  ];

  return (
    <SurfaceCard>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.flatMap((row) =>
          [0, 2, 4].map((index) => (
            <div key={`${row[index]}-${index}`}>
              <dt className="text-xs uppercase tracking-wide text-zinc-400">{row[index]}</dt>
              <dd className="mt-1 text-lg font-semibold">{row[index + 1]}</dd>
            </div>
          )),
        )}
      </dl>
      <hr className="my-7 border-zinc-500" />
      <div className="flex flex-col items-center">
        <h1 className="mb-3 text-xl font-bold">Playstyle</h1>
        <RadarChart />
      </div>
    </SurfaceCard>
  );
}
