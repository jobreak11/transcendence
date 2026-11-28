"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { getErrorMessage } from "./tournament-utils";

const inputStyles =
  "rounded-md border border-[#666] bg-[#2a2a2a] px-3 py-2 text-white outline-none focus:ring-2 focus:ring-red-600";

export default function CustomMode() {
  const [name, setName] = useState("");
  const [registrationEndsAt, setRegistrationEndsAt] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [requirements, setRequirements] = useState("");
  const [prizePools, setPrizePools] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
          requirements: requirements.split("\n").map((item) => item.trim()).filter(Boolean),
          prizePools: prizePools.split("\n").map((item) => item.trim()).filter(Boolean),
        }),
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      setName("");
      setRegistrationEndsAt("");
      setMaxParticipants("");
      setRequirements("");
      setPrizePools("");
      setMessage("Tournament created.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create tournament.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex flex-col">
      <div className="mt-[3vh] flex h-fit w-[90vw] flex-col self-center gap-5 bg-[rgba(42,42,42,0.75)] p-[2%] max-[800px]:w-[94vw] max-[800px]:p-[3%]">
        <h2 className="text-xl font-bold text-[#ffd700]">Create tournament</h2>
        <form className="flex flex-wrap items-end gap-3" onSubmit={submitCreate}>
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
          <label className="flex min-w-full flex-col gap-1">
            <span>Requirements (one per line)</span>
            <textarea
              className={inputStyles}
              rows={3}
              value={requirements}
              onChange={(event) => setRequirements(event.target.value)}
            />
          </label>
          <label className="flex min-w-full flex-col gap-1">
            <span>Prize Pools (one per line)</span>
            <textarea
              className={inputStyles}
              rows={3}
              value={prizePools}
              onChange={(event) => setPrizePools(event.target.value)}
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
        {message && <p className="text-center text-[#ffe77f]" aria-live="polite">{message}</p>}
        {error && <p className="text-center text-red-300" role="alert">{error}</p>}
      </div>
    </section>
  );
}
