import type { ReactNode } from "react";
import { signOut } from "../../../lib/auth";

const players = ["Test-1", "Test-2", "Test-3", "Test-4", "Test-5", "Test-6"];
const spectators = [
  "Test-10",
  "Test-11",
  "Test-12",
  "Test-13",
  "Test-14",
  "Test-15",
  "Test-16",
  "Test-17",
  "Test-18",
  "Test-19",
];

function LobbyPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0">
      <h2 className="rounded-t-lg border-b border-neutral-950 bg-neutral-900 px-4 py-3 text-lg font-semibold sm:text-xl">
        {title}
      </h2>
      <div className="rounded-b-lg border-4 border-neutral-900 bg-neutral-950/75 p-4 sm:p-6">
        {children}
      </div>
    </section>
  );
}

function LobbyRoster({
  names,
  emptySlots = 0,
}: {
  names: string[];
  emptySlots?: number;
}) {
  return (
    <ul className="mx-auto grid min-h-60 w-full max-w-2xl grid-cols-2 content-start gap-x-6 text-sm sm:text-base">
      {[...names, ...Array.from({ length: emptySlots }, () => "")].map(
        (name, index) => (
          <li
            key={`${name || "empty"}-${index}`}
            aria-hidden={name ? undefined : true}
            className="flex min-h-12 items-center border-b border-white/10 px-2"
          >
            {name}
          </li>
        ),
      )}
    </ul>
  );
}

export default function LobbyListPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-amber-300/20 bg-black/70 shadow-lg">
        <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 sm:px-8">
          <h1 className="bg-yellow-400 bg-clip-text text-2xl font-bold text-transparent sm:text-4xl">
            Lobby
          </h1>
          <p className="max-w-[35vw] break-words bg-yellow-400 bg-clip-text text-lg font-bold text-transparent sm:text-2xl">
            ROOMNAME
          </p>
          <div className="ml-auto flex items-center gap-3 sm:gap-6">
            <p className="ml-auto bg-yellow-400 bg-clip-text text-right font-semibold text-transparent sm:text-xl">
              USERNAME
            </p>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/10 hover:text-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
        <div className="h-1 bg-red-600 to-transparent" />
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <LobbyPanel title="Players (8/8)">
            <LobbyRoster names={players} emptySlots={4} />
          </LobbyPanel>

          <LobbyPanel title="Spectators (10/10)">
            <LobbyRoster names={spectators} />
          </LobbyPanel>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <LobbyPanel title="Lobby Chat">
            <div
              aria-label="Lobby chat history"
              className="min-h-60 space-y-3"
            >
            </div>
          </LobbyPanel>

          <section className="flex flex-col justify-center gap-6 rounded-lg p-4 sm:p-6">
            <div>
              <h2 className="mb-4 text-xl font-bold text-amber-100 sm:text-2xl">
                Game Rules
              </h2>
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 sm:text-base">
                <div>
                  <dt className="sr-only">Difficulty</dt>
                  <dd>Difficulty: Turbo</dd>
                </div>
                <div>
                  <dt className="sr-only">Starting Chips</dt>
                  <dd>Starting Chips: 2000</dd>
                </div>
                <div>
                  <dt className="sr-only">Max Rounds</dt>
                  <dd>Max Rounds: 7</dd>
                </div>
                <div>
                  <dt className="sr-only">Win Condition</dt>
                  <dd>Win Condition: Best Of 7</dd>
                </div>
              </dl>
            </div>
            <div className="flex flex-col items-end gap-3">
              <button
                type="button"
                className="rounded bg-amber-500 px-5 py-2 font-semibold text-neutral-950 transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Ready
              </button>
              <button
                type="button"
                className="rounded bg-red-700 px-5 py-2 font-semibold text-white transition hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
              >
                Leave
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
