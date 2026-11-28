"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createApiError } from "../../../../../lib/profile-api";
import type { components } from "../../../../../types/api";
import { useLanguage } from "../../../../components/language/LanguageProvider";

type FullGameMatch = components["schemas"]["FullGameMatchDto"];
type UserProfile = components["schemas"]["GetUserProfileDto"];

function formatPlace(place: number) {
  const lastTwoDigits = place % 100;
  const suffix =
    lastTwoDigits >= 11 && lastTwoDigits <= 13
      ? "th"
      : place % 10 === 1
        ? "st"
        : place % 10 === 2
          ? "nd"
          : place % 10 === 3
            ? "rd"
            : "th";

  return `${place}${suffix}`;
}

function formatDuration(startedAt: string, endedAt: string) {
  const durationSeconds = Math.max(
    0,
    Math.floor((Date.parse(endedAt) - Date.parse(startedAt)) / 1000),
  );
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  return [
    ...(hours > 0 ? [`${hours}h`] : []),
    ...(minutes > 0 || hours > 0 ? [`${minutes}m`] : []),
    `${seconds}s`,
  ].join(" ");
}

export default function StoredMatchHistoryPage() {
  const { gameMatchId } = useParams<{ gameMatchId: string }>();
  const router = useRouter();
  const { dictionary } = useLanguage();
  const [match, setMatch] = useState<FullGameMatch | null>(null);
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const [playerNamesError, setPlayerNamesError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadMatch() {
      try {
        const response = await fetch(
          `/api/game/matches/find?gameMatchId=${encodeURIComponent(gameMatchId)}`,
          {
            credentials: "include",
            cache: "no-store",
            headers: { Accept: "application/json" },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw await createApiError(response);
        }

        const loadedMatch =
          (await response.json()) as FullGameMatch;

        const nameResults = await Promise.allSettled(
          loadedMatch.userMatchResult.map(async ({ userId }) => {
            const profileResponse = await fetch(
              `/api/user/profile?id=${encodeURIComponent(userId)}`,
              {
                credentials: "include",
                cache: "no-store",
                headers: { Accept: "application/json" },
                signal: controller.signal,
              },
            );

            if (!profileResponse.ok) {
              throw await createApiError(profileResponse);
            }

            const profile =
              (await profileResponse.json()) as UserProfile;

            return {
              userId,
              name:
                profile.user_profile?.displayName?.trim() || profile.tagId,
            };
          }),
        );

        if (controller.signal.aborted) {
          return;
        }

        const names: Record<string, string> = {};
        let failedNames = 0;
        nameResults.forEach((result, index) => {
          if (result.status === "fulfilled") {
            names[result.value.userId] = result.value.name;
          } else {
            names[loadedMatch.userMatchResult[index].userId] = "Unknown player";
            failedNames += 1;
          }
        });

        setPlayerNames(names);
        if (failedNames > 0) {
          setPlayerNamesError(
            `${failedNames} player name${failedNames === 1 ? "" : "s"} could not be loaded.`,
          );
        }
        setMatch(loadedMatch);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load match details.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadMatch();

    return () => controller.abort();
  }, [gameMatchId]);

  const playerResults = [...(match?.userMatchResult ?? [])]
    .sort((playerA, playerB) => playerA.playerPlace - playerB.playerPlace);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-10 text-yellow-300">
      <section className="w-full max-w-3xl rounded-2xl border-b border-neutral-950 bg-neutral-900 p-6 shadow-2xl shadow-red-950/50 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
          Match history
        </p>
        <h1 className="mt-2 text-3xl font-bold">Match details</h1>

        {isLoading && <p className="mt-6">Loading match details...</p>}
        {error && (
          <p role="alert" className="mt-6 text-red-400">
            {error}
          </p>
        )}

        {match && (
          <>
            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-red-900 bg-neutral-950 p-4">
                <dt className="text-sm text-yellow-500/75">Mode</dt>
                <dd className="mt-1 font-semibold">
                  {match.tournament
                    ? `TOURNAMENT / ${
                        match.tournament.isFinalRound
                          ? dictionary.history.finalRound
                          : `${dictionary.history.round} ${match.tournament.roundNumber}`
                      }`
                    : match.gameType === "CASUAL"
                    ? `${match.gameType} / ${match.gameFormat}`
                    : match.gameType}
                </dd>
              </div>
              <div className="rounded-xl border border-red-900 bg-neutral-950 p-4">
                <dt className="text-sm text-yellow-500/75">Duration</dt>
                <dd className="mt-1 font-semibold">
                  {formatDuration(match.startedAt, match.endedAt)}
                </dd>
              </div>
              <div className="rounded-xl border border-red-900 bg-neutral-950 p-4">
                <dt className="text-sm text-yellow-500/75">Hands played</dt>
                <dd className="mt-1 font-semibold">
                  {match.totalHandsPlayed}
                </dd>
              </div>
              <div className="rounded-xl border border-red-900 bg-neutral-950 p-4">
                <dt className="text-sm text-yellow-500/75">Players</dt>
                <dd className="mt-1 font-semibold">{match.totalPlayer}</dd>
              </div>
            </dl>

            <h2 className="mt-8 text-xl font-semibold">Player results</h2>
            {playerResults.length > 0 ? (
              <>
                {playerNamesError && (
                  <p role="status" className="mt-3 text-yellow-500/75">
                    {playerNamesError}
                  </p>
                )}
                <div className="mt-3 overflow-x-auto rounded-xl border border-red-900">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-950 text-yellow-500/75">
                      <tr>
                        <th className="px-4 py-3">Place</th>
                        <th className="px-4 py-3">Hands</th>
                        <th className="px-4 py-3">Wins</th>
                        <th className="px-4 py-3">XP</th>
                        <th className="px-4 py-3">RP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerResults.map((player) => (
                        <tr
                          key={player.userId}
                          className="border-t border-red-950"
                        >
                          <td className="px-4 py-3 font-semibold">
                            {formatPlace(player.playerPlace)}{" "}
                            {playerNames[player.userId]}
                          </td>
                          <td className="px-4 py-3">{player.playCount}</td>
                          <td className="px-4 py-3">{player.winCount}</td>
                          <td className="px-4 py-3">{player.expEarned}</td>
                          <td className="px-4 py-3">{player.rankEarned}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="mt-3 text-yellow-500/75">
                No player results were recorded.
              </p>
            )}
          </>
        )}

        <button
          type="button"
          onClick={() => router.push("/profile?tab=history")}
          className="mt-8 inline-flex rounded-lg border border-red-700 bg-red-800 px-5 py-3 font-semibold text-yellow-300 transition hover:bg-red-700"
        >
          Back
        </button>
      </section>
    </main>
  );
}
