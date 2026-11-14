export type Profile = {
  id: string;
  username: string;
  title: string;
  pronoun: string;
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

export type JoinRole = "player" | "spectator";
export type GameTab = "casual" | "ranked" | "tournament" | "custom";
