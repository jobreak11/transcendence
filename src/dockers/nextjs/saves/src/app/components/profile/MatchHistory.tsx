"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProfileImage from "./ProfileImage";
import { useLanguage } from "../language/LanguageProvider";
import { createApiError } from "../../../lib/profile-api";
import type { components } from "../../../types/api";

type UserGameMatch = components["schemas"]["GetGameMatchDto"];
type MatchHistoryDictionary = ReturnType<typeof useLanguage>["dictionary"];

function formatDuration(startedAt: string, endedAt: string) {
  const durationSeconds = Math.floor(
    (Date.parse(endedAt) - Date.parse(startedAt)) / 1000,
  );

  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
    return "—";
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function formatPoints(points: number, unit: "XP" | "RP") {
  return `${points > 0 ? "+" : ""}${points} ${unit}`;
}

function formatPlacement(place: number) {
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

function formatMatchMode(
  match: UserGameMatch,
  dictionary: MatchHistoryDictionary,
) {
  if (match.tournament) {
    const roundLabel = match.tournament.isFinalRound
      ? dictionary.history.finalRound
      : `${dictionary.history.round} ${match.tournament.roundNumber}`;
    return `TOURNAMENT / ${roundLabel}`;
  }
  return match.gameMatch.gameType === "CASUAL"
    ? `${match.gameMatch.gameType} / ${match.gameMatch.gameFormat}`
    : match.gameMatch.gameType;
}

function formatMatchResult(
  match: UserGameMatch,
  dictionary: MatchHistoryDictionary,
) {
  if (!match.tournament) return formatPlacement(match.playerPlace);
  if (match.tournament.isFinalRound) {
    return formatPlacement(match.tournament.playerPlace ?? match.playerPlace);
  }
  if (match.tournament.status === "QUALIFIED") return dictionary.history.qualified;
  if (match.tournament.status === "DISQUALIFIED") return dictionary.history.disqualified;
  return dictionary.history.pending;
}

export default function MatchHistory() {
  const router = useRouter();
  const { dictionary } = useLanguage();
  const [matches, setMatches] = useState<UserGameMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadMatches() {
      try {
        const response = await fetch(
          "/api/game/matches?limit=1000&offset=0",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: { Accept: "application/json" },
          },
        );

        if (!response.ok) {
          throw await createApiError(response);
        }

        const loadedMatches =
          (await response.json()) as UserGameMatch[];

        if (isMounted) {
          setMatches(loadedMatches);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load match history.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMatches();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="content active">
      <div className="blogbox history-card">
        {isLoading && <p>Loading match history...</p>}
        {error && <p role="alert">{error}</p>}
        {!isLoading && !error && matches.length === 0 && (
          <p>No matches found.</p>
        )}
        {matches.map((match) => (
          <div className="history-entry" key={match.gameMatchId}>
            <ProfileImage className="history-avatar" />
            <div className="responsive-table-wrap history-table-wrap">
              <table className="history-table">
                <tbody>
                  <tr>
                    <td>
                      {dictionary.history.time}:{" "}
                      {formatDuration(
                        match.gameMatch.startedAt,
                        match.gameMatch.endedAt,
                      )}
                    </td>
                    <td>
                      {dictionary.history.mode}:{" "}
                      {formatMatchMode(match, dictionary)}
                    </td>
                    <td
                      role="link"
                      tabIndex={0}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        router.push(`/game/history/${encodeURIComponent(match.gameMatchId)}`)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          router.push(
                            `/game/history/${encodeURIComponent(match.gameMatchId)}`,
                          );
                        }
                      }}
                    >
                      {dictionary.history.goToMatch}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      {dictionary.history.results}:{" "}
                      {formatMatchResult(match, dictionary)}
                    </td>
                    <td>
                      {dictionary.history.rounds}: {match.playCount}
                    </td>
                    <td>
                      {dictionary.history.points}:{" "}
                      {match.gameMatch.gameType === "RANKED"
                        ? formatPoints(match.rankEarned, "RP")
                        : formatPoints(match.expEarned, "XP")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="history-avatar">
              <Image
                src={`/img/defaultProfilePic.svg`}
                alt="Opponent"
                fill
                sizes="100px"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
