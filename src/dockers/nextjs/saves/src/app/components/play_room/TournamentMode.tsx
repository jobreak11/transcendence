"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

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
  registrationEndsAt: string;
  maxParticipants: number | null;
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

type TournamentDetail = TournamentSummary & {
  currentLobbyPinId: string | null;
  rounds: {
    id: string;
    roundNumber: number;
    status: "IN_PROGRESS" | "COMPLETED";
    groups: TournamentGroup[];
  }[];
};

const inputStyles =
  "rounded-md border border-[#666] bg-[#2a2a2a] px-3 py-2 text-white outline-none focus:ring-2 focus:ring-red-600";

async function getErrorMessage(response: Response) {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object"
      && body !== null
      && "message" in body
      && typeof body.message === "string"
    ) {
      return body.message;
    }
  } catch {
    return `Request failed (${response.status}).`;
  }
  return `Request failed (${response.status}).`;
}

export default function TournamentMode() {
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<TournamentDetail | null>(null);
  const [name, setName] = useState("");
  const [registrationEndsAt, setRegistrationEndsAt] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadTournaments = useCallback(async () => {
    const response = await fetch("/api/tournament", { cache: "no-store" });
    if (!response.ok) throw new Error(await getErrorMessage(response));
    const result: unknown = await response.json();
    if (!Array.isArray(result)) throw new Error("The server returned an invalid tournament list.");
    setTournaments(result as TournamentSummary[]);
    setSelectedId((current) => current || result[0]?.id || "");
  }, []);

  const loadDetail = useCallback(async (tournamentId: string) => {
    if (!tournamentId) {
      setDetail(null);
      return;
    }
    const response = await fetch(`/api/tournament/${encodeURIComponent(tournamentId)}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error(await getErrorMessage(response));
    setDetail(await response.json() as TournamentDetail);
  }, []);

  useEffect(() => {
    void loadTournaments().catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : "Could not load tournaments.");
    });
  }, [loadTournaments]);

  useEffect(() => {
    if (!selectedId) return;
    void loadDetail(selectedId).catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : "Could not load tournament details.");
    });
  }, [loadDetail, selectedId]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadTournaments().catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Could not refresh tournaments.");
      });
      if (selectedId) {
        void loadDetail(selectedId).catch((loadError: unknown) => {
          setError(loadError instanceof Error ? loadError.message : "Could not refresh tournament details.");
        });
      }
    }, 5_000);
    return () => window.clearInterval(intervalId);
  }, [loadDetail, loadTournaments, selectedId]);

  const submitCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          registrationEndsAt: new Date(registrationEndsAt).toISOString(),
          maxParticipants: maxParticipants ? Number(maxParticipants) : null,
        }),
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      const created = await response.json() as TournamentSummary;
      setSelectedId(created.id);
      setName("");
      setRegistrationEndsAt("");
      setMaxParticipants("");
      setMessage("Tournament created.");
      await loadTournaments();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create tournament.");
    } finally {
      setIsLoading(false);
    }
  };

  const performAction = async (
    path: string,
    method: "POST" | "DELETE",
    successMessage: string,
  ) => {
    if (!selectedId) return;
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/tournament/${encodeURIComponent(selectedId)}${path}`, {
        method,
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      setMessage(successMessage);
      await loadTournaments();
      await loadDetail(selectedId);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Tournament action failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex flex-col">
      <div className="mt-[3vh] flex h-fit w-[90vw] flex-col self-center gap-5 bg-[rgba(42,42,42,0.75)] p-[2%] max-[800px]:w-[94vw] max-[800px]:p-[3%]">
        <form className="flex flex-wrap items-end gap-3 border-b border-[#aaa] pb-5" onSubmit={submitCreate}>
          <label className="flex min-w-[220px] flex-1 flex-col gap-1">
            <span>Tournament name</span>
            <input
              className={inputStyles}
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={100}
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Registration ends</span>
            <input
              className={inputStyles}
              type="datetime-local"
              value={registrationEndsAt}
              onChange={(event) => setRegistrationEndsAt(event.target.value)}
              required
            />
          </label>
          <label className="flex w-40 flex-col gap-1">
            <span>Max players (optional)</span>
            <input
              className={inputStyles}
              type="number"
              min={2}
              max={100000}
              value={maxParticipants}
              onChange={(event) => setMaxParticipants(event.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            Create tournament
          </button>
        </form>

        {tournaments.length === 0 ? (
          <p>No tournaments yet. Create one to get started.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_2fr]">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold text-[#ffd700]">Tournaments</h2>
              {tournaments.map((tournament) => (
                <button
                  type="button"
                  key={tournament.id}
                  onClick={() => setSelectedId(tournament.id)}
                  className={`rounded border p-3 text-left ${selectedId === tournament.id ? "border-red-500 bg-black/40" : "border-white/20"}`}
                >
                  <strong className="block">{tournament.name}</strong>
                  <span className="text-sm text-white/75">
                    {tournament.status} · {tournament.participantCount}
                    {tournament.maxParticipants ? `/${tournament.maxParticipants}` : ""} players
                  </span>
                </button>
              ))}
            </div>

            <div className="min-w-0">
              {detail && detail.id === selectedId ? (
                <TournamentDetails
                  tournament={detail}
                  isLoading={isLoading}
                  onRegister={() => performAction("/register", "POST", "Registered for the tournament.")}
                  onUnregister={() => performAction("/register", "DELETE", "Registration cancelled.")}
                  onClose={() => performAction("/close-registration", "POST", "Registration closed. Tables are being prepared.")}
                />
              ) : (
                <p>Select a tournament to see its details and bracket.</p>
              )}
            </div>
          </div>
        )}
        {message && <p className="text-center text-[#ffe77f]" aria-live="polite">{message}</p>}
        {error && <p className="text-center text-red-300" role="alert">{error}</p>}
      </div>
    </section>
  );
}

function TournamentDetails({
  tournament,
  isLoading,
  onRegister,
  onUnregister,
  onClose,
}: {
  tournament: TournamentDetail;
  isLoading: boolean;
  onRegister: () => void;
  onUnregister: () => void;
  onClose: () => void;
}) {
  const registrationOpen = tournament.status === "OPEN"
    && Date.parse(tournament.registrationEndsAt) > Date.now();
  const isFull = tournament.maxParticipants !== null
    && tournament.participantCount >= tournament.maxParticipants;

  return (
    <article>
      <h2 className="my-2 text-center font-serif text-2xl font-bold text-[#ffd700]">
        {tournament.name}
      </h2>
      <p>Status: {tournament.status}</p>
      <p>Registration ends: {new Date(tournament.registrationEndsAt).toLocaleString()}</p>
      <p>
        Participants: {tournament.participantCount}
        {tournament.maxParticipants ? `/${tournament.maxParticipants}` : ""}
      </p>
      <div className="my-3 flex flex-wrap gap-2">
        {registrationOpen && !isFull && !tournament.isRegistered && (
          <button type="button" onClick={onRegister} disabled={isLoading} className="rounded bg-red-600 px-3 py-2 font-bold disabled:opacity-50">
            Register
          </button>
        )}
        {registrationOpen && tournament.isRegistered && (
          <button type="button" onClick={onUnregister} disabled={isLoading} className="rounded bg-gray-700 px-3 py-2 disabled:opacity-50">
            Unregister
          </button>
        )}
        {registrationOpen && tournament.isHost && (
          <button type="button" onClick={onClose} disabled={isLoading} className="rounded bg-amber-700 px-3 py-2 font-bold disabled:opacity-50">
            Close registration now
          </button>
        )}
        {registrationOpen && isFull && (
          <span className="rounded bg-gray-800 px-3 py-2">Tournament is full</span>
        )}
        {tournament.currentLobbyPinId && (
          <Link
            href={`/game?tableSessionId=${encodeURIComponent(tournament.currentLobbyPinId)}`}
            className="rounded bg-emerald-700 px-3 py-2 font-bold"
          >
            Enter my table
          </Link>
        )}
      </div>

      {tournament.rounds.length > 0 && (
        <div className="mt-4 flex flex-col gap-4">
          <h3 className="text-xl font-bold">Bracket</h3>
          {tournament.rounds.map((round) => (
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
                            {player.place !== null ? ` · place ${player.place}` : ""}
                            {player.qualified ? " · qualified" : ""}
                          </li>
                        ))}
                    </ol>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      {tournament.status === "OPEN" && (
        <p className="mt-3 text-sm text-white/70">
          When registration closes, players will be shuffled into tables. Tables open immediately, with a one-minute countdown before the first hand.
        </p>
      )}
    </article>
  );
}
