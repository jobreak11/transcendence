import { PokerPlayer } from "./poker-player.dto.js";

export type BettingRound = 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER';

export interface PokerState {
  handId: string;
  tableSessionId: string;
  cycleNumber: number;
  handNumber: number;
  round: BettingRound;
  deck: string[];
  poolCards: string[];
  players: PokerPlayer[];
  buttonIndex: number;
  currentPlayerId: string | null;
  currentBet: number;
  lastRaiseSize: number;
  ante: number;
  smallBlind: number;
  bigBlind: number;
  pot: number;
  pendingPlayerIds: string[];
  startedAt: string;
  actionDeadlineAt: string;
}
