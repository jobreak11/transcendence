import { StateStore } from "passport-oauth2";
import { event_game_namespace } from "./game.event.js";
import { BettingRound } from "../dtos/poker-state.dto.js";
import { ActionType } from "../dtos/player-action-input.dto.js";

function event_game_poker_namespace() {
  return `${event_game_namespace()}:poker`
}

export interface EventGamePrivateCardsToClientDto {
  tableSessionId: string;
  handId: string;
  cards: string[];
}
const event_game_poker_private_cards_namespace = `${event_game_poker_namespace()}:private_cards`
export const event_game_poker_private_cards = {
  to_client() {
    return `${event_game_poker_private_cards_namespace}:to_client`
  }
}


export interface EventGamePublicStateToClientDto {
  handId: string;
  tableSessionId: string;
  matchId: string;
  cycleNumber: number;
  handNumber: number;
  round: BettingRound;
  roundNumber: number;
  poolCards: string[];
  pot: number;
  currentBet: number;
  ante: number;
  smallBlind: number;
  bigBlind: number;
  currentPlayerId: string | null;
  actionDeadlineAt: string;
  buttonPlayerId: string;
  players: {
    playerId: string;
    seatNumber: number;
    stack: number;
    roundContribution: number;
    folded: boolean;
    allIn: boolean;
  }[];
  startedAt: string,
}
export interface EventGameFinishStateToClientDto {
  settled: boolean;
  handId: string;
  tableSessionId: string;
  matchId: string;
  cycleNumber: number;
  handNumber: number;
  round: string;
  roundNumber: number;
  cycleComplete: boolean;
  matchComplete: boolean;
  playerPlaces: Record<string, number>;
  playerStats: Record<string, {
    playCount: number;
    winCount: number;
    expEarned: number;
  }>;
  playerNames?: Record<string, string>;
  totalHandsPlayed: number;
  matchStartedAt: string;
  matchEndedAt?: string;
  poolCards: string[];
  pot: number;
  ante: number;
  winners: {
    playerId: string,
    amount: number,
    hand: string | undefined
  }[];
  revealedCards: {
    [k: string]: string[];
  } | undefined;
  players: {
    playerId: string;
    stack: number;
    folded: boolean;
    allIn: boolean;
  }[];
}
const event_game_poker_state_namespace = `${event_game_poker_namespace()}:state`
export const event_game_poker_state = {
  to_client() {
    return `${event_game_poker_state_namespace}:to_client`
  }
}

const event_game_poker_sync_namespace = `${event_game_poker_namespace()}:sync`
export const event_game_poker_sync = {
  to_server() {
    return `${event_game_poker_sync_namespace}:to_server`
  }
}

export interface EventGameActionToClientDto {
  playerId: string;
  actionType: ActionType;
  amount: number
}
const event_game_poker_action_namespace = `${event_game_poker_namespace()}:action`
export const event_game_poker_action = {
  to_client() {
    return `${event_game_poker_action_namespace}:to_client`
  },
  to_server() {
    return `${event_game_poker_action_namespace}:to_server`
  }
}
