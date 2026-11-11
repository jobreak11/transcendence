
export interface MatchProgress {
  cycleNumber: number;
  handNumber: number;
  cyclePlayerIds: string[];
  bigBlindPlayerIds: string[];
  cycleComplete: boolean;
  matchPlayerIds: string[];
  playerPlaces: Record<string, number>;
  matchComplete: boolean;
  totalHandsPlayed: number;
  startedAt: string | null;
}