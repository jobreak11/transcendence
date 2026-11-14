
export interface MatchProgress {
  cycleNumber: number;
  handNumber: number;
  cyclePlayerIds: string[];
  bigBlindPlayerIds: string[];
  cycleComplete: boolean;
  matchPlayerIds: string[];
  playerPlaces: Record<string, number>;
  playerStats: Record<string, {
    playCount: number;
    winCount: number;
    expEarned: number;
  }>;
  matchComplete: boolean;
  totalHandsPlayed: number;
  startedAt: string | null;
}