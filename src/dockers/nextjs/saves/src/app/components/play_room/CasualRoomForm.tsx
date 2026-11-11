"use client";

import { useState } from "react";

const inputStyles =
  "max-w-full rounded-md border border-[#666] bg-[#2a2a2a] px-2.5 py-1 text-white outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-[0.45]";

export default function CasualRoomForm() {
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [maxSpectators, setMaxSpectators] = useState(5);
  const [message, setMessage] = useState("");

  return (
    <form
      className="flex flex-col gap-3 px-[5%] py-[1%]"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage("Casual room created.");
      }}
    >
      <label className="flex w-full items-center gap-3 max-[800px]:flex-wrap">
        <span>Catchphrase:</span>
        <input
          name="catchphrase"
          className={`${inputStyles} min-w-[70%] flex-1 max-[800px]:w-full max-[800px]:min-w-0`}
        />
      </label>

      <div className="flex w-full items-center gap-[3vw] max-[800px]:flex-wrap">
        <label>
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(event) => setIsPrivate(event.target.checked)}
            className="accent-red-600"
          />{" "}
          Private
        </label>
        <label>
          Password:{" "}
          <input
            name="roompass"
            type="password"
            disabled={!isPrivate}
            className={inputStyles}
          />
        </label>
      </div>

      <RangeControl
        label="Max Player"
        value={maxPlayers}
        min={2}
        max={8}
        onChange={setMaxPlayers}
      />
      <RangeControl
        label="Max Spectator"
        value={maxSpectators}
        min={0}
        max={10}
        onChange={setMaxSpectators}
      />

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

type RangeControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

function RangeControl({
  label,
  value,
  min,
  max,
  onChange,
}: RangeControlProps) {
  return (
    <label className="flex w-full items-center gap-3 max-[800px]:flex-wrap">
      <span>{label}:</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-1/4 accent-red-600 max-[800px]:w-[65%]"
      />
      <output>{value}</output>
    </label>
  );
}
