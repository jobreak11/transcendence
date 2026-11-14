import { BettingRound } from "./dtos/poker-state.dto.js";

export const ACTIVE_HAND_TTL_SECONDS = 24 * 60 * 60;
export const PLAYER_ACTION_TIMEOUT_MS = 10_000;
export const LOCK_TTL_MS = 15_000;
export const EXP_PER_HAND_PLAYED = 5;
export const ROUND_ORDER: BettingRound[] = [
  'PREFLOP',
  'FLOP',
  'TURN',
  'RIVER',
];
export const HAND_LABELS = [
  'High card',
  'One pair',
  'Two pair',
  'Three of a kind',
  'Straight',
  'Flush',
  'Full house',
  'Four of a kind',
  'Straight flush',
];