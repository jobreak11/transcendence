import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameGatewayService } from './game-gateway.service.js';
import { WsZodValidationPipe } from '../../pipes/wsZodValidationPipe.js';
import {
  actionSchema,
  startHandSchema,
  type PokerActionDto,
  type StartHandDto,
} from './dtos/poker-action.dto.js';

@WebSocketGateway({
  transports: ['websocket'],
  namespace: '/',
})
export class PokerGateway implements OnGatewayInit {
  private readonly logger = new Logger(PokerGateway.name);

  constructor(
    private readonly gameGatewayService: GameGatewayService,
  ) {}

  afterInit(server: Server) {
    this.gameGatewayService.setServer(server);
  }

  @SubscribeMessage('poker:start')
  async handleStartHand(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsZodValidationPipe(startHandSchema))
    body: StartHandDto,
  ) {
    try {
      const state = await this.gameGatewayService.startHand(
        body.tableSessionId,
        client.data.user,
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

  @SubscribeMessage('poker:action')
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