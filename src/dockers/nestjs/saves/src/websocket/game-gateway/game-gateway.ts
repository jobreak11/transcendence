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
import { event_game_players_loaded, event_game_start } from "./events/game.event.js";
import { room_game_specific_room } from "./rooms/game.room.js";
import { event_game_poker_action, event_game_poker_sync } from "./events/poker.event.js";
import { WsAllExceptionsFilter } from "../filters/WsAllExceptionsFilter.js";

@UseFilters(WsAllExceptionsFilter)
@WebSocketGateway({
  transports: ['websocket'],
  namespace: '/game'
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  private readonly logger = new Logger(GameGateway.name);
  private readonly loadedPlayersByTable = new Map<string, Set<string>>();
  private readonly scheduledFirstHands = new Set<string>();

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

  @SubscribeMessage(event_game_players_loaded.to_server())
  async handlePlayerLoaded(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsZodValidationPipe(startHandSchema))
    body: StartHandDto,
  ) {
    const playerIds = await this.lobbyRedisService.getPlayerMemberList(
      body.tableSessionId,
    );
    const loadedPlayers = this.loadedPlayersByTable.get(body.tableSessionId)
      ?? new Set<string>();

    if (playerIds.includes(client.data.user)) {
      loadedPlayers.add(client.data.user);
      this.loadedPlayersByTable.set(body.tableSessionId, loadedPlayers);
    }

    const allPlayersLoaded = playerIds.length >= 2
      && playerIds.every((playerId) => loadedPlayers.has(playerId));
    const shouldAutoStartFirstHand = allPlayersLoaded
      && await this.gameGatewayService.isFirstHand(body.tableSessionId);
    const response = {
      tableSessionId: body.tableSessionId,
      readyCount: playerIds.filter((playerId) => loadedPlayers.has(playerId)).length,
      playerCount: playerIds.length,
      allPlayersLoaded,
      shouldAutoStartFirstHand,
    };

    if (playerIds.includes(client.data.user)) {
      this.server
        .to(room_game_specific_room(body.tableSessionId))
        .emit(event_game_players_loaded.to_client(), response);
    }

    if (
      shouldAutoStartFirstHand
      && !this.scheduledFirstHands.has(body.tableSessionId)
    ) {
      this.scheduledFirstHands.add(body.tableSessionId);
      setTimeout(() => {
        void this.startFirstHand(body.tableSessionId);
      }, 5_000);
    }

    return response;
  }

  private async startFirstHand(tableSessionId: string) {
    try {
      if (!await this.gameGatewayService.isFirstHand(tableSessionId)) return;
      await this.gameGatewayService.startHand(tableSessionId);
    } catch (error) {
      this.logger.error(
        'Failed to automatically start the first poker hand',
        error instanceof Error ? error.stack : String(error),
      );
      this.server
        .to(room_game_specific_room(tableSessionId))
        .emit("exception", {
          message: "The server failed to automatically start the first hand.",
        });
    }
  }

  //@SubscribeMessage('poker:start')
  @SubscribeMessage(event_game_start.to_server())
  async handleStartHand(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsZodValidationPipe(startHandSchema))
    body: StartHandDto,
  ) {
    try {

      this.logger.debug({
        message: `received ${event_game_start.to_server()}`
      });

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

  @SubscribeMessage(event_game_poker_sync.to_server())
  async handlePokerSync(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsZodValidationPipe(startHandSchema))
    body: StartHandDto,
  ) {
    const isUserInLobby = await this.userRedisService.isUserInLobby(
      client.data.user,
      body.tableSessionId,
    );
    if (!isUserInLobby) {
      return { ok: false, message: "User must be in lobby" };
    }

    await client.join(room_game_specific_room(body.tableSessionId));
    const hand = await this.gameGatewayService.getCurrentHand(
      body.tableSessionId,
      client.data.user,
    );
    return {
      ok: true,
      state: hand?.state ?? null,
      cards: hand?.cards ?? [],
    };
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