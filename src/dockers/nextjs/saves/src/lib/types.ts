export type ProfileTab = "main" | "statistics" | "history" | "settings";
export type GameTab = "casual" | "ranked" | "tournament" | "custom";
export type CustomTab = "casual-settings" | "tournament-settings";
export type JoinRole = "player" | "spectator";

export type Profile = {
  id: string;
  username: string;
  title: string;
  pronoun: "he" | "she" | "they";
  signature: string;
  joinedAt: string;
  level: string;
  status: string;
  matchesPlayed: string;
  roundsWon: string;
  winRate: string;
};

export type Room = {
  id: string;
  host: string;
  catchphrase: string;
  isPrivate: boolean;
  players: number;
  maxPlayers: number;
  spectators: number;
  maxSpectators: number;
};
