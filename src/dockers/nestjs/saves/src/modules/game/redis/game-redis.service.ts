import { HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { REDIS_CLIENT, type RedisClient } from "../../../infrastructure/redis/redis.provider.js";
import { UsersRedisService } from "../../user/redis/users-redis.service.js";
import { redis_game_table_button, redis_game_table_completed_match, redis_game_table_hand, redis_game_table_hand_lock, redis_game_table_match_progress, redis_game_table_scheduled_start, redis_game_table_stack } from "./game-redis.namespace.js";
import { PokerState } from "../../../api/websocket/game-gateway/dtos/poker-state.dto.js";
import { errorWithCode } from "../../../utility/errorWithCode.js";
import { LOCK_TTL_MS, PLAYER_ACTION_TIMEOUT_MS } from "../../../api/websocket/game-gateway/game-gateway.constants.js";
import { MatchProgress } from "../../../api/websocket/game-gateway/dtos/match-progress.dto.js";
import { randomUUID } from "node:crypto";
import type { EventGameFinishStateToClientDto } from "../../../api/websocket/game-gateway/events/poker.event.js";
import type { EventGameChatMessage } from "../../../api/websocket/game-gateway/events/game-chat.event.js";
import { redis_game_chat_messages } from "../../../infrastructure/redis/namespaces/game/chat.namespace.js";

@Injectable()
export class GameRedisService {
  private readonly logger = new Logger(GameRedisService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
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

  delCompletedMatchState(gameRoomId: string) {
    return this.redis.del(redis_game_table_completed_match(gameRoomId));
  }

  delButton(gameRoomId: string) {
    return this.redis.del(redis_game_table_button(gameRoomId));
  }

  delMatchProgress(gameRoomId: string) {
    return this.redis.del(redis_game_table_match_progress(gameRoomId));
  }

  delStacks(gameRoomId: string) {
    return this.redis.del(redis_game_table_stack(gameRoomId));
  }

  async getCompletedMatchState(gameRoomId: string) {
    const stored = await this.redis.get(redis_game_table_completed_match(gameRoomId));
    return stored
      ? JSON.parse(stored) as EventGameFinishStateToClientDto
      : null;
  }

  saveCompletedMatchState(
    gameRoomId: string,
    state: EventGameFinishStateToClientDto,
  ) {
    return this.redis.set(
      redis_game_table_completed_match(gameRoomId),
      JSON.stringify(state),
    );
  }

  setScheduledStartAt(gameRoomId: string, startAt: Date) {
    return this.redis.set(
      redis_game_table_scheduled_start(gameRoomId),
      startAt.toISOString(),
      "EX",
      7 * 24 * 60 * 60,
    );
  }

  async getScheduledStartAt(gameRoomId: string) {
    const stored = await this.redis.get(redis_game_table_scheduled_start(gameRoomId));
    if (!stored) return null;
    const startAt = new Date(stored);
    if (!Number.isFinite(startAt.getTime())) {
      throw new Error(`Invalid scheduled start time for table ${gameRoomId}.`);
    }
    return startAt;
  }

  clearScheduledStartAt(gameRoomId: string) {
    return this.redis.del(redis_game_table_scheduled_start(gameRoomId));
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
        playerStats: {},
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
      playerStats: Object.fromEntries(
        Object.entries(progress.playerStats ?? {}).map(([playerId, stats]) => [
          playerId,
          {
            playCount: stats.playCount ?? 0,
            winCount: stats.winCount ?? 0,
            expEarned: stats.expEarned ?? 0,
            rankEarned: stats.rankEarned ?? 0,
          },
        ]),
      ),
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

  async addChatMessage(tableSessionId: string, message: EventGameChatMessage) {
    const key = redis_game_chat_messages(tableSessionId);
    await this.redis.lpush(key, JSON.stringify(message));
    await this.redis.ltrim(key, 0, 99);
    await this.redis.expire(key, 7 * 24 * 60 * 60);
  }

  async getChatMessages(tableSessionId: string) {
    const messages = await this.redis.lrange(
      redis_game_chat_messages(tableSessionId),
      0,
      99,
    );
    return messages
      .map((message) => JSON.parse(message) as EventGameChatMessage)
      .reverse();
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