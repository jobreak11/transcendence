import { Logger, UseFilters, UseGuards } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { WsAllExceptionsFilter } from "../../filters/WsAllExceptionsFilter.js";
import { event_main_lobby_user_ready } from "../events/lobby.event.js";
import { LobbyGatewayService } from "./lobby-gateway.service.js";
import { WsZodValidationPipe } from "../../pipes/wsZodValidationPipe.js";
import type { UserReadyToServerDto } from "./dtos/user-ready.dto.js";
import { UserReadyToServerSchema } from "./dtos/user-ready.dto.js";
import { UserRedisService } from "../../../redis/user-redis/user-redis.service.js";
import { room_main_lobby_specific } from "../rooms/lobby.room.js";


@UseFilters(WsAllExceptionsFilter)
@WebSocketGateway({
  transports: ['websocket'],
  namespace: '/'
})
export class LobbyGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect{

  private readonly logger = new Logger(LobbyGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly lobbyGatewayService: LobbyGatewayService,
    private readonly userRedisService: UserRedisService
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
  userReady(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsZodValidationPipe(UserReadyToServerSchema)) body: UserReadyToServerDto
  ) {

    this.lobbyGatewayService.userReady(client.data.user, body.lobbyPinId);

  }

}