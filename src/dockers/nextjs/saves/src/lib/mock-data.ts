import type { Profile, Room } from "./types";

export const initialProfile: Profile = {
  id: "REDACTED",
  username: "USERNAME",
  title: "Poker Rookie",
  pronoun: "he",
  signature: "Poker Rookie",
  joinedAt: "03/08/2005",
  level: "NaN",
  status: "Pending",
  matchesPlayed: "NaN",
  roundsWon: "NaN",
  winRate: "NaN",
};

export const rooms: Room[] = [
  {
    id: "room-test-1",
    host: "Test-1",
    catchphrase: "เร่เข้ามา",
    isPrivate: false,
    players: 1,
    maxPlayers: 8,
    spectators: 0,
    maxSpectators: 10,
  },
  {
    id: "room-test-2",
    host: "Test-2",
    catchphrase: "เร่เข้ามา",
    isPrivate: true,
    players: 1,
    maxPlayers: 8,
    spectators: 0,
    maxSpectators: 10,
  },
];

export const rankings = [
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
] as const;
