"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { SyntheticEvent } from "react";
import { getErrorMessage } from "./tournament-utils";

type TournamentStatus =
  | "OPEN"
  | "SEEDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type TournamentSummary = {
  id: string;
  name: string;
  hostUserId: string;
  hostUsername: string;
  registrationEndsAt: string;
  maxParticipants: number | null;
  requirements: string[];
  prizePools: string[];
  participantCount: number;
  status: TournamentStatus;
  isHost: boolean;
  isRegistered: boolean;
};

type TournamentGroup = {
  id: string;
  groupNumber: number;
  lobbyPinId: string;
  startAt: string;
  status: "IN_PROGRESS" | "COMPLETED";
  players: {
    userId: string;
    username: string;
    place: number | null;
    qualified: boolean;
  }[];
};

type TournamentDetail = Omit<TournamentSummary, "hostUsername"> & {
  currentLobbyPinId: string | null;
  rounds: {
    id: string;
    roundNumber: number;
    status: "IN_PROGRESS" | "COMPLETED";
    groups: TournamentGroup[];
  }[];
};

export default function TournamentMode() {
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [error, setError] = useState("");

  const loadTournaments = useCallback(async () => {
    const response = await fetch("/api/tournament", { cache: "no-store" });
    if (!response.ok) throw new Error(await getErrorMessage(response));
    const result: unknown = await response.json();
    if (!Array.isArray(result)) throw new Error("The server returned an invalid tournament list.");
    setError("");
    setTournaments(result as TournamentSummary[]);
  }, []);

  useEffect(() => {
    void loadTournaments().catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : "Could not load tournaments.");
    });
  }, [loadTournaments]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadTournaments().catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Could not refresh tournaments.");
      });
    }, 5_000);
    return () => window.clearInterval(intervalId);
  }, [loadTournaments]);

  return (
    <section className="flex flex-col">
      <div className="mt-[3vh] flex h-fit w-[90vw] flex-col self-center gap-5 bg-[rgba(42,42,42,0.75)] p-[2%] max-[800px]:w-[94vw] max-[800px]:p-[3%]">
        {tournaments.length === 0 ? (
          <p>No tournaments yet.</p>
        ) : (
          tournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              onUpdated={loadTournaments}
            />
          ))
        )}
        {error && <p className="text-center text-red-300" role="alert">{error}</p>}
      </div>
    </section>
  );
}

function TournamentCard({
  tournament,
  onUpdated,
}: {
  tournament: TournamentSummary;
  onUpdated: () => Promise<void>;
}) {
  const [detail, setDetail] = useState<TournamentDetail | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const registrationHasEnded = tournament.status !== "OPEN"
    || Date.parse(tournament.registrationEndsAt) <= Date.now();

  const loadDetail = useCallback(async () => {
    const response = await fetch(`/api/tournament/${encodeURIComponent(tournament.id)}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error(await getErrorMessage(response));
    setDetail(await response.json() as TournamentDetail);
  }, [tournament.id]);

  useEffect(() => {
    if (
      !registrationHasEnded
      || (!tournament.isRegistered && !tournament.isHost)
    ) return;

    setIsDetailsOpen(true);
    setIsLoadingDetail(true);
    setError("");
    void loadDetail()
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load tournament details.");
      })
      .finally(() => setIsLoadingDetail(false));
  }, [loadDetail, registrationHasEnded, tournament.isHost, tournament.isRegistered]);

  const handleDetailsToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    const isOpen = event.currentTarget.open;
    setIsDetailsOpen(isOpen);
    if (!isOpen || detail || isLoadingDetail) return;
    setIsLoadingDetail(true);
    setError("");
    void loadDetail()
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load tournament details.");
      })
      .finally(() => setIsLoadingDetail(false));
  };

  const performAction = async (
    path: string,
    method: "POST" | "DELETE",
    successMessage: string,
  ) => {
    setIsLoadingAction(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/tournament/${encodeURIComponent(tournament.id)}${path}`, {
        method,
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      setMessage(successMessage);
      await onUpdated();
      if (detail) await loadDetail();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Tournament action failed.");
    } finally {
      setIsLoadingAction(false);
    }
  };

  const registrationOpen = tournament.status === "OPEN"
    && Date.parse(tournament.registrationEndsAt) > Date.now();
  const isFull = tournament.maxParticipants !== null
    && tournament.participantCount >= tournament.maxParticipants;
  const registered = tournament.maxParticipants === null
    ? String(tournament.participantCount)
    : `${tournament.participantCount}/${tournament.maxParticipants}`;
  const competeAt = detail?.rounds
    .flatMap((round) => round.groups.map((group) => group.startAt))
    .sort((left, right) => Date.parse(left) - Date.parse(right))[0];
  const competeDate = competeAt
    ? new Date(competeAt).toLocaleString()
    : detail
      ? "Not scheduled"
      : "Open Details to check schedule";

  return (
    <article className="border-b border-[#aaa] px-[1%] pt-[1%] pb-[2%]">
      <h2 className="my-2 text-center font-serif text-[clamp(14px,calc(6px+2vw),28px)] font-bold text-[#ffd700]">
        {tournament.name}
      </h2>
      <div className="mx-auto w-fit max-w-full leading-normal">
        <div>Status: {tournament.status}</div>
        <div>Registry Date end at: {new Date(tournament.registrationEndsAt).toLocaleString()}</div>
        <div className="flex items-center gap-6 pt-[2%] text-[clamp(11px,calc(6px+2vw),20px)] whitespace-nowrap max-[800px]:flex-wrap max-[800px]:whitespace-normal">
          <span>Host: {tournament.hostUsername}</span>
          <span>Registered: {registered}</span>
          {registrationOpen && !isFull && !tournament.isRegistered && (
            <button
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border-0 bg-red-600 px-2.5 py-2 text-[clamp(14px,calc(6px+2vw),20px)] font-bold text-white hover:bg-red-700 focus-visible:bg-red-700 disabled:opacity-50"
              type="button"
              onClick={() => performAction("/register", "POST", "Registered for the tournament.")}
              disabled={isLoadingAction}
            >
              Register
            </button>
          )}
          {registrationOpen && tournament.isRegistered && (
            <button
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border-0 bg-gray-700 px-2.5 py-2 font-bold text-white disabled:opacity-50"
              type="button"
              onClick={() => performAction("/register", "DELETE", "Registration cancelled.")}
              disabled={isLoadingAction}
            >
              Unregister
            </button>
          )}
          {registrationOpen && tournament.isHost && (
            <button
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border-0 bg-amber-700 px-2.5 py-2 font-bold text-white disabled:opacity-50"
              type="button"
              onClick={() => performAction("/close-registration", "POST", "Registration closed. Tables are being prepared.")}
              disabled={isLoadingAction}
            >
              Close registration
            </button>
          )}
          {registrationOpen && isFull && (
            <span className="rounded bg-gray-800 px-3 py-2">Tournament is full</span>
          )}
        </div>
      </div>
      <details
        open={isDetailsOpen}
        className="text-[clamp(11px,calc(6px+2vw),18px)]"
        onToggle={handleDetailsToggle}
      >
        <summary className="cursor-pointer text-right">Details</summary>
        <div className="mx-auto w-[90%] bg-[rgba(15,15,15,0.7)] p-6 text-justify leading-normal max-[800px]:w-full max-[800px]:p-4">
          <DetailList
            title="Requirements"
            items={tournament.requirements.length ? tournament.requirements : ["-"]}
          />
          <DetailList
            title="Prize Pools"
            items={tournament.prizePools.length ? tournament.prizePools : ["-"]}
          />
          {isLoadingDetail && <p>Loading tournament details...</p>}
          {detail?.currentLobbyPinId && (
            <Link
              href={`/game?tableSessionId=${encodeURIComponent(detail.currentLobbyPinId)}`}
              className="my-3 inline-flex rounded bg-emerald-700 px-3 py-2 font-bold"
            >
              Enter my table
            </Link>
          )}
          {detail && <TournamentRounds rounds={detail.rounds} />}
          {isDetailsOpen && message && <p className="text-[#ffe77f]" aria-live="polite">{message}</p>}
          {isDetailsOpen && error && <p className="text-red-300" role="alert">{error}</p>}
        </div>
      </details>
      {!isDetailsOpen && message && <p className="text-center text-[#ffe77f]" aria-live="polite">{message}</p>}
      {!isDetailsOpen && error && <p className="text-center text-red-300" role="alert">{error}</p>}
    </article>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mb-4">
      <h3 className="font-bold">{title}</h3>
      <ul className="list-disc pl-6">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function TournamentRounds({ rounds }: { rounds: TournamentDetail["rounds"] }) {
  if (rounds.length === 0) {
    return <p className="mt-3 text-white/70">No rounds scheduled yet.</p>;
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      <h3 className="text-xl font-bold">Bracket</h3>
      {rounds.map((round) => {
        const isFinalRound = round.groups.length === 1;
        return (
          <section key={round.id} className="rounded border border-white/20 p-3">
            <h4 className="font-bold">Round {round.roundNumber} · {round.status}</h4>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {round.groups.map((group) => (
                <div key={group.id} className="rounded bg-black/30 p-3">
                  <h5 className="font-semibold">
                    Table {group.groupNumber} · {group.status}
                  </h5>
                  <p className="text-sm text-white/70">
                    Starts {new Date(group.startAt).toLocaleString()}
                  </p>
                  <ol className="mt-2 list-inside list-decimal">
                    {group.players
                      .slice()
                      .sort((left, right) => (left.place ?? 99) - (right.place ?? 99))
                      .map((player) => (
                        <li key={player.userId}>
                          {player.username}
                          {isFinalRound && player.place !== null && (
                            <span> · place {player.place}</span>
                          )}
                          {!isFinalRound && group.status === "COMPLETED" && (
                            <span>
                              {player.qualified ? " · qualified" : " · disqualified"}
                            </span>
                          )}
                        </li>
                      ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
