"use client";

import { useState } from "react";

const inputStyles =
  "max-w-full rounded-md border border-[#666] bg-[#2a2a2a] px-2.5 py-1 text-white outline-none focus:ring-2 focus:ring-red-600";

export default function TournamentRequestForm() {
  const [message, setMessage] = useState("");

  return (
    <form
      className="flex flex-col gap-3 px-[5%] py-[1%]"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage("Tournament request created.");
      }}
    >
      <label className="flex w-full items-center gap-3 max-[800px]:flex-wrap">
        <span>Host/Organization:</span>
        <input
          name="host"
          className={`${inputStyles} min-w-[40%] flex-1 max-[800px]:w-full max-[800px]:min-w-0`}
        />
      </label>

      <fieldset className="flex w-full items-center gap-3 border-0 p-0 max-[800px]:flex-wrap">
        <legend>Required Players:</legend>
        {[16, 32, 64].map((players) => (
          <label key={players}>
            <input
              type="radio"
              name="players"
              value={players}
              defaultChecked={players === 16}
              className="accent-red-600"
            />{" "}
            {players}
          </label>
        ))}
      </fieldset>

      <DateRange label="Registry Date" prefix="registry" />
      <DateRange label="Compete Date" prefix="compete" />

      <label className="flex w-full items-center gap-3 max-[800px]:flex-wrap">
        <span>Requirements:</span>
        <input
          name="requirements"
          className={`${inputStyles} min-w-[70%] flex-1 max-[800px]:w-full max-[800px]:min-w-0`}
        />
      </label>

      <div className="mt-[2vh] flex items-center justify-between gap-4 max-[520px]:flex-col max-[520px]:items-stretch">
        <span className="mt-2 min-h-[1.4em] text-[0.65em] text-[#ffe77f]" aria-live="polite">
          {message}
        </span>
        <button
          type="submit"
          className="inline-flex cursor-pointer items-center justify-center rounded-lg border-0 bg-red-600 px-2.5 py-2 text-[clamp(18px,calc(16px+2vw),24px)] font-bold text-white hover:bg-red-700 focus-visible:bg-red-700"
        >
          Create
        </button>
      </div>
    </form>
  );
}

function DateRange({ label, prefix }: { label: string; prefix: string }) {
  return (
    <div className="flex w-full items-center gap-3 max-[800px]:flex-wrap">
      <span>{label}:</span>
      <label>
        <span className="sr-only">{label} start</span>
        <input
          type="date"
          name={`${prefix}-start`}
          min="2026-01-01"
          defaultValue="2026-11-01"
          className={`${inputStyles} max-[520px]:w-full`}
        />
      </label>
      <span>–</span>
      <label>
        <span className="sr-only">{label} end</span>
        <input
          type="date"
          name={`${prefix}-end`}
          min="2026-01-01"
          defaultValue="2026-11-01"
          className={`${inputStyles} max-[520px]:w-full`}
        />
      </label>
    </div>
  );
}
