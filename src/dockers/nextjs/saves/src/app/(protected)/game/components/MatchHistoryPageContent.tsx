"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface MatchHistory {
  tableSessionId: string;
  totalHandsPlayed: number;
  matchStartedAt: string;
  matchEndedAt: string;
  isRankedMatch?: boolean;
  playerId?: string | null;
  playerPlaces: Record<string, number>;
  playerStats?: Record<string, {
    playCount: number;
    winCount: number;
    expEarned: number;
    rankEarned?: number;
  }>;
  playerNames: Record<string, string>;
}

interface MatchLobby {
  details: {
    roomPinId: string;
    gameRoomId: string | null;
  };
  generalSettings: {
    roomType: string;
  };
}

type TournamentMatchOutcome = {
  status: "PENDING" | "QUALIFIED" | "DISQUALIFIED" | "FINAL";
  roundNumber: number;
  isFinalRound: boolean;
  playerPlace?: number | null;
};

function isTournamentMatchOutcome(value: unknown): value is TournamentMatchOutcome {
  return typeof value === "object"
    && value !== null
    && "status" in value
    && (
      value.status === "PENDING"
      || value.status === "QUALIFIED"
      || value.status === "DISQUALIFIED"
      || value.status === "FINAL"
    )
    && "roundNumber" in value
    && typeof value.roundNumber === "number"
    && Number.isSafeInteger(value.roundNumber)
    && value.roundNumber > 0
    && "isFinalRound" in value
    && typeof value.isFinalRound === "boolean"
    && (
      !("playerPlace" in value)
      || value.playerPlace === null
      || (
        typeof value.playerPlace === "number"
        && Number.isSafeInteger(value.playerPlace)
        && value.playerPlace > 0
      )
    )
    && (
      value.status !== "FINAL"
      || "playerPlace" in value
    )
}

async function getTournamentMatchOutcome(
  tableSessionId: string,
): Promise<TournamentMatchOutcome | null> {
  const response = await fetch(
    `/api/tournament/match-result/${encodeURIComponent(tableSessionId)}`,
    { cache: "no-store" },
  );
  if (response.status === 404) return null;

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof body === "object"
        && body !== null
        && "message" in body
        && typeof body.message === "string"
      ? body.message
      : `Could not load the tournament result (${response.status}).`;
    throw new Error(message);
  }
  if (!isTournamentMatchOutcome(body)) {
    throw new Error("The server returned an invalid tournament result.");
  }
  return body;
}

function isMatchLobbyList(value: unknown): value is MatchLobby[] {
  return Array.isArray(value)
    && value.every((lobby) =>
      typeof lobby === "object"
      && lobby !== null
      && "details" in lobby
      && typeof lobby.details === "object"
      && lobby.details !== null
      && "roomPinId" in lobby.details
      && typeof lobby.details.roomPinId === "string"
      && "gameRoomId" in lobby.details
      && (typeof lobby.details.gameRoomId === "string"
        || lobby.details.gameRoomId === null)
      && "generalSettings" in lobby
      && typeof lobby.generalSettings === "object"
      && lobby.generalSettings !== null
      && "roomType" in lobby.generalSettings
      && typeof lobby.generalSettings.roomType === "string",
    );
}

async function findMatchLobby(tableSessionId: string): Promise<MatchLobby | null> {
  const response = await fetch("/api/game/lobby/my-lobby", {
    cache: "no-store",
  });
  if (response.status === 404) return null;

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof body === "object"
        && body !== null
        && "message" in body
        && typeof body.message === "string"
      ? body.message
      : `Could not find the match lobby (${response.status}).`;
    throw new Error(message);
  }
  if (!isMatchLobbyList(body)) {
    throw new Error("The server returned an invalid list of joined lobbies.");
  }

  return body.find((lobby) => lobby.details.gameRoomId === tableSessionId) ?? null;
}

function isMatchHistory(value: unknown): value is MatchHistory {
  if (typeof value !== "object" || value === null) return false;

  return "tableSessionId" in value
    && typeof value.tableSessionId === "string"
    && "totalHandsPlayed" in value
    && typeof value.totalHandsPlayed === "number"
    && Number.isSafeInteger(value.totalHandsPlayed)
    && value.totalHandsPlayed >= 0
    && "matchStartedAt" in value
    && typeof value.matchStartedAt === "string"
    && Number.isFinite(Date.parse(value.matchStartedAt))
    && "matchEndedAt" in value
    && typeof value.matchEndedAt === "string"
    && Number.isFinite(Date.parse(value.matchEndedAt))
    && (
      !("isRankedMatch" in value)
      || typeof value.isRankedMatch === "boolean"
    )
    && (
      !("playerId" in value)
      || typeof value.playerId === "string"
      || value.playerId === null
    )
    && "playerPlaces" in value
    && typeof value.playerPlaces === "object"
    && value.playerPlaces !== null
    && !Array.isArray(value.playerPlaces)
    && Object.values(value.playerPlaces).every((place) =>
      typeof place === "number" && Number.isSafeInteger(place) && place > 0
    )
    && (
      !("playerStats" in value)
      || (
        typeof value.playerStats === "object"
        && value.playerStats !== null
        && !Array.isArray(value.playerStats)
        && Object.values(value.playerStats).every((stats) =>
          typeof stats === "object"
          && stats !== null
          && "playCount" in stats
          && typeof stats.playCount === "number"
          && Number.isSafeInteger(stats.playCount)
          && stats.playCount >= 0
          && "winCount" in stats
          && typeof stats.winCount === "number"
          && Number.isSafeInteger(stats.winCount)
          && stats.winCount >= 0
          && "expEarned" in stats
          && typeof stats.expEarned === "number"
          && Number.isSafeInteger(stats.expEarned)
          && stats.expEarned >= 0
          && (
            !("rankEarned" in stats)
            || (
              typeof stats.rankEarned === "number"
              && Number.isSafeInteger(stats.rankEarned)
            )
          )
        )
      )
    )
    && "playerNames" in value
    && typeof value.playerNames === "object"
    && value.playerNames !== null
    && !Array.isArray(value.playerNames)
    && Object.values(value.playerNames).every((name) =>
      typeof name === "string"
    );
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

function formatPlace(place: number) {
  const suffix = place % 100 >= 11 && place % 100 <= 13
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

export default function MatchHistoryPageContent({
  isRankedMatch,
}: {
  isRankedMatch: boolean;
}) {
  const router = useRouter();
  const [history, setHistory] = useState<MatchHistory | null>(null);
  const [isReturning, setIsReturning] = useState(false);
  const [returnError, setReturnError] = useState("");
  const [matchLobby, setMatchLobby] = useState<MatchLobby | null>(null);
  const [isLoadingMatchLobby, setIsLoadingMatchLobby] = useState(!isRankedMatch);
  const [tournamentOutcome, setTournamentOutcome] = useState<TournamentMatchOutcome | null>(null);
  const [isCheckingTournamentOutcome, setIsCheckingTournamentOutcome] = useState(!isRankedMatch);
  const [tournamentOutcomeError, setTournamentOutcomeError] = useState("");

  useEffect(() => {
    const storedHistory = window.sessionStorage.getItem("gameMatchHistory");
    if (!storedHistory) return;

    try {
      const parsed: unknown = JSON.parse(storedHistory);
      if (isMatchHistory(parsed)) {
        setHistory(parsed);
      } else {
        console.error("Stored match history has an invalid format.");
      }
    } catch (error) {
      console.error("Could not read the stored match history.", error);
    }
  }, []);

  useEffect(() => {
    if (
      !history
      || isRankedMatch
      || isCheckingTournamentOutcome
      || tournamentOutcome
    ) return;

    let active = true;
    setIsLoadingMatchLobby(true);
    void findMatchLobby(history.tableSessionId)
      .then((lobby) => {
        if (!active) return;
        setMatchLobby(lobby);
      })
      .catch((error: unknown) => {
        if (active) {
          setReturnError(
            error instanceof Error ? error.message : "Could not determine the match type.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoadingMatchLobby(false);
      });

    return () => {
      active = false;
    };
  }, [history, isRankedMatch, isCheckingTournamentOutcome, tournamentOutcome]);

  useEffect(() => {
    if (!history || isRankedMatch) return;

    let active = true;
    let retryTimer: number | undefined;
    let attempts = 0;
    setTournamentOutcome(null);
    setTournamentOutcomeError("");
    setIsCheckingTournamentOutcome(true);

    const checkOutcome = async () => {
      try {
        const outcome = await getTournamentMatchOutcome(history.tableSessionId);
        if (!active) return;
        if (outcome?.status === "PENDING" && attempts < 20) {
          attempts += 1;
          retryTimer = window.setTimeout(() => void checkOutcome(), 500);
          return;
        }
        setTournamentOutcome(outcome);
        setIsCheckingTournamentOutcome(false);
        if (outcome) setIsLoadingMatchLobby(false);
      } catch (outcomeError) {
        if (!active) return;
        setTournamentOutcomeError(
          outcomeError instanceof Error
            ? outcomeError.message
            : "Could not determine the tournament result.",
        );
        setIsCheckingTournamentOutcome(false);
      }
    };

    void checkOutcome();
    return () => {
      active = false;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [history, isRankedMatch]);

  const rankedPlayers = Object.entries(history?.playerPlaces ?? {})
    .sort(([, placeA], [, placeB]) => placeA - placeB);
  const matchMode = isRankedMatch
    ? "RANKED"
    : tournamentOutcome
      ? `TOURNAMENT / ${
        tournamentOutcome.isFinalRound
          ? "Final Round"
          : `Round ${tournamentOutcome.roundNumber}`
      }`
      : isLoadingMatchLobby
        ? "Loading..."
        : matchLobby?.generalSettings.roomType === "TOURNAMENT"
          ? "TOURNAMENT"
          : "CASUAL";
  const isQualificationOutcome = tournamentOutcome?.status === "QUALIFIED"
    || tournamentOutcome?.status === "DISQUALIFIED";
  const isTournamentResultPending = isCheckingTournamentOutcome
    || tournamentOutcome?.status === "PENDING";
  const isTournamentMatch = tournamentOutcome !== null;
  const returnButtonText = isReturning
    ? "Returning…"
    : isCheckingTournamentOutcome
      ? "Checking tournament result…"
      : isLoadingMatchLobby
        ? "Loading match…"
        : isTournamentMatch
          ? "Back to tournaments"
          : isRankedMatch
            ? "Back to ranked"
            : "Back to lobby";

  async function handleReturnToLobby() {
    setIsReturning(true);
    setReturnError("");

    if (isTournamentMatch) {
      window.sessionStorage.removeItem("gameTableSessionId");
      window.sessionStorage.removeItem("gameMatchHistory");
      router.push("/lobby?tab=tournament");
      return;
    }

    if (isRankedMatch) {
      try {
        if (history) {
          const response = await fetch(
            `/api/game/lobby/leave?lobbyPinId=${encodeURIComponent(history.tableSessionId)}`,
            { method: "DELETE" },
          );
          if (!response.ok && response.status !== 404) {
            const body: unknown = await response.json().catch(() => null);
            const message = typeof body === "object"
              && body !== null
              && "message" in body
              && typeof body.message === "string"
              ? body.message
              : `Could not leave the ranked match lobby (${response.status}).`;
            throw new Error(message);
          }
        }

        window.sessionStorage.removeItem("gameTableSessionId");
        window.sessionStorage.removeItem("gameMatchHistory");
        router.push("/lobby?tab=ranked");
      } catch (error) {
        setReturnError(
          error instanceof Error
            ? error.message
            : "Could not leave the ranked match lobby.",
        );
      } finally {
        setIsReturning(false);
      }
      return;
    }

    if (!history) {
      router.push("/lobby");
      return;
    }

    try {
      const currentMatchLobby =
        matchLobby ?? await findMatchLobby(history.tableSessionId);
      if (!currentMatchLobby) {
        router.push("/lobby");
        return;
      }

      router.push(
        `/lobby/room?lobbyPinId=${encodeURIComponent(currentMatchLobby.details.roomPinId)}&returnFromMatch=1`,
      );
    } catch (error) {
      setReturnError(
        error instanceof Error ? error.message : "Could not return to the lobby.",
      );
    } finally {
      setIsReturning(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-10 text-yellow-300">
      <section className="w-full max-w-3xl rounded-2xl border-b border-neutral-950 bg-neutral-900 p-6 shadow-2xl shadow-red-950/50 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
          {isQualificationOutcome ? "Tournament result" : "Match history"}
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          {isQualificationOutcome ? "Tournament match result" : "Match details"}
        </h1>

        {history ? (
          isQualificationOutcome ? (
            <div className="mt-10 rounded-xl border border-red-900 bg-neutral-950 p-8 text-center" role="status">
              <p className="text-sm uppercase tracking-[0.2em] text-yellow-500/75">
                {matchMode}
              </p>
              <h2 className="mt-3 text-3xl font-bold text-yellow-300">
                {tournamentOutcome?.status === "QUALIFIED"
                  ? "You qualified"
                  : "You were disqualified"}
              </h2>
            </div>
          ) : isTournamentResultPending ? (
            <div className="mt-10 rounded-xl border border-red-900 bg-neutral-950 p-8 text-center" role="status">
              {tournamentOutcome && (
                <p className="text-sm uppercase tracking-[0.2em] text-yellow-500/75">
                  {matchMode}
                </p>
              )}
              <p className="text-xl font-semibold">
                {tournamentOutcome?.status === "PENDING"
                  ? "Tournament result is still processing."
                  : "Checking tournament result..."}
              </p>
            </div>
          ) : (
            <>
              {tournamentOutcomeError && (
                <p role="alert" className="mt-6 text-red-400">
                  {tournamentOutcomeError}
                </p>
              )}
              <dl className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-red-900 bg-neutral-950 p-4">
                  <dt className="text-sm text-yellow-500/75">Mode</dt>
                  <dd className="mt-1 font-semibold">
                    {matchMode}
                  </dd>
                </div>
                <div className="rounded-xl border border-red-900 bg-neutral-950 p-4">
                  <dt className="text-sm text-yellow-500/75">Duration</dt>
                  <dd className="mt-1 font-semibold">
                    {formatDuration(history.matchStartedAt, history.matchEndedAt)}
                  </dd>
                </div>
                <div className="rounded-xl border border-red-900 bg-neutral-950 p-4">
                  <dt className="text-sm text-yellow-500/75">Hands played</dt>
                  <dd className="mt-1 font-semibold">
                    {history.totalHandsPlayed}
                  </dd>
                </div>
                <div className="rounded-xl border border-red-900 bg-neutral-950 p-4">
                  <dt className="text-sm text-yellow-500/75">Players</dt>
                  <dd className="mt-1 font-semibold">
                    {rankedPlayers.length}
                  </dd>
                </div>
                {tournamentOutcome?.status === "FINAL"
                  && tournamentOutcome.isFinalRound && (
                    <div className="rounded-xl border border-red-900 bg-neutral-950 p-4">
                      <dt className="text-sm text-yellow-500/75">Final round place</dt>
                      <dd className="mt-1 font-semibold">
                        {tournamentOutcome.playerPlace === null
                          || tournamentOutcome.playerPlace === undefined
                          ? "—"
                          : formatPlace(tournamentOutcome.playerPlace)}
                      </dd>
                    </div>
                  )}
              </dl>

              <h2 className="mt-8 text-xl font-semibold">Player results</h2>
              {rankedPlayers.length > 0 ? (
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
                      {rankedPlayers.map(([playerId, place]) => {
                        const stats = history.playerStats?.[playerId];
                        return (
                          <tr
                            key={playerId}
                            className="border-t border-red-950"
                          >
                            <td className="px-4 py-3 font-semibold">
                              {formatPlace(place)}{" "}
                              {history.playerNames[playerId] || "Unknown player"}
                            </td>
                            <td className="px-4 py-3">{stats?.playCount ?? 0}</td>
                            <td className="px-4 py-3">{stats?.winCount ?? 0}</td>
                            <td className="px-4 py-3">{stats?.expEarned ?? 0}</td>
                            <td className="px-4 py-3">{stats?.rankEarned ?? 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-3 text-yellow-500/75">
                  No player results were recorded.
                </p>
              )}
            </>
          )
        ) : (
          <p className="mt-6 text-yellow-500/75">
            No completed match history is available in this browser session.
          </p>
        )}

        {returnError && (
          <p role="alert" className="mt-6 text-red-400">
            {returnError}
          </p>
        )}
        <button
          type="button"
          onClick={handleReturnToLobby}
          disabled={isReturning || isLoadingMatchLobby || isCheckingTournamentOutcome}
          className="mt-8 inline-flex rounded-lg border border-red-700 bg-red-800 px-5 py-3 font-semibold text-yellow-300 transition hover:bg-red-700"
        >
          {returnButtonText}
        </button>
      </section>
    </main>
  );
}
