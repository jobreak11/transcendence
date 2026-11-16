"use client";

import { useEffect, useState } from "react";
import { rankings } from "../../../lib/mock-data";
import { useMainSocket } from "../../(protected)/_context/useMainSocket";

const MATCH_FOUND_EVENT = "ranked:match-found";

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

export default function RankedMode() {
  const { socket, isConnected, connectionError } = useMainSocket();
  const [message, setMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onMatchFound = (event: unknown) => {
      if (!isMatchFoundEvent(event)) return;
      setIsSearching(false);
      setMessage("");
      setMatchId(event.matchId);
    };

    socket.on(MATCH_FOUND_EVENT, onMatchFound);
    return () => {
      socket.off(MATCH_FOUND_EVENT, onMatchFound);
    };
  }, [socket]);

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

  return (
    <section className="flex flex-col">
      <div className="mt-[3vh] flex h-fit w-[90vw] flex-col self-center bg-[rgba(42,42,42,0.75)] p-[1%] max-[800px]:w-[94vw] max-[800px]:p-[3%]">
      {/* <div className="mt-[3vh] flex h-fit w-[90vw] flex-col self-center bg-[#2a2a2a] p-[1%] max-[800px]:w-[94vw] max-[800px]:p-[3%]"> */}
        <div className="flex w-full flex-col p-[1%]">
          <h1 className="my-2 text-center font-serif text-[clamp(14px,calc(6px+2vw),28px)] font-bold text-[#ffd700]">
            Ranked Mode
          </h1>
          <table className="mx-auto w-[min(50%,680px)] border-spacing-x-4 border-spacing-y-2.5 max-[800px]:w-full">
            <tbody>
              <tr>
                <td>Points: 1000</td>
                <td className="text-right">Position: 80%</td>
              </tr>
              <tr>
                <td>Winstreaks: 0</td>
                <td className="text-right">Highest Streak: 0</td>
              </tr>
            </tbody>
          </table>
          <div className="text-center">
            <button
              type="button"
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border-0 bg-red-600 px-2.5 py-2 text-[clamp(18px,calc(16px+2vw),24px)] font-bold text-white hover:bg-red-700 focus-visible:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!isConnected || isSearching}
              onClick={findMatch}
            >
              Find Match
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
            Top Rankings
          </h2>
          <ol className="mx-auto mt-[1%] list-none p-0 text-center">
            {rankings.map((name, index) => (
              <li key={`${name}-${index}`}>
                #{index + 1}: {name}
              </li>
            ))}
          </ol>
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
            <p className="mb-5">Four players are ready for a ranked match.</p>
            <button
              type="button"
              className="rounded-lg bg-red-600 px-6 py-2 font-bold hover:bg-red-700 focus-visible:bg-red-700"
              onClick={() => {
                setMatchId(null);
                setMessage("Match accepted. Game launch is not connected yet.");
              }}
            >
              Accept
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
