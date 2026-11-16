import { Inject, UseFilters } from "@nestjs/common";
import {
  ConnectedSocket,
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

const RANKED_QUEUE_KEY = "ranked:matchmaking:queue";
const MATCH_SIZE = 4;

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

@UseFilters(WsAllExceptionsFilter)
@WebSocketGateway({
  transports: ["websocket"],
  namespace: "/",
})
export class MatchmakingGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
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
}
