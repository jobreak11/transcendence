
export interface PokerPlayer {
  playerId: string;
  seatNumber: number;
  stack: number;
  roundContribution: number;
  totalContribution: number;
  holeCards: string[];
  folded: boolean;
  allIn: boolean;
}