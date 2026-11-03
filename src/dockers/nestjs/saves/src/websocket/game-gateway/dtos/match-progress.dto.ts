
export interface MatchProgress {
  cycleNumber: number;
  handNumber: number;
  cyclePlayerIds: string[];
  bigBlindPlayerIds: string[];
  cycleComplete: boolean;
}