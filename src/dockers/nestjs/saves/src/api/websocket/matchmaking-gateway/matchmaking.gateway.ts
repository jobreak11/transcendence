import { Inject, Logger, UseFilters } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import { randomUUID } from "node:crypto";
import { Server, Socket } from "socket.io";
import { REDIS_CLIENT, type RedisClient } from "../../../infrastructure/redis/redis.provider.js";
import { WsAllExceptionsFilter } from "../filters/WsAllExceptionsFilter.js";
import { room_main_private_user } from "../main-gateway/rooms/user.room.js";
import { WsZodValidationPipe } from "../pipes/wsZodValidationPipe.js";
import { LobbyService } from "../../../modules/lobby/lobby.service.js";
import z from "zod";

const RANKED_QUEUE_KEY = "ranked:matchmaking:queue";
const MATCH_SIZE = 4;
const MATCH_TTL_SECONDS = 300;

const acceptMatchSchema = z.strictObject({
  matchId: z.uuid(),
});

const joinQueueScript = `
  local queueKey = KEYS[1]
  local userId = ARGV[1]
  local now = tonumber(ARGV[2])

  redis.call('ZADD', queueKey, 'NX', now, userId)

  local players = redis.call('ZRANGE', queueKey, 0, 3)
  if #players == 4 then
    redis.call('ZREM', queueKey, unpack(players))
    return {1, table.concat(players, ',')}
  end

  local position = redis.call('ZRANK', queueKey, userId)
  return {0, position + 1, redis.call('ZCARD', queueKey)}
`;

const acceptMatchScript = `
  local playersKey = KEYS[1]
  local acceptedKey = KEYS[2]
  local statusKey = KEYS[3]
  local userId = ARGV[1]
  local ttl = tonumber(ARGV[2])

  if redis.call('SISMEMBER', playersKey, userId) == 0 then
    return {-1, 0}
  end

  local status = redis.call('GET', statusKey)
  if status == 'FAILED' then
    return {-2, redis.call('SCARD', acceptedKey)}
  elseif status then
    return {2, redis.call('SCARD', acceptedKey)}
  end

  redis.call('SADD', acceptedKey, userId)
  local acceptedCount = redis.call('SCARD', acceptedKey)
  redis.call('EXPIRE', acceptedKey, ttl)

  if acceptedCount < 4 then
    return {0, acceptedCount}
  end

  redis.call('SET', statusKey, 'LAUNCHING', 'EX', ttl, 'NX')
  if redis.call('GET', statusKey) == 'LAUNCHING' then
    return {1, acceptedCount}
  end
  return {2, acceptedCount}
`;

@UseFilters(WsAllExceptionsFilter)
@WebSocketGateway({
  transports: ['websocket'],
  namespace: '/',
  cors: {
    origin: [
    `https://${process.env.TRANSCENDENCE_DOMAIN_NAME ?? "localhost"}`,
    `https://${process.env.TRANSCENDENCE_DOMAIN_NAME ?? "localhost"}:${process.env.NGINX_BIND_PORT ?? "4333"}`,
    `https://${process.env.TRANSCENDENCE_LOCAL_IP_ADDRESS ?? "192.168.1.1"}.sslip.io:${process.env.NGINX_BIND_PORT ?? "4333"}`
    ]
  }
})
export class MatchmakingGateway implements OnGatewayDisconnect {
  private readonly logger = new Logger(MatchmakingGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
    private readonly lobbyService: LobbyService,
  ) {}

  @SubscribeMessage("ranked:join")
  async joinQueue(@ConnectedSocket() client: Socket) {
    const userId = this.getUserId(client);
    await client.join(room_main_private_user(userId));

    const result = await this.redis.eval(
      joinQueueScript,
      1,
      RANKED_QUEUE_KEY,
      userId,
      Date.now(),
    );

    if (!Array.isArray(result)) {
      throw new Error("The ranked queue returned an invalid response.");
    }

    const status = Number(result[0]);
    if (status === 1 && typeof result[1] === "string") {
      const players = result[1].split(",");
      if (players.length !== MATCH_SIZE || players.some((playerId) => !playerId)) {
        throw new Error("The ranked queue returned an invalid match.");
      }

      const matchId = randomUUID();
      const playersKey = this.matchPlayersKey(matchId);
      await this.redis.sadd(playersKey, ...players);
      await this.redis.expire(playersKey, MATCH_TTL_SECONDS);

      for (const playerId of players) {
        this.server.to(room_main_private_user(playerId)).emit("ranked:match-found", {
          matchId,
          playerCount: MATCH_SIZE,
        });
      }

      return { status: "matched" as const };
    }

    const position = Number(result[1]);
    const playersWaiting = Number(result[2]);
    if (
      status !== 0
      || result.length !== 3
      || !Number.isInteger(position)
      || !Number.isInteger(playersWaiting)
      || position < 1
      || playersWaiting < 1
      || playersWaiting >= MATCH_SIZE
    ) {
      throw new Error("The ranked queue returned an invalid response.");
    }

    return { status: "waiting" as const, position, playersWaiting, playersNeeded: MATCH_SIZE };
  }

  @SubscribeMessage("ranked:accept")
  async acceptMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsZodValidationPipe(acceptMatchSchema))
    body: z.infer<typeof acceptMatchSchema>,
  ) {
    const userId = this.getUserId(client);
    const result = await this.redis.eval(
      acceptMatchScript,
      3,
      this.matchPlayersKey(body.matchId),
      this.matchAcceptedKey(body.matchId),
      this.matchStatusKey(body.matchId),
      userId,
      MATCH_TTL_SECONDS,
    );

    if (
      !Array.isArray(result)
      || result.length !== 2
      || !Number.isInteger(Number(result[0]))
      || !Number.isInteger(Number(result[1]))
    ) {
      throw new Error("The ranked match returned an invalid acceptance response.");
    }

    const status = Number(result[0]);
    const acceptedCount = Number(result[1]);
    if (status === -1) {
      throw new WsException("You are not a player in this ranked match.");
    }
    if (status === -2) {
      return { status: "failed" as const, acceptedCount };
    }

    if (status === 1) {
      const players = await this.redis.smembers(this.matchPlayersKey(body.matchId));
      try {
        if (players.length !== MATCH_SIZE) {
          throw new Error("The ranked match no longer has four players.");
        }

        const game = await this.lobbyService.createRankedGame(players);
        const event = {
          matchId: body.matchId,
          ...game,
        };
        await this.redis.set(this.matchStatusKey(body.matchId), "READY", "EX", MATCH_TTL_SECONDS);
        for (const playerId of players) {
          this.server
            .to(room_main_private_user(playerId))
            .emit("ranked:game-ready", event);
        }
        return { status: "ready" as const, acceptedCount };
      } catch (error) {
        this.logger.error(
          "Failed to create a ranked game",
          error instanceof Error ? error.stack : String(error),
        );
        await this.redis.set(this.matchStatusKey(body.matchId), "FAILED", "EX", MATCH_TTL_SECONDS);
        for (const playerId of players) {
          this.server
            .to(room_main_private_user(playerId))
            .emit("ranked:match-failed", { matchId: body.matchId });
        }
        return { status: "failed" as const };
      }
    }

    return {
      status: status === 2 ? "launching" as const : "accepted" as const,
      acceptedCount,
    };
  }

  @SubscribeMessage("ranked:cancel")
  async cancelQueue(@ConnectedSocket() client: Socket) {
    const userId = this.getUserId(client);
    const removed = await this.redis.zrem(RANKED_QUEUE_KEY, userId);

    return {
      status: removed === 1 ? "cancelled" as const : "not-waiting" as const,
    };
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.user;
    if (typeof userId !== "string") return;

    const otherSockets = await this.server
      .in(room_main_private_user(userId))
      .fetchSockets();
    if (otherSockets.length === 0) {
      await this.redis.zrem(RANKED_QUEUE_KEY, userId);
    }
  }

  private getUserId(client: Socket): string {
    const userId = client.data.user;
    if (typeof userId !== "string" || userId.length === 0) {
      throw new WsException("You must be authenticated to join ranked matchmaking.");
    }
    return userId;
  }

  private matchPlayersKey(matchId: string) {
    return `ranked:matchmaking:match:${matchId}:players`;
  }

  private matchAcceptedKey(matchId: string) {
    return `ranked:matchmaking:match:${matchId}:accepted`;
  }

  private matchStatusKey(matchId: string) {
    return `ranked:matchmaking:match:${matchId}:status`;
  }
}
