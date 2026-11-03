import { Inject, Logger, UseFilters } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { GameGatewayService } from "./game-gameway.service.js";
import { WsZodValidationPipe } from "../pipes/wsZodValidationPipe.js";
import { actionSchema, type PokerActionDto, startHandSchema, type StartHandDto } from "./dtos/poker-action.dto.js";
import { LobbyRedisService } from "../../redis/lobby-redis/lobby-redis.service.js";
import { UserRedisService } from "../../redis/user-redis/user-redis.service.js";
import { Module } from "@nestjs/core/internal";
import { ModuleRef } from "@nestjs/core";
import { event_game_start } from "./events/game.event.js";
import { room_game_specific_room } from "./rooms/game.room.js";
import { event_game_poker_action } from "./events/poker.event.js";
import { WsAllExceptionsFilter } from "../filters/WsAllExceptionsFilter.js";

@UseFilters(WsAllExceptionsFilter)
@WebSocketGateway({
  transports: ['websocket'],
  namespace: '/game'
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  private readonly logger = new Logger(GameGateway.name);

  @WebSocketServer()
  private server: Server;

  private lobbyRedisService!: LobbyRedisService;

  constructor(
    private readonly gameGatewayService: GameGatewayService ,
    private readonly userRedisService: UserRedisService,
    private readonly moduleRef: ModuleRef,
  ) {

  }

  afterInit(server: Server) {
    this.gameGatewayService.setServer(server);

    this.lobbyRedisService = this.moduleRef.get(LobbyRedisService, {
      strict: false
    });
  }

  async handleConnection(client: Socket) {
    const gameRoomList = await this.userRedisService.getUserGameRoomList(client.data.user)

    const allRoomNames = gameRoomList.map((gameRoomId) => {
      return room_game_specific_room(gameRoomId);
    })

    client.join(allRoomNames);

  }

  handleDisconnect(client: Socket) {
    
  }

  //@SubscribeMessage('poker:start')
  @SubscribeMessage(event_game_start.to_server())
  async handleStartHand(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsZodValidationPipe(startHandSchema))
    body: StartHandDto,
  ) {
    try {

      const [lobbyData, isUserInLobby] = await Promise.all([
        this.lobbyRedisService.getLobbyFull(body.tableSessionId),
        this.userRedisService.isUserInLobby(client.data.user, body.tableSessionId)
      ])

      if (isUserInLobby === false) {
        throw new WsException("user must be in lobby");
      }

      if (lobbyData.details.hostUserId !== client.data.user) {
        throw new WsException("user must be the host");
      }

      const state = await this.gameGatewayService.startHand(
        body.tableSessionId,
        //client.data.user,
      );
      return { ok: true, state };
    } catch (error) {
      if (error instanceof WsException) {
        return { ok: false, message: error.message };
      }
      this.logger.error(
        'Failed to start poker hand',
        error instanceof Error ? error.stack : String(error),
      );
      return { ok: false, message: 'The server failed to start the hand.' };
    }
  }

  @SubscribeMessage(event_game_poker_action.to_server())
  async handleAction(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsZodValidationPipe(actionSchema))
    action: PokerActionDto,
  ) {
    await this.gameGatewayService.playerTurn({
      playerId: client.data.user,
      tableSessionId: action.tableSessionId,
      actionType: action.actionType,
      amount: action.amount,
    });
  }

}