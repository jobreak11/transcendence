import { game_event_namespace } from "../game-event.namespace"

export namespace PokerEvent {
  const poker_namespace = `${game_event_namespace}:poker`


  export namespace private_cards {
    const private_cards_namespace = `${poker_namespace}:private_cards`
    export namespace to_client {
      export const event_name = `${private_cards_namespace}:to_client`
      export interface payload {
        tableSessionId: string;
        handId: string;
        cards: string[];
      }
    }
  }

  export namespace state {
    const state_namespace = `${poker_namespace}:state`;
    export namespace to_client {
      export const event_name = `${state_namespace}:to_client`

      export type BettingRound = 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER';

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
    }

  }

  export namespace action {
    const action_namespace = `${poker_namespace}:action`

    export type ActionType = 'FOLD' | 'CHECK' | 'CALL' | 'RAISE';

    export namespace to_client {
      export const event_name = `${action_namespace}:to_client`;
      export interface payload {
        playerId: string;
        actionType: ActionType;
        amount: number
      }

    }
    export namespace to_server {
      export const event_name = `${action_namespace}:to_server`;

      export interface payload {
        tableSessionId: string;
        actionType: "FOLD" | "CHECK" | "CALL" | "RAISE";
        amount?: number | undefined;
      }
    }
  }

}