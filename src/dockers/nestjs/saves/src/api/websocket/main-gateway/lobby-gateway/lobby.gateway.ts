import { Logger, UseFilters, UseGuards } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { WsAllExceptionsFilter } from "../../filters/WsAllExceptionsFilter.js";
import { event_main_lobby_user_ready } from "../events/lobby.event.js";
import { LobbyGatewayService } from "./lobby-gateway.service.js";
import { WsZodValidationPipe } from "../../pipes/wsZodValidationPipe.js";
import type { UserReadyToServerDto } from "./dtos/user-ready.dto.js";
import { UserReadyToServerSchema } from "./dtos/user-ready.dto.js";
import { room_main_lobby_specific } from "../rooms/lobby.room.js";
import { UsersRedisService } from "../../../../modules/user/redis/users-redis.service.js";


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
export class LobbyGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect{

  private readonly logger = new Logger(LobbyGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly lobbyGatewayService: LobbyGatewayService,
    private readonly userRedisService: UsersRedisService
  ) {

  }

  afterInit(server: Server) { 
    this.lobbyGatewayService.setServer(server);
  }

  async handleConnection(client: Socket) {
    const lobbyList = await this.userRedisService.getUserLobbyList(client.data.user);

    const allRoomNames = lobbyList.map((lobbyId) => {
      return room_main_lobby_specific(lobbyId);
    })

    client.join(allRoomNames);
    
  }

  handleDisconnect(client: Socket, reason?: string) {
    
  }

  @SubscribeMessage(event_main_lobby_user_ready.to_server())
  async userReady(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsZodValidationPipe(UserReadyToServerSchema)) body: UserReadyToServerDto
  ) {

    await this.lobbyGatewayService.userReady(client.data.user, body.lobbyPinId);

  }

}