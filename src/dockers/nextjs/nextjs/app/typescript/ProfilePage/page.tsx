"use client";

import Image, { StaticImageData } from "next/image";
import { useState } from "react";
import defaultProfilePic from "../res/defaultProfilePic.svg";
import iconLogo from "../res/iconLogo.svg";
import meshBackground from "../res/meshbg1.svg";
import profileSample from "../res/profile_sample.png";

type TabId = "main" | "stats" | "history" | "settings";

const tabs: { id: TabId; label: string }[] = [
  { id: "main", label: "Main Profile" },
  { id: "stats", label: "Player Statistics" },
  { id: "history", label: "Match History" },
  { id: "settings", label: "Account Settings" },
];

const statRows = [
  ["Join", "03/08/2005", "Level", "NaN", "Status", "Pending"],
  ["Matches Played", "NaN", "Rounds Won", "NaN", "Win Rate", "NaN"],
];

const friends = Array.from({ length: 5 });
const trophies = Array.from({ length: 5 });

function StatTable({ rows }: { rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] table-fixed text-left text-sm sm:text-base">
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-white/10 last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-2 py-3 align-middle sm:px-3">
                  {cellIndex % 2 === 0 ? <span className="text-white/65">{cell}: </span> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PictureStrip({ source, alt, items }: { source: StaticImageData; alt: string; items: unknown[] }) {
  return (
    <div className="flex flex-wrap gap-3 pl-1 sm:pl-4">
      {items.map((_, index) => (
        <div key={index} className="relative h-12 w-12 overflow-hidden sm:h-16 sm:w-16">
          <Image src={source} alt={alt} fill sizes="64px" className="object-contain" />
        </div>
      ))}
    </div>
  );
}

function ProfileCard() {
  return (
    <>
      <section className="w-full bg-[rgb(42_42_42_/_0.78)] p-4 flex flex-col gap-5 sm:flex-row">
        <div className="relative h-32 w-32 shrink-0 overflow-hidden sm:h-48 sm:w-48">
          <Image src={profileSample} alt="Profile picture" fill sizes="192px" className="object-contain" />
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <StatTable rows={statRows} />
          <hr className="my-4 border-white/15" />
          <p>Signature: Poker Rookie</p>
        </div>
      </section>
      <section className="w-full bg-[rgb(42_42_42_/_0.78)] p-4 flex flex-col gap-6">
        <div>
          <h2 className="mb-2 text-base font-bold sm:text-lg">Friends</h2>
          <PictureStrip source={defaultProfilePic} alt="Friend avatar" items={friends} />
        </div>
        <div>
          <h2 className="mb-2 text-base font-bold sm:text-lg">Trophies</h2>
          <PictureStrip source={iconLogo} alt="Trophy icon" items={trophies} />
        </div>
      </section>
    </>
  );
}

function RadarChart() {
  return (
    <div className="mx-auto mt-4 aspect-square w-full max-w-[22rem]" aria-label="Player playstyle radar chart" role="img">
      <svg viewBox="0 0 240 240" className="h-full w-full" aria-hidden="true">
        <polygon points="120,18 217,88 180,202 60,202 23,88" fill="none" stroke="rgb(255 255 255 / .2)" />
        <polygon points="120,50 185,97 160,174 80,174 55,97" fill="none" stroke="rgb(255 255 255 / .16)" />
        <polygon points="120,82 153,106 140,146 100,146 87,106" fill="none" stroke="rgb(255 255 255 / .14)" />
        <polygon points="120,47 149,109 140,149 99,138 77,96" fill="rgb(254 220 110 / .55)" stroke="#fedc6e" strokeWidth="2" />
        {[
          [120, 8, "Daring"],
          [225, 87, "Bluffing"],
          [181, 218, "Push"],
          [59, 218, "Fold"],
          [15, 87, "Bold"],
        ].map(([x, y, label]) => (
          <text key={label} x={x} y={y} fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function Statistics() {
  return (
    <section className="w-full bg-[rgb(42_42_42_/_0.78)] p-4">
      <StatTable
        rows={[
          ["Join", "03/08/2005", "Level", "NaN", "Likes", "NaN"],
          ["Matches Played", "NaN", "Rounds Won", "NaN", "Win Rate", "NaN"],
          ["Highest Gain", "NaN", "Highest Loss", "NaN", "Highest Bank", "NaN"],
        ]}
      />
      <hr className="my-5 border-white/15" />
      <div className="text-center">
        <h2 className="font-bold">Playstyle</h2>
        <RadarChart />
      </div>
    </section>
  );
}

function MatchRow({ mode, result, rounds, points }: { mode: string; result: string; rounds: string; points?: string }) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/15 py-4 last:border-b-0 sm:flex-row sm:items-center">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden sm:h-20 sm:w-20">
        <Image src={profileSample} alt="Your profile picture" fill sizes="80px" className="object-contain" />
      </div>
      <div className="grid flex-1 grid-cols-1 gap-1 text-sm sm:grid-cols-3 sm:text-base">
        <span>Time: TBD</span><span>Mode: {mode}</span><span>Enemy: TBD</span>
        <span className={result === "Win" ? "text-emerald-300" : "text-red-300"}>Result: {result}</span>
        <span>Rounds: {rounds}</span><span>{points ?? ""}</span>
      </div>
      <div className="relative h-16 w-16 shrink-0 overflow-hidden sm:h-20 sm:w-20">
        <Image src={defaultProfilePic} alt="Opponent profile picture" fill sizes="80px" className="object-contain" />
      </div>
    </div>
  );
}

function MatchHistory() {
  return (
    <section className="w-full bg-[rgb(42_42_42_/_0.78)] p-4">
      <MatchRow mode="Casual" result="Loss" rounds="2/7" />
      <MatchRow mode="Ranked" result="Win" rounds="5/6" points="Points: +1" />
    </section>
  );
}

function Settings() {
  return (
    <section className="w-full bg-[rgb(42_42_42_/_0.78)] p-4 flex flex-col gap-5 sm:flex-row">
      <div className="relative h-32 w-32 shrink-0 overflow-hidden sm:h-48 sm:w-48">
        <Image src={profileSample} alt="Profile picture" fill sizes="192px" className="object-contain" />
      </div>
      <form className="flex flex-1 flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>ID: <span className="text-white/65">REDACTED</span></label>
          <label>Display Name<input className="mt-1 block w-full rounded-md border border-[#666] bg-[#2a2a2a] px-2 py-1.5 text-white" type="text" defaultValue="USERNAME" /></label>
          <label>Pronoun<select className="mt-1 block w-full rounded-md border border-[#666] bg-[#2a2a2a] px-2 py-1.5 text-white" defaultValue="he"><option value="he">He/Him</option><option value="she">She/Her</option><option value="they">They/Them</option></select></label>
          <label>Title<select className="mt-1 block w-full rounded-md border border-[#666] bg-[#2a2a2a] px-2 py-1.5 text-white" defaultValue="default"><option value="default">Poker Rookie</option><option value="dev">DaveChips 888</option><option value="admin">Dont@Me</option></select></label>
        </div>
        <hr className="border-white/15" />
        <label>Signature<input className="mt-1 block w-full rounded-md border border-[#666] bg-[#2a2a2a] px-2 py-1.5 text-white" type="text" defaultValue="Poker Rookie" /></label>
        <button className="self-end rounded-lg bg-red-600 px-3 py-2 font-bold hover:bg-red-500" type="submit">Save</button>
      </form>
    </section>
  );
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabId>("main");

  return (
    <main className="min-h-screen bg-[#262626] bg-cover bg-fixed text-white" style={{ backgroundImage: `linear-gradient(to bottom, rgb(0 0 0 / 0) 0%, rgb(0 0 0 / .25) 60%, #000 120%), url(${meshBackground.src})` }}>
      <header className="sticky top-0 z-10 bg-black/95 shadow-lg backdrop-blur">
        <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center gap-4 px-4 py-3 sm:px-8">
          <div className="flex min-w-0 flex-1 items-end gap-2">
            <h1 className="max-w-[28vw] truncate font-serif text-2xl font-bold text-yellow-300 sm:text-4xl">USERNAME</h1>
            <span className="max-w-[30vw] break-words font-serif text-sm font-bold text-yellow-300 sm:text-xl">title/alias</span>
          </div>
          <button className="rounded-lg bg-red-600 px-3 py-2 text-base font-bold hover:bg-red-500 sm:text-xl" type="button">Play</button>
          <button className="text-sm underline underline-offset-4 sm:text-base" type="button">Logout</button>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-8" aria-label="Profile sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-12 shrink-0 rounded-t-md px-3 text-xs font-bold transition-colors sm:px-5 sm:text-sm ${activeTab === tab.id ? "bg-red-600 text-white" : "bg-black text-white/70 hover:bg-white/10 hover:text-white"}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-8 sm:py-8">
        {activeTab === "main" && <ProfileCard />}
        {activeTab === "stats" && <Statistics />}
        {activeTab === "history" && <MatchHistory />}
        {activeTab === "settings" && <Settings />}
      </div>
    </main>
  );
}