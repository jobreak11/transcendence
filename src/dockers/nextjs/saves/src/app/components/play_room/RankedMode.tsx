"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMainSocket } from "../../(protected)/_context/useMainSocket";
import { useLanguage } from "../language/LanguageProvider";

const MATCH_HISTORY_PAGE_SIZE = 1000;
const MATCH_FOUND_EVENT = "ranked:match-found";
const GAME_READY_EVENT = "ranked:game-ready";
const MATCH_FAILED_EVENT = "ranked:match-failed";

type GameStatistics = {
  rankPoint: number;
};

type RankedUserStatistics = {
  user: {
    tagId: string;
    userProfile: {
      displayName: string | null;
    };
  };
};

type RankedMatchResult = {
  playerPlace: number;
  endedAt: string;
};

type RankedMatchPageItem = {
  playerPlace: number;
  gameMatch: {
    gameType: string;
    endedAt: string;
  };
};

function isGameStatistics(value: unknown): value is GameStatistics {
  return typeof value === "object"
    && value !== null
    && "rankPoint" in value
    && typeof value.rankPoint === "number"
    && Number.isSafeInteger(value.rankPoint);
}

function isRankedUserStatisticsPage(
  value: unknown,
): value is RankedUserStatistics[] {
  return Array.isArray(value)
    && value.every((item) =>
      typeof item === "object"
      && item !== null
      && "user" in item
      && typeof item.user === "object"
      && item.user !== null
      && "tagId" in item.user
      && typeof item.user.tagId === "string"
      && "userProfile" in item.user
      && typeof item.user.userProfile === "object"
      && item.user.userProfile !== null
      && "displayName" in item.user.userProfile
      && (typeof item.user.userProfile.displayName === "string"
        || item.user.userProfile.displayName === null),
    );
}

function isRankIndex(value: unknown): value is { rankIndex: number } {
  return typeof value === "object"
    && value !== null
    && "rankIndex" in value
    && typeof value.rankIndex === "number"
    && Number.isSafeInteger(value.rankIndex)
    && value.rankIndex >= 0;
}

function isRankedMatchPage(value: unknown): value is RankedMatchPageItem[] {
  return Array.isArray(value)
    && value.every((match) =>
      typeof match === "object"
      && match !== null
      && "playerPlace" in match
      && typeof match.playerPlace === "number"
      && Number.isSafeInteger(match.playerPlace)
      && match.playerPlace > 0
      && "gameMatch" in match
      && typeof match.gameMatch === "object"
      && match.gameMatch !== null
      && "gameType" in match.gameMatch
      && typeof match.gameMatch.gameType === "string"
      && "endedAt" in match.gameMatch
      && typeof match.gameMatch.endedAt === "string"
      && Number.isFinite(Date.parse(match.gameMatch.endedAt)),
    );
}

async function fetchRankPoint(): Promise<number | null> {
  const response = await fetch("/api/game/statistics/find", {
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Could not load ranked points (${response.status}).`);
  }

  const payload: unknown = await response.json();
  if (!isGameStatistics(payload)) {
    throw new Error("The server returned invalid ranked statistics.");
  }
  return Math.max(0, payload.rankPoint);
}

async function fetchRankIndex(): Promise<number> {
  const response = await fetch("/api/game/statistics/findRankIndex", {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Could not load ranked position (${response.status}).`);
  }

  const payload: unknown = await response.json();
  if (!isRankIndex(payload)) {
    throw new Error("The server returned an invalid ranked position.");
  }
  return payload.rankIndex;
}

async function fetchTopRankings(): Promise<string[]> {
  const response = await fetch("/api/game/statistics?limit=10&offset=0", {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Could not load top rankings (${response.status}).`);
  }

  const payload: unknown = await response.json();
  if (!isRankedUserStatisticsPage(payload)) {
    throw new Error("The server returned invalid top rankings.");
  }
  return payload.slice(0, 10).map(({ user }) =>
    user.userProfile.displayName?.trim() || user.tagId,
  );
}

async function fetchRankedStreaks(): Promise<{
  winstreak: number;
  highestStreak: number;
}> {
  const matches: RankedMatchResult[] = [];
  let offset = 0;

  while (true) {
    const response = await fetch(
      `/api/game/matches?limit=${MATCH_HISTORY_PAGE_SIZE}&offset=${offset}`,
      { cache: "no-store" },
    );
    if (!response.ok) {
      throw new Error(`Could not load ranked match history (${response.status}).`);
    }

    const payload: unknown = await response.json();
    if (!isRankedMatchPage(payload)) {
      throw new Error("The server returned invalid match history.");
    }

    matches.push(
      ...payload
        .filter((match) => match.gameMatch.gameType === "RANKED")
        .map((match) => ({
          playerPlace: match.playerPlace,
          endedAt: match.gameMatch.endedAt,
        })),
    );

    if (payload.length < MATCH_HISTORY_PAGE_SIZE) break;
    offset += payload.length;
  }

  matches.sort((matchA, matchB) =>
    Date.parse(matchA.endedAt) - Date.parse(matchB.endedAt),
  );

  let currentRun = 0;
  let highestStreak = 0;
  for (const match of matches) {
    currentRun = match.playerPlace <= 2 ? currentRun + 1 : 0;
    highestStreak = Math.max(highestStreak, currentRun);
  }

  let winstreak = 0;
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const match = matches[index];
    if (!match || match.playerPlace > 2) break;
    winstreak += 1;
  }

  return { winstreak, highestStreak };
}

function isMatchFoundEvent(
  value: unknown,
): value is { matchId: string; playerCount: number } {
  return typeof value === "object"
    && value !== null
    && "matchId" in value
    && typeof value.matchId === "string"
    && "playerCount" in value
    && value.playerCount === 4;
}

function isRankedGameReadyEvent(
  value: unknown,
): value is { matchId: string; lobbyPinId: string; tableSessionId: string } {
  return typeof value === "object"
    && value !== null
    && "matchId" in value
    && typeof value.matchId === "string"
    && "lobbyPinId" in value
    && typeof value.lobbyPinId === "string"
    && "tableSessionId" in value
    && typeof value.tableSessionId === "string";
}

export default function RankedMode() {

  const { dictionary } = useLanguage();

  const router = useRouter();
  const { socket, isConnected, connectionError } = useMainSocket();
  const [message, setMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [rankPoint, setRankPoint] = useState<number | null>(null);
  const [winstreak, setWinstreak] = useState<number | null>(null);
  const [highestStreak, setHighestStreak] = useState<number | null>(null);
  const [statisticsError, setStatisticsError] = useState("");
  const [rankPosition, setRankPosition] = useState<number | null | "unrank">(null);
  const [topRankings, setTopRankings] = useState<string[]>([]);
  const [topRankingError, setTopRankingError] = useState("");

  useEffect(() => {
    let active = true;

    const loadRankedData = async () => {
      let hasStatistics = false;
      try {
        const points = await fetchRankPoint();
        if (!active) return;
        setRankPoint(points);

        if (points === null) {
          setWinstreak(0);
          setHighestStreak(0);
          setRankPosition("unrank");
        } else {
          hasStatistics = true;
          const streaks = await fetchRankedStreaks();
          if (!active) return;
          setWinstreak(streaks.winstreak);
          setHighestStreak(streaks.highestStreak);
        }
      } catch (error: unknown) {
        if (!active) return;
        setStatisticsError(
          error instanceof Error
            ? error.message
            : "Could not load ranked statistics.",
        );
      }

      if (hasStatistics) {
        try {
          const index = await fetchRankIndex();
          if (!active) return;
          setRankPosition(index);
        } catch (error: unknown) {
          if (!active) return;
          setStatisticsError(
            error instanceof Error
              ? error.message
              : "Could not load ranked position.",
          );
        }
      }

      try {
        const leaders = await fetchTopRankings();
        if (!active) return;
        setTopRankings(leaders);
      } catch (error: unknown) {
        if (!active) return;
        setTopRankingError(
          error instanceof Error
            ? error.message
            : "Could not load top rankings.",
        );
      }
    };

    void loadRankedData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onMatchFound = (event: unknown) => {
      if (!isMatchFoundEvent(event)) return;
      setIsSearching(false);
      setMessage("");
      setMatchId(event.matchId);
      setHasAccepted(false);
      setIsAccepting(false);
    };

    const onGameReady = (event: unknown) => {
      if (!isRankedGameReadyEvent(event) || event.matchId !== matchId) return;
      router.push(`/game?tableSessionId=${encodeURIComponent(event.tableSessionId)}`);
    };
    const onMatchFailed = (event: unknown) => {
      if (
        typeof event !== "object"
        || event === null
        || !("matchId" in event)
        || event.matchId !== matchId
      ) return;
      setMatchId(null);
      setHasAccepted(false);
      setIsAccepting(false);
      setMessage("Could not start the ranked game. Please search again.");
    };

    socket.on(MATCH_FOUND_EVENT, onMatchFound);
    socket.on(GAME_READY_EVENT, onGameReady);
    socket.on(MATCH_FAILED_EVENT, onMatchFailed);
    return () => {
      socket.off(MATCH_FOUND_EVENT, onMatchFound);
      socket.off(GAME_READY_EVENT, onGameReady);
      socket.off(MATCH_FAILED_EVENT, onMatchFailed);
    };
  }, [matchId, router, socket]);

  useEffect(() => {
    if (!isConnected && isSearching) {
      setIsSearching(false);
      setMessage("Connection lost. Please search again when reconnected.");
    }
  }, [isConnected, isSearching]);

  function findMatch() {
    if (!socket || !isConnected || isSearching) return;

    setIsSearching(true);
    setMessage("Searching for 4 players…");
    socket.timeout(10_000).emit(
      "ranked:join",
      {},
      (timeoutError: Error | null, response: unknown) => {
        if (timeoutError) {
          setIsSearching(false);
          setMessage("The matchmaking service did not respond. Please try again.");
          return;
        }

        if (typeof response !== "object" || response === null || !("status" in response)) {
          setIsSearching(false);
          setMessage("The matchmaking service returned an invalid response.");
          return;
        }

        if (response.status === "waiting") {
          setMessage("Searching for 4 players…");
        } else if (response.status === "matched") {
          setMessage("");
        } else {
          setIsSearching(false);
          setMessage("Could not join ranked matchmaking.");
        }
      },
    );
  }

  function cancelSearch() {
    if (!socket || !isSearching) return;

    socket.timeout(10_000).emit(
      "ranked:cancel",
      {},
      (timeoutError: Error | null, response: unknown) => {
        if (timeoutError) {
          setMessage("Could not cancel the search. Please try again.");
          return;
        }

        setIsSearching(false);
        setMessage(
          typeof response === "object"
          && response !== null
          && "status" in response
          && response.status === "cancelled"
            ? "Search cancelled."
            : "You are no longer waiting for a match.",
        );
      },
    );
  }

  function acceptMatch() {
    if (!socket || !matchId || isAccepting || hasAccepted) return;

    setIsAccepting(true);
    socket.timeout(10_000).emit(
      "ranked:accept",
      { matchId },
      (timeoutError: Error | null, response: unknown) => {
        setIsAccepting(false);
        if (timeoutError) {
          setMessage("Could not confirm the match. Please try again.");
          return;
        }

        if (
          typeof response !== "object"
          || response === null
          || !("status" in response)
        ) {
          setMessage("The matchmaking service returned an invalid response.");
          return;
        }
        if (
          response.status === "accepted"
          || response.status === "launching"
          || response.status === "ready"
        ) {
          setHasAccepted(true);
        } else if (response.status === "failed") {
          setMatchId(null);
          setMessage("Could not start the ranked game. Please search again.");
        } else {
          setMessage("The matchmaking service returned an invalid acceptance status.");
        }
      },
    );
  }

  return (
    <section className="flex flex-col">
      <div className="mt-[3vh] flex h-fit w-[90vw] flex-col self-center bg-[rgba(42,42,42,0.75)] p-[1%] max-[800px]:w-[94vw] max-[800px]:p-[3%]">
        <div className="flex w-full flex-col p-[1%]">
          <h1 className="my-2 text-center font-serif text-[clamp(14px,calc(6px+2vw),28px)] font-bold text-[#ffd700]">
            {
              dictionary.lobby
                .rankMode
            }
          </h1>

          <table className="mx-auto w-[min(50%,680px)] border-spacing-x-4 border-spacing-y-2.5 max-[800px]:w-full">
            <tbody>
              <tr>
                <td>
                  {
                    dictionary.lobby
                      .point
                  }
                  : {rankPoint ?? "—"}
                </td>

                <td className="text-right">
                  {
                    dictionary.lobby
                      .position
                  }
                  : {rankPosition === "unrank"
                    ? "Unrank"
                    : rankPosition === null
                      ? "—"
                      : `#${rankPosition + 1}`}
                </td>
              </tr>

              <tr>
                <td>
                  {
                    dictionary.lobby
                      .winstreak
                  }
                  : {winstreak ?? "—"}
                </td>

                <td className="text-right">
                  {
                    dictionary.lobby
                      .highestStreak
                  }
                  : {highestStreak ?? "—"}
                </td>
              </tr>
            </tbody>
          </table>
          {statisticsError && (
            <p className="mt-2 text-center text-sm text-red-300" role="alert">
              {statisticsError}
            </p>
          )}

          <div className="text-center">
            <button
              type="button"
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border-0 bg-red-600 px-2.5 py-2 text-[clamp(18px,calc(16px+2vw),24px)] font-bold text-white hover:bg-red-700 focus-visible:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!isConnected || isSearching}
              onClick={findMatch}
            >
              {isSearching
                ? dictionary.lobby
                    .searchingRankedMatch
                : dictionary.lobby
                    .findMatch}
            </button>
            {isSearching && (
              <button
                type="button"
                className="ml-3 inline-flex cursor-pointer items-center justify-center rounded-lg border border-white px-2.5 py-2 font-bold text-white hover:bg-white/10"
                onClick={cancelSearch}
              >
                Cancel
              </button>
            )}
          </div>
          <p className="mt-2 min-h-[1.4em] text-center text-[0.65em] text-[#ffe77f]" aria-live="polite" role={connectionError ? "alert" : "status"}>
            {connectionError ?? (!isConnected ? "Connecting to matchmaking…" : message)}
          </p>

          <hr />

          <h2 className="my-2 text-center font-serif text-[clamp(14px,calc(6px+2vw),28px)] font-bold text-[#ffd700]">
            {
              dictionary.lobby
                .topRanking
            }
          </h2>

          <ol className="mx-auto mt-[1%] list-none p-0 text-center">
            {topRankings.map(
              (name, index) => (
                <li
                  key={`${name}-${index}`}
                >
                  #{index + 1}:{" "}
                  {name}
                </li>
              ),
            )}
          </ol>
          {topRankingError && (
            <p className="mt-2 text-center text-sm text-red-300" role="alert">
              {topRankingError}
            </p>
          )}
        </div>
      </div>
      {matchId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ranked-match-found-title"
        >
          <div className="w-full max-w-sm rounded-xl border border-[#ffd700] bg-[#2a2a2a] p-6 text-center text-white shadow-xl">
            <h2
              id="ranked-match-found-title"
              className="mb-3 text-2xl font-bold text-[#ffd700]"
            >
              Match Found!
            </h2>
            <p className="mb-5">
              {hasAccepted
                ? "Waiting for all players to accept…"
                : "Accept to confirm your ranked match. The game starts when all four players accept."}
            </p>
            <button
              type="button"
              className="rounded-lg bg-red-600 px-6 py-2 font-bold hover:bg-red-700 focus-visible:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isAccepting || hasAccepted}
              onClick={acceptMatch}
            >
              {isAccepting ? "Accepting…" : hasAccepted ? "Accepted" : "Accept"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
