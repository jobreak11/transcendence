"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { signOut } from "../../lib/auth";

type RoomTab = "Casual" | "Ranked" | "Tournament" | "Custom";
type CustomTab = "casual" | "tournament";
type Dialog = "registeredPlayers" | null;

const roomTabs: RoomTab[] = ["Casual", "Ranked", "Tournament", "Custom"];
const rankings = [
  "Test-9",
  "Test-2",
  "Test-5",
  "Test-4",
  "Test-8",
  "Test-3",
  "Test-7",
  "USERNAME",
  "Test-6",
  "Test-1",
];

const inputClass =
  "min-w-0 rounded border border-white/20 bg-black/50 px-3 py-2 text-white outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 disabled:cursor-not-allowed disabled:opacity-50";
const buttonClass =
  "rounded bg-red-700 px-4 py-2 font-semibold text-white transition hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:cursor-not-allowed disabled:opacity-50";

function GoldHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="bg-linear-to-b from-amber-100 via-amber-400 to-yellow-700 bg-clip-text text-center text-xl font-bold text-transparent sm:text-2xl">
      {children}
    </h2>
  );
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-lg border border-white/10 bg-neutral-950/75 p-4 shadow-xl sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

function RangeControl({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2 sm:grid-cols-[10rem_1fr_3rem] sm:items-center">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-amber-400"
      />
      <output className="text-right tabular-nums">{value}</output>
    </label>
  );
}

export default function LobbyPage() {
  const [activeTab, setActiveTab] = useState<RoomTab>("Casual");
  const [customTab, setCustomTab] = useState<CustomTab>("casual");
  const [roomId, setRoomId] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [joinError, setJoinError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [customChips, setCustomChips] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [maxSpectators, setMaxSpectators] = useState(5);
  const [startingChips, setStartingChips] = useState(1000);
  const [maxCycles, setMaxCycles] = useState(10);
  const [notice, setNotice] = useState("");

  const joinRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const lobbyPinId = roomId.trim();
    if (!/^\d{6}$/.test(lobbyPinId)) {
      setJoinError("Enter a valid six-digit room ID.");
      return;
    }

    setJoinError("");
    setIsJoining(true);
    try {
      const response = await fetch("/api/game/lobby/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobbyPinId, password: joinPassword }),
      });
      if (!response.ok) {
        const body: unknown = await response.json();
        const message =
          typeof body === "object" &&
          body !== null &&
          "message" in body &&
          typeof body.message === "string"
            ? body.message
            : `Could not join this room (${response.status}).`;
        throw new Error(message);
      }

      window.location.assign(
        `/game?tableSessionId=${encodeURIComponent(lobbyPinId)}`,
      );
    } catch (error) {
      setJoinError(
        error instanceof Error ? error.message : "Could not join this room.",
      );
    } finally {
      setIsJoining(false);
    }
  };

  const showNotice = (message: string) => {
    setNotice(message);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#14532d_0%,_#111827_48%,_#030712_100%)] text-white">
      <header className="border-b border-amber-300/20 bg-black/70 shadow-lg">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center gap-4 px-4 sm:px-8">
          <h1 className="bg-linear-to-b from-amber-100 via-amber-400 to-yellow-700 bg-clip-text text-2xl font-bold text-transparent sm:text-4xl">
            Play Room
          </h1>
          <div className="ml-auto bg-linear-to-b from-amber-100 via-amber-400 to-yellow-700 bg-clip-text text-right font-semibold text-transparent sm:text-xl">
            USERNAME
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/10 hover:text-white"
            >
              Logout
            </button>
          </form>
        </div>
        <nav
          aria-label="Room categories"
          className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-8"
        >
          {roomTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              aria-current={activeTab === tab ? "page" : undefined}
              onClick={() => {
                setActiveTab(tab);
                setNotice("");
              }}
              className={`min-w-24 border-b-2 px-4 py-3 text-sm font-semibold transition sm:min-w-32 sm:text-base ${
                activeTab === tab
                  ? "border-amber-400 bg-white/10 text-amber-200"
                  : "border-transparent text-neutral-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-8 sm:py-10">
        {notice && (
          <p role="status" className="rounded border border-amber-300/30 bg-amber-950/50 p-3 text-amber-100">
            {notice}
          </p>
        )}

        {activeTab === "Casual" && (
          <section aria-label="Casual rooms" className="space-y-0">
            <div className="grid gap-3 rounded-t-lg bg-neutral-900/90 p-4 sm:grid-cols-[1fr_5fr] sm:items-center">
              <h2 className="font-semibold">Rooms</h2>
              <form onSubmit={joinRoom} className="flex flex-wrap items-center gap-3">
                <label htmlFor="room-id">Search by ID:</label>
                <input
                  id="room-id"
                  inputMode="numeric"
                  maxLength={6}
                  value={roomId}
                  onChange={(event) => setRoomId(event.target.value.replace(/\D/g, ""))}
                  className={`${inputClass} w-36`}
                  placeholder="6-digit ID"
                />
                
                
                <button type="submit" className={buttonClass} disabled={isJoining}>
                  {isJoining ? "Joining..." : "Join"}
                </button>
                {joinError && (
                  <p role="alert" className="basis-full text-sm text-red-300">
                    {joinError}
                  </p>
                )}
              </form>
            </div>

            <Panel className="space-y-4 rounded-t-none">
              {[
                { host: "Test-1", isPrivate: false, players: "1/8", spectators: "0/10" },
                { host: "Test-2", isPrivate: true, players: "1/8", spectators: "0/10" },
              ].map((room, index) => (
                <div key={room.host}>
                  {index > 0 && <hr className="mb-4 border-white/10" />}
                  <article className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-amber-300/30 bg-neutral-800 text-2xl text-amber-200">
                      {room.host.slice(-1)}
                    </div>
                    <div className="grid flex-1 gap-3 sm:grid-cols-2 sm:items-center">
                      <div>
                        <p className="font-semibold">Host: {room.host}</p>
                        <p className="text-sm text-neutral-300">
                          Catchphrase: เร่เข้ามา
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm sm:justify-end">
                        <span>Private: {room.isPrivate ? "Yes" : "No"}</span>
                        <span>Players: {room.players}</span>
                        <span>Spectators: {room.spectators}</span>
                        <button
                          type="button"
                          className={`${buttonClass} px-3 py-1`}
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              ))}
            </Panel>
          </section>
        )}

        {activeTab === "Ranked" && (
          <Panel className="space-y-5">
            <GoldHeading>Ranked Mode</GoldHeading>
            <div className="mx-auto grid max-w-xl grid-cols-2 gap-3 rounded bg-black/30 p-4">
              <span>Points: 1000</span>
              <span className="text-right">Position: 80%</span>
              <span>Winstreaks: 0</span>
              <span className="text-right">Highest Streak: 0</span>
            </div>
            <div className="text-center">
              <button
                type="button"
                className={`${buttonClass} text-lg`}
                onClick={() => showNotice("Ranked matchmaking is not connected yet.")}
              >
                Find Match
              </button>
            </div>
            <hr className="border-white/10" />
            <GoldHeading>Top Rankings</GoldHeading>
            <ol className="mx-auto grid max-w-md grid-cols-2 gap-x-8 gap-y-2 text-center sm:grid-cols-1">
              {rankings.map((name, index) => (
                <li key={name}>
                  <span className="text-amber-200">#{index + 1}:</span> {name}
                </li>
              ))}
            </ol>
          </Panel>
        )}

        {activeTab === "Tournament" && (
          <Panel className="space-y-6">
            <TournamentCard
              name="42 Tournament 2026"
              status="Open"
              registration="19/9/2026 - 30/9/2026"
              competition="2/10/2026 - 8/10/2026"
              host="42Bangkok"
              registered="4/16"
              onViewPlayers={() => setDialog("registeredPlayers")}
              onRegister={() => showNotice("Tournament registration is not connected yet.")}
              requirements={[
                "Participants must be level 30 or above",
                "Participants must be within 1000 - 3000 rank points",
                "Participants must have their account bound with 42 intra",
              ]}
              prizes={[
                "1st, 2nd, and 3rd place receive gold, silver, and bronze medal trophies and an exclusive title.",
                "The top 8 players receive a 42 Tournament Trophy and finalists' exclusive title.",
                "Every participant receives a participation title.",
                "The host may withhold awards from disqualified players.",
              ]}
            />
            <hr className="border-white/10" />
            <TournamentCard
              name="Transcend Open: Autumn 2026"
              status="Announced"
              registration="18/10/2026 - 25/10/2026"
              competition="27/10/2026 - 30/10/2026"
              host="Transcend 888"
              registered="0/64"
              requirements={[
                "Participants must be level 10 or above",
                "No rank requirements",
              ]}
              prizes={[
                "1st place receives a Gold Medal Trophy, Gold card sleeve, and exclusive profile picture.",
                "2nd place receives a Silver Medal Trophy and Silver card sleeve.",
                "3rd place receives a Bronze Medal Trophy and Bronze card sleeve.",
                "The top 16 players receive a Transcend Open card sleeve.",
                "Every participant receives a participation trophy.",
                "The host may withhold awards from disqualified players.",
              ]}
            />
          </Panel>
        )}

        {activeTab === "Custom" && (
          <Panel>
            <div className="mb-5 flex gap-2 border-b border-white/20">
              {(["casual", "tournament"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setCustomTab(tab)}
                  className={`border-b-2 px-4 py-3 font-semibold capitalize ${
                    customTab === tab
                      ? "border-amber-400 text-amber-200"
                      : "border-transparent text-neutral-300 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {customTab === "casual" ? (
              <div className="space-y-5">
                <label className="grid gap-2 sm:grid-cols-[12rem_1fr] sm:items-center">
                  <span>Catchphrase:</span>
                  <input className={inputClass} />
                </label>
                <label className="flex flex-wrap items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(event) => setIsPrivate(event.target.checked)}
                    className="size-4 accent-amber-400"
                  />
                  <span>Private</span>
                  <span className="ml-0 sm:ml-6">Password:</span>
                  <input type="password" className={inputClass} disabled={!isPrivate} />
                </label>
                <RangeControl
                  label="Max Player:"
                  min={2}
                  max={8}
                  value={maxPlayers}
                  onChange={setMaxPlayers}
                />
                <RangeControl
                  label="Max Spectator:"
                  min={0}
                  max={10}
                  value={maxSpectators}
                  onChange={setMaxSpectators}
                />
                <RadioGroup
                  label="Difficulty:"
                  name="casual-difficulty"
                  options={["Intermediate", "Standard", "Turbo"]}
                  defaultValue="Intermediate"
                />
                <fieldset className="grid gap-3 sm:grid-cols-[10rem_1fr] sm:items-center">
                  <legend className="sm:float-left">Starting Chips:</legend>
                  <div className="flex flex-wrap items-center gap-4">
                    <RadioGroup
                      name="casual-chips"
                      options={["Ante", "Big Blind", "Custom"]}
                      defaultValue="Ante"
                      onValueChange={(value) => setCustomChips(value === "Custom")}
                    />
                    <input
                      aria-label="Custom starting chips"
                      type="range"
                      min={500}
                      max={5000}
                      step={100}
                      value={startingChips}
                      onChange={(event) => setStartingChips(Number(event.target.value))}
                      className="w-40 accent-amber-400"
                      disabled={!customChips}
                    />
                    <output className="tabular-nums">{startingChips}</output>
                  </div>
                </fieldset>
                <RangeControl
                  label="Max Cycles:"
                  min={1}
                  max={20}
                  value={maxCycles}
                  onChange={setMaxCycles}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() => showNotice("Custom room creation is not connected yet.")}
                  >
                    Create
                  </button>
                </div>
              </div>
            ) : (
              <TournamentSettings
                onRequest={() =>
                  showNotice("Tournament requests are not connected yet.")
                }
              />
            )}
          </Panel>
        )}
      </div>

      {dialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDialog(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            className="w-full max-w-sm rounded-lg border border-amber-300/30 bg-neutral-900 p-6 shadow-2xl"
          >
            <h2 id="dialog-title" className="text-lg font-bold text-amber-200">
              Approved Registered Players
            </h2>
            <ul className="mt-4 space-y-2 text-center">
              {["Test-2", "Test-8", "Test-1", "Test-5"].map((player) => (
                <li key={player}>{player}</li>
              ))}
            </ul>
            <button
              type="button"
              autoFocus
              onClick={() => setDialog(null)}
              className={`${buttonClass} mt-6 w-full`}
            >
              Close
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

function RadioGroup({
  label,
  name,
  options,
  defaultValue,
  onValueChange,
}: {
  label?: string;
  name: string;
  options: string[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {label && <legend className="mb-2 w-full sm:mb-0 sm:w-auto">{label}</legend>}
      {options.map((option) => (
        <label key={option} className="inline-flex items-center gap-2">
          <input
            type="radio"
            name={name}
            value={option}
            defaultChecked={option === defaultValue}
            onChange={() => onValueChange?.(option)}
            className="accent-amber-400"
          />
          {option}
        </label>
      ))}
    </fieldset>
  );
}

function TournamentCard({
  name,
  status,
  registration,
  competition,
  host,
  registered,
  requirements,
  prizes,
  onViewPlayers,
  onRegister,
}: {
  name: string;
  status: string;
  registration: string;
  competition: string;
  host: string;
  registered: string;
  requirements: string[];
  prizes: string[];
  onViewPlayers?: () => void;
  onRegister?: () => void;
}) {
  return (
    <article className="space-y-4">
      <GoldHeading>{name}</GoldHeading>
      <div className="mx-auto w-fit space-y-1 text-sm text-neutral-200 sm:text-base">
        <p>Status: {status}</p>
        <p>Registry Date: {registration}</p>
        <p>Compete Date: {competition}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm sm:text-base">
        <span>Host: {host}</span>
        {onViewPlayers ? (
          <button
            type="button"
            onClick={onViewPlayers}
            className="text-amber-200 underline underline-offset-4 hover:text-amber-100"
          >
            Registered: {registered}
          </button>
        ) : (
          <span>Registered: {registered}</span>
        )}
        {onRegister && (
          <button type="button" className={buttonClass} onClick={onRegister}>
            Register
          </button>
        )}
      </div>
      <details className="rounded bg-black/25 p-3">
        <summary className="cursor-pointer text-right text-sm text-amber-200">
          Details
        </summary>
        <div className="mx-auto mt-4 max-w-3xl space-y-3 text-sm leading-relaxed text-neutral-200">
          <div>
            <h3 className="font-bold text-white">Requirements:</h3>
            <ul className="list-disc pl-6">
              {requirements.map((requirement) => (
                <li key={requirement}>{requirement}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-white">Prize Pools:</h3>
            <ul className="list-disc pl-6">
              {prizes.map((prize) => (
                <li key={prize}>{prize}</li>
              ))}
            </ul>
          </div>
        </div>
      </details>
    </article>
  );
}

function TournamentSettings({ onRequest }: { onRequest: () => void }) {
  const [cycles, setCycles] = useState(10);
  return (
    <div className="space-y-5">
      <label className="grid gap-2 sm:grid-cols-[12rem_1fr] sm:items-center">
        <span>Host/Organization:</span>
        <input className={inputClass} />
      </label>
      <RadioGroup
        label="Required Players:"
        name="tournament-players"
        options={["16", "32", "64"]}
        defaultValue="16"
      />
      <DateRange label="Registry Date:" name="registry" />
      <DateRange label="Compete Date:" name="competition" />
      <RadioGroup
        label="Difficulty:"
        name="tournament-difficulty"
        options={["Intermediate", "Standard", "Turbo"]}
        defaultValue="Intermediate"
      />
      <RadioGroup
        label="Starting Chips:"
        name="tournament-chips"
        options={["Ante", "Big Blind"]}
        defaultValue="Ante"
      />
      <RangeControl
        label="Max Cycles:"
        min={1}
        max={20}
        value={cycles}
        onChange={setCycles}
      />
      <label className="grid gap-2 sm:grid-cols-[12rem_1fr] sm:items-center">
        <span>Requirements:</span>
        <input className={inputClass} />
      </label>
      <div className="flex justify-end">
        <button type="button" className={buttonClass} onClick={onRequest}>
          Request
        </button>
      </div>
    </div>
  );
}

function DateRange({ label, name }: { label: string; name: string }) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="mb-2 w-full sm:mb-0 sm:w-auto">{label}</legend>
      <input
        aria-label={`${label} start`}
        type="date"
        name={`${name}-start`}
        min="2026-01-01"
        defaultValue="2026-11-01"
        className={inputClass}
      />
      <span aria-hidden="true">–</span>
      <input
        aria-label={`${label} end`}
        type="date"
        name={`${name}-end`}
        min="2026-01-01"
        defaultValue="2026-11-01"
        className={inputClass}
      />
    </fieldset>
  );
}
