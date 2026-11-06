"use client";

import { useState } from "react";
import { rankings } from "../../../lib/mock-data";

export default function RankedMode() {
  const [message, setMessage] = useState("");

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
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border-0 bg-red-600 px-2.5 py-2 text-[clamp(18px,calc(16px+2vw),24px)] font-bold text-white hover:bg-red-700 focus-visible:bg-red-700"
              onClick={() => setMessage("Searching for a ranked match…")}
            >
              Find Match
            </button>
          </div>
          <p className="mt-2 min-h-[1.4em] text-center text-[0.65em] text-[#ffe77f]" aria-live="polite">
            {message}
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
    </section>
  );
}
