export type ActionType = 'FOLD' | 'CHECK' | 'CALL' | 'RAISE';

export interface PlayerActionInput {
  playerId: string;
  tableSessionId: string;
  actionType: ActionType;
  amount?: number;
  timedOut?: boolean;
}