export type PokerActionType = "FOLD" | "CHECK" | "CALL" | "RAISE";

export interface PublicPlayer {
  playerId: string;
  seatNumber?: number;
  stack: number;
  roundContribution?: number;
  folded: boolean;
  allIn: boolean;
}

export interface HandWinner {
  playerId: string;
  amount: number;
  hand?: string;
}

export interface PublicGameState {
  tableSessionId: string;
  handId: string;
  round: string;
  roundNumber?: number;
  actionDeadlineAt?: string;
  settled?: boolean;
  poolCards: string[];
  pot: number;
  ante?: number;
  currentBet?: number;
  currentPlayerId?: string | null;
  cycleNumber?: number;
  handNumber?: number;
  cycleComplete?: boolean;
  winners?: HandWinner[];
  revealedCards?: Record<string, string[]>;
  players: PublicPlayer[];
}
