"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { LobbyUserCreateDto } from "../../../types/dto";

const inputStyles =
  "max-w-full rounded-md border border-[#666] bg-[#2a2a2a] px-2.5 py-1 text-white outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-[0.45]";

const formatLabels = {
  BEGINNER: "Beginner",
  PRO: "Pro",
  TURBO: "Turbo",
} as const;

type GameFormat = keyof typeof formatLabels;
type LobbyFormatSettings = {
  format: GameFormat;
  startingChips: number;
  bigBlind: number;
};

function isGameFormat(value: unknown): value is GameFormat {
  return typeof value === "string"
    && Object.prototype.hasOwnProperty.call(formatLabels, value);
}

function isLobbyFormatSettings(value: unknown): value is LobbyFormatSettings[] {
  return Array.isArray(value)
    && value.length === Object.keys(formatLabels).length
    && value.every(
      (item) =>
        typeof item === "object"
        && item !== null
        && "format" in item
        && isGameFormat(item.format)
        && "startingChips" in item
        && typeof item.startingChips === "number"
        && Number.isInteger(item.startingChips)
        && "bigBlind" in item
        && typeof item.bigBlind === "number"
        && Number.isInteger(item.bigBlind),
    )
    && new Set(value.map((item) => item.format)).size === value.length;
}

type CasualRoomFormProps = {
  onCreated: (lobbyPinId: string) => void | Promise<void>;
};

export default function CasualRoomForm({ onCreated }: CasualRoomFormProps) {
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [maxSpectators, setMaxSpectators] = useState(5);
  const [formats, setFormats] = useState<LobbyFormatSettings[] | null>(null);
  const [formatsError, setFormatsError] = useState("");
  const [format, setFormat] = useState<GameFormat>("BEGINNER");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFormats() {
      try {
        const response = await fetch("/api/game/lobby/formats", {
          cache: "no-store",
          signal: controller.signal,
        });
        const body: unknown = await response.json();

        if (!response.ok) {
          throw new Error(`Could not load lobby formats (${response.status}).`);
        }
        if (!isLobbyFormatSettings(body)) {
          throw new Error("The server returned invalid lobby format settings.");
        }

        setFormats(body);
        setFormat(body[0].format);
      } catch (error) {
        if (!controller.signal.aborted) {
          setFormatsError(
            error instanceof Error ? error.message : "Could not load lobby formats.",
          );
        }
      }
    }

    void loadFormats();
    return () => controller.abort();
  }, []);

  async function createLobby(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const catchPhrase = String(formData.get("catchphrase") ?? "").trim();
    const password = String(formData.get("roompass") ?? "");
    const payload: LobbyUserCreateDto = {
      generalSettings: {
        catchPhrase: catchPhrase || null,
        roomType: isPrivate ? "PRIVATE" : "PUBLIC",
        password: isPrivate ? password : null,
      },
      gameSettings: {
        maxPlayer: maxPlayers,
        maxSpectator: maxSpectators,
        format,
      },
    };

    try {
      const response = await fetch("/api/game/lobby/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body: unknown = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof body === "object"
          && body !== null
          && "message" in body
          && typeof body.message === "string"
            ? body.message
            : `Lobby creation failed (${response.status}).`;
        throw new Error(errorMessage);
      }

      if (
        typeof body !== "object"
        || body === null
        || !("details" in body)
        || typeof body.details !== "object"
        || body.details === null
        || !("roomPinId" in body.details)
        || typeof body.details.roomPinId !== "string"
      ) {
        throw new Error("The server response did not include a lobby ID.");
      }

      await onCreated(body.details.roomPinId);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not create lobby.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-3 px-[5%] py-[1%]"
      onSubmit={createLobby}
    >
      <label className="flex w-full items-center gap-3 max-[800px]:flex-wrap">
        <span>Catchphrase:</span>
        <input
          name="catchphrase"
          maxLength={100}
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
            minLength={4}
            maxLength={100}
            required={isPrivate}
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

      <div className="flex w-full items-center gap-3 max-[800px]:flex-wrap">
        <label htmlFor="game-format">Format:</label>
        {formats ? (
          <>
            <select
              id="game-format"
              value={format}
              onChange={(event) => {
                if (isGameFormat(event.target.value)) {
                  setFormat(event.target.value);
                }
              }}
              className={inputStyles}
            >
              {formats.map((item) => (
                <option key={item.format} value={item.format}>
                  {formatLabels[item.format]}
                </option>
              ))}
            </select>
            <div className="flex gap-5 text-sm text-[#ddd] max-[520px]:flex-wrap">
              <span>
                Starting Stack:{" "}
                {formats.find((item) => item.format === format)?.startingChips}
              </span>
              <span>
                Big Blind: {formats.find((item) => item.format === format)?.bigBlind}
              </span>
            </div>
          </>
        ) : (
          <span className="text-sm text-[#ddd]" role={formatsError ? "alert" : undefined}>
            {formatsError || "Loading formats…"}
          </span>
        )}
      </div>

      <div className="mt-[2vh] flex items-center justify-between gap-4 max-[520px]:flex-col max-[520px]:items-stretch">
        <span className="mt-2 min-h-[1.4em] text-[0.65em] text-[#ffe77f]" aria-live="polite">
          {message}
        </span>
        <button
          type="submit"
          disabled={isSubmitting || !formats}
          className="inline-flex cursor-pointer items-center justify-center rounded-lg border-0 bg-red-600 px-2.5 py-2 text-[clamp(18px,calc(16px+2vw),24px)] font-bold text-white hover:bg-red-700 focus-visible:bg-red-700"
        >
          {isSubmitting ? "Creating…" : "Create"}
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
