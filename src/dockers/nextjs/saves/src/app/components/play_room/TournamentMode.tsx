"use client";

import { useState } from "react";

export default function TournamentMode() {
  const [message, setMessage] = useState("");

  return (
    <section className="flex flex-col">
      <div className="mt-[3vh] flex h-fit w-[90vw] flex-col self-center bg-[rgba(42,42,42,0.75)] p-[1%] max-[800px]:w-[94vw] max-[800px]:p-[3%]">
        <TournamentCard
          name="42 Tournament 2026"
          status="Open"
          registry="19/9/2026 - 30/9/2026"
          compete="2/10/2026 - 8/10/2026"
          host="42Bangkok"
          registered="0/16"
          requirements={[
            "Participants must be level 30 or above",
            "Participants must be within 1000 - 3000 rank points",
            "Participants must have their account bound with 42 intra",
          ]}
          prizes={[
            "1st, 2nd, and 3rd Place will be awarded with Gold, Silver, and Bronze Medal Trophy, respectively, in addition to an exclusive title",
            "The top 8 players will be awarded with 42 Tournament Trophy, in addition to the finalists' exclusive title",
            "Every player who participated will receive a participation title",
            "The Tournament Host reserves the right to not award players who are disqualified from the tournament in any case",
          ]}
          onRegister={() => setMessage("Registered for 42 Tournament 2026.")}
        />

        <TournamentCard
          name="Transcend Open: Autumn 2026"
          status="Announced"
          registry="18/10/2026 - 25/10/2026"
          compete="27/10/2026 - 30/10/2026"
          host="Transcend 888"
          registered="0/64"
          requirements={[
            "Participants must be level 10 or above",
            "No rank requirements",
          ]}
          prizes={[
            "1st Place will be awarded with Gold Medal Trophy and Gold card sleeve, in addition to an exclusive Profile Picture",
            "2nd Place will be awarded with Silver Medal Trophy and Silver card sleeve",
            "3rd Place will be awarded with Bronze Medal Trophy and Bronze card sleeve",
            "The top 16 players will be awarded with Transcend Open card sleeve",
            "Every player who participated will receive a participation trophy",
            "The Tournament Host reserves the right to not award players who are disqualified from the tournament in any case",
          ]}
        />
        <p className="mt-2 min-h-[1.4em] text-center text-[0.65em] text-[#ffe77f]" aria-live="polite">
          {message}
        </p>
      </div>
    </section>
  );
}

type TournamentCardProps = {
  name: string;
  status: string;
  registry: string;
  compete: string;
  host: string;
  registered: string;
  requirements: string[];
  prizes: string[];
  onRegister?: () => void;
};

function TournamentCard({
  name,
  status,
  registry,
  compete,
  host,
  registered,
  requirements,
  prizes,
  onRegister,
}: TournamentCardProps) {
  return (
    <article className="border-b border-[#aaa] px-[1%] pt-[1%] pb-[2%]">
      <h2 className="my-2 text-center font-serif text-[clamp(14px,calc(6px+2vw),28px)] font-bold text-[#ffd700]">
        {name}
      </h2>
      <div className="mx-auto w-fit max-w-full leading-normal">
        <div>Status: {status}</div>
        <div>Registry Date: {registry}</div>
        <div>Compete Date: {compete}</div>
        <div className="flex items-center gap-6 pt-[2%] text-[clamp(11px,calc(6px+2vw),20px)] whitespace-nowrap max-[800px]:flex-wrap max-[800px]:whitespace-normal">
          <span>Host: {host}</span>
          <span>Registered: {registered}</span>
          {onRegister && (
            <button
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border-0 bg-red-600 px-2.5 py-2 text-[clamp(14px,calc(6px+2vw),20px)] font-bold text-white hover:bg-red-700 focus-visible:bg-red-700"
              type="button"
              onClick={onRegister}
            >
              Register
            </button>
          )}
        </div>
      </div>
      <details className="text-[clamp(11px,calc(6px+2vw),18px)]">
        <summary className="cursor-pointer text-right">Details</summary>
        <div className="mx-auto w-[90%] bg-[rgba(15,15,15,0.7)] p-6 text-justify leading-normal max-[800px]:w-full max-[800px]:p-4">
          <DetailList title="Requirements" items={requirements} />
          <DetailList title="Prize Pools" items={prizes} />
        </div>
      </details>
    </article>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <>
      <strong>{title}:</strong>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  );
}
