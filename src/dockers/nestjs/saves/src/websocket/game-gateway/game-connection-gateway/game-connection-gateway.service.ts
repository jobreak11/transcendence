import { Injectable, Logger } from "@nestjs/common";
import { Server } from "socket.io";
import { UserRedisService } from "../../../redis/user-redis/user-redis.service.js";
import { room_main_private_user } from "../../main-gateway/rooms/user.room.js";
import { room_game_private_user } from "../rooms/user.room.js";

@Injectable()
export class GameConnectionGatewayService {

  private readonly logger = new Logger(GameConnectionGatewayService.name);
  private server: Server | null = null;

  constructor(
    private readonly userRedisService: UserRedisService,
  ) {

  }

  setServer(server: Server) {
    this.server = server;
  }

  async addClientId(clientId: string, userId: string) {

    const res = await this.userRedisService.addGameClientSocketList(userId, clientId);

    if (res) {
      this.server?.in(res[0]).socketsLeave(room_game_private_user(userId));
      this.server?.in(res[0]).disconnectSockets(true);
      this.logger.log(`connection dropped: Client id maxed out per user ${userId}: clientId to remove: ${res[0]}`)
      await this.userRedisService.removeGameClientSocket(userId, res[0]);

    }

    this.server?.in(clientId).socketsJoin(room_game_private_user(userId));
    return ;
  }

  removeClientId(clientId: string, userId: string) {
    this.server?.in(clientId).socketsLeave(room_game_private_user(userId));
    return this.userRedisService.removeGameClientSocket(userId, clientId);
  }

}