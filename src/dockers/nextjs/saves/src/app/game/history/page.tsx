"use client";

import { useEffect, useState } from "react";

interface MatchHistory {
  tableSessionId: string;
  totalHandsPlayed: number;
  matchStartedAt: string;
  matchEndedAt: string;
  playerPlaces: Record<string, number>;
  playerStats?: Record<string, {
    playCount: number;
    winCount: number;
    expEarned: number;
  }>;
  playerNames: Record<string, string>;
}

interface MatchLobby {
  details: {
    roomPinId: string;
    gameRoomId: string | null;
  };
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
        || lobby.details.gameRoomId === null),
    );
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

function formatDateTime(dateTime: string) {
  return new Date(dateTime).toLocaleString();
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

export default function MatchHistoryPage() {
  const [history, setHistory] = useState<MatchHistory | null>(null);
  const [isReturning, setIsReturning] = useState(false);
  const [returnError, setReturnError] = useState("");

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

  const rankedPlayers = Object.entries(history?.playerPlaces ?? {})
    .sort(([, placeA], [, placeB]) => placeA - placeB);

  async function handleReturnToLobby() {
    if (!history) {
      window.location.assign("/lobby");
      return;
    }

    setIsReturning(true);
    setReturnError("");
    try {
      const lobbyResponse = await fetch("/api/game/lobby/my-lobby", {
        cache: "no-store",
      });
      if (lobbyResponse.status === 404) {
        window.location.assign("/lobby");
        return;
      }

      const lobbyBody: unknown = await lobbyResponse.json().catch(() => null);
      if (!lobbyResponse.ok) {
        const message = typeof lobbyBody === "object"
            && lobbyBody !== null
            && "message" in lobbyBody
            && typeof lobbyBody.message === "string"
          ? lobbyBody.message
          : `Could not find the match lobby (${lobbyResponse.status}).`;
        throw new Error(message);
      }
      if (!isMatchLobbyList(lobbyBody)) {
        throw new Error("The server returned an invalid list of joined lobbies.");
      }

      const matchLobby = lobbyBody.find(
        (lobby) => lobby.details.gameRoomId === history.tableSessionId,
      );
      if (!matchLobby) {
        throw new Error("Could not find the lobby for this match.");
      }

      window.location.assign(
        `/lobby/room?lobbyPinId=${encodeURIComponent(matchLobby.details.roomPinId)}&returnFromMatch=1`,
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
          Match complete
        </p>
        <h1 className="mt-2 text-3xl font-bold">Match history</h1>

        {history ? (
          <>
            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border-4 border-neatral-900 bg-neutral-950 p-4">
                <dt className="text-sm text-yellow-500/75">Hands played</dt>
                <dd className="mt-1 text-2xl font-semibold">
                  {history.totalHandsPlayed}
                </dd>
              </div>
              <div className="rounded-xl border-4 border-neatral-900 bg-neutral-950 p-4">
                <dt className="text-sm text-yellow-500/75">Started at</dt>
                <dd className="mt-1 font-semibold">
                  {formatDateTime(history.matchStartedAt)} 
                </dd>
              </div>
              <div className="rounded-xl border-4 border-neatral-900 bg-neutral-950 p-4">
                <dt className="text-sm text-yellow-500/75">Ended at</dt>
                <dd className="mt-1 font-semibold">
                  {formatDateTime(history.matchEndedAt)}
                </dd>
              </div>
              <div className="rounded-xl border-4 border-neatral-900 bg-neutral-950 p-4">
                <dt className="text-sm text-yellow-500/75">Total time</dt>
                <dd className="mt-1 text-2xl font-semibold">
                  {formatDuration(history.matchStartedAt, history.matchEndedAt)}
                </dd>
              </div>
            </dl>

            <h2 className="mt-8 text-xl font-semibold">Player places</h2>
            {rankedPlayers.length > 0 ? (
              <ol className="mt-3 divide-y divide-red-950 rounded-xl border border-red-900">
                {rankedPlayers.map(([playerId, place]) => (
                  <li
                    key={playerId}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <span className="font-medium">
                      {history.playerNames[playerId] || "Unknown player"}
                    </span>
                    <span className="rounded-full bg-red-950 px-3 py-1 font-semibold text-yellow-300">
                      {formatPlace(place)}
                    </span>
                    <span className="font-semibold text-yellow-400">
                      +{history.playerStats?.[playerId]?.expEarned ?? 0} XP
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-yellow-500/75">No player places were recorded.</p>
            )}
          </>
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
          disabled={isReturning}
          className="mt-8 inline-flex rounded-lg border border-red-700 bg-red-800 px-5 py-3 font-semibold text-yellow-300 transition hover:bg-red-700"
        >
          {isReturning ? "Returning…" : "Back to lobby"}
        </button>
      </section>
    </main>
  );
}
