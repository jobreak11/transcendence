import type { MatchProgress } from "../../api/websocket/game-gateway/dtos/match-progress.dto.js";

export const TOURNAMENT_RESULT_RECORDER = Symbol("TOURNAMENT_RESULT_RECORDER");

export interface TournamentResultRecorder {
  recordMatchResult(
    lobbyPinId: string,
    matchId: string,
    matchProgress: MatchProgress,
  ): Promise<void>;
}
