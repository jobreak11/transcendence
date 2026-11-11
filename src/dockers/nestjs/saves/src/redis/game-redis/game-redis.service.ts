import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { REDIS_CLIENT } from "../redis.provider.js";
import type { RedisClient } from "../redis.provider.js";
import { Lobby } from "../lobby-redis/schemas/lobby.redis.schema.js";
import { GetLobbyMemberListDto } from "../../game/lobby/dto/get-lobby-member-list.dto.js";
import { UserRedisService } from "../user-redis/user-redis.service.js";
import { LobbyRoomStatus } from "../lobby-redis/schemas/lobby-details.redis.schema.js";
import { logError } from "../../utility/logError.js";
import { errorWithCode } from "../../utility/errorWithCode.js";
import { v7 as uuidv7 } from "uuid"
import { redis_game_all_rooms, redis_game_table_button, redis_game_table_hand, redis_game_table_hand_lock, redis_game_table_match_progress, redis_game_table_stack } from "./namespaces/game-redis.namespace.js";
import { GAME_ROOM_MAX } from "./game-redis.constants.js";
import { MatchProgress } from "../../websocket/game-gateway/dtos/match-progress.dto.js";
import { PokerState } from "../../websocket/game-gateway/dtos/poker-state.dto.js";
import { LOCK_TTL_MS, PLAYER_ACTION_TIMEOUT_MS } from "../../websocket/game-gateway/game-gateway.constants.js";
import { randomUUID } from "node:crypto";

@Injectable()
export class GameRedisService {

  private readonly logger = new Logger(GameRedisService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
    private readonly userRedisService: UserRedisService,
  ) {

  }

  async getHand(gameRoomId: string) {
    const stored = await this.redis.get(redis_game_table_hand(gameRoomId));
    if (!stored) {
      return null
    }
    return JSON.parse(stored) as PokerState
  }
  delHand(gameRoomId: string) {
    return this.redis.del(redis_game_table_hand(gameRoomId));
  }

  saveState(state: PokerState) {
    return this.redis.set(
      redis_game_table_hand(state.tableSessionId),
      JSON.stringify(state)
    )
  }
  async loadState(gameRoomId: string): Promise<PokerState> {
    const stored = await this.redis.get(redis_game_table_hand(gameRoomId));
    if (!stored) {
      throw errorWithCode(
        HttpStatus.NOT_FOUND,
        "No active hand for this table"
      )
    }

    const state = JSON.parse(stored) as PokerState;
    if (!Number.isFinite(Date.parse(state.actionDeadlineAt))) {
      state.actionDeadlineAt = new Date(
        Date.now() + PLAYER_ACTION_TIMEOUT_MS,
      ).toISOString();
      await this.saveState(state);
    }
    return state;
  }

  getAllStacks(gameRoomId: string) {
    return this.redis.hgetall(redis_game_table_stack(gameRoomId));
  }

  async loadMatchProgress(
    gameRoomId: string
  ): Promise<MatchProgress> {
    const stored = await this.redis.get(redis_game_table_match_progress(gameRoomId))
    if (!stored) {
      return {
        cycleNumber: 1,
        handNumber: 0,
        cyclePlayerIds: [],
        bigBlindPlayerIds: [],
        cycleComplete: false,
        matchPlayerIds: [],
        playerPlaces: {},
        matchComplete: false,
        totalHandsPlayed: 0,
        startedAt: null,
      }
    }
    const progress = JSON.parse(stored) as Partial<MatchProgress>;
    return {
      cycleNumber: progress.cycleNumber ?? 1,
      handNumber: progress.handNumber ?? 0,
      cyclePlayerIds: progress.cyclePlayerIds ?? [],
      bigBlindPlayerIds: progress.bigBlindPlayerIds ?? [],
      cycleComplete: progress.cycleComplete ?? false,
      matchPlayerIds: progress.matchPlayerIds ?? [],
      playerPlaces: progress.playerPlaces ?? {},
      matchComplete: progress.matchComplete ?? false,
      totalHandsPlayed: progress.totalHandsPlayed ?? 0,
      startedAt: progress.startedAt ?? null,
    }
  }

  saveMatchProgress(
    gameRoomId: string,
    progress: MatchProgress
  ) {

    return this.redis.set(
      redis_game_table_match_progress(gameRoomId),
      JSON.stringify(progress)
    )
  }

  incrButton(gameRoomId: string) {
    return this.redis.incr(redis_game_table_button(gameRoomId));
  }

  saveStacks(state: PokerState) {
    const value = Object.fromEntries(
      state.players.map(({ playerId, stack }) => [playerId, String(stack)]),
    )
    return this.redis.hset(redis_game_table_stack(state.tableSessionId), value);
  }


  async withTableLock<T>(
    gameRoomId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const lockKey = redis_game_table_hand_lock(gameRoomId);
    const token = randomUUID();
    const acquired = await this.redis.set(
      lockKey,
      token,
      "PX",
      LOCK_TTL_MS,
      "NX"
    );

    if (acquired !== "OK") {
      throw errorWithCode(
        HttpStatus.FORBIDDEN,
        "table is processing another game action"
      )
    }

    try {
      return await operation();
    } finally {
      await this.redis.eval(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
        1,
        lockKey,
        token,
      );
    }
  }

}