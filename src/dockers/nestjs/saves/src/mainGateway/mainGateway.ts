import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io'
import { JwtService } from "@nestjs/jwt";
import { Logger, UseGuards, UsePipes } from "@nestjs/common";
import { mainGatewayChatRoom, mainGatewayPrivateUserRoom } from "./mainGatewayRoom.js";
import { WsZodValidationPipe } from "./pipes/wsZodValidationPipe.js";
import { newChatMessageSchema } from "./dto/chatMessageZod.dto.js";
import type { NewChatMessageZodDto } from "./dto/chatMessageZod.dto.js";
import { MainGatewayService } from "./mainGateway.service.js";
import { newJoinChatRoomSchema } from "./dto/joinChatRoom.dto.js";
import type { NewJoinChatRoomZodDto } from "./dto/joinChatRoom.dto.js";
import { newPublicChatMessageSchema } from "./dto/publicChatMessageZod.dto.js";
import type { NewPublicChatMessageZodDto, onPublicChatMessageResponse } from "./dto/publicChatMessageZod.dto.js";
import { WsThrottlerGuard } from "./guards/ws-throttler.guard.js";
import { Throttle } from "@nestjs/throttler";

@WebSocketGateway({
  transports: ['websocket'],
})
export class MainGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  private readonly logger = new Logger(MainGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly mainGatewayService: MainGatewayService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Websocket MainGateway Initialized');
  }

  async handleConnection(client: Socket) {

    this.logger.debug(`Client connected: ${client.id}`);
    try {
      const authHeader = client.handshake.headers?.authorization;
      const bearerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : undefined;

      const accessToken = client.handshake.auth?.accessToken || bearerToken;

      if (!accessToken) {
        this.logger.warn(`Connection rejected (missing accessToken): ${client.id}`);
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync(accessToken);

      client.data.user = payload.sub;

      this.logger.log(`Client authenticated: ${client.id} (User ID: ${payload.sub})`);

      // client need to join thier own room for all notification that would have notify here

      // payload sub is the actual user id extracted from the jwtService
      await client.join(mainGatewayPrivateUserRoom(payload.sub));
      await this.mainGatewayService.setUserIsOnline(payload.sub, true);
      this.logger.debug(`client User ID: ${payload.sub} joined the main user private room`);
    } catch (error) {
      this.logger.warn(`Connection rejected (Invalid token): ${client.id}`, error);
      client.disconnect(true);
    }

  }

  async handleDisconnect(client: Socket) {

    await this.mainGatewayService.setUserIsOnline(client.data.user, false);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @UsePipes(new WsZodValidationPipe(newChatMessageSchema))
  @SubscribeMessage('newChatMessage')
  async onNewMessage(@MessageBody() body: NewChatMessageZodDto,
  @ConnectedSocket() client: Socket
  ) {
    this.logger.debug(`Receive newChatMessage From ${client.data.user}`);

    // whether the user have access to that specific chat room ID
    // and also check if user already in the chat room
    if (!client.rooms.has(mainGatewayChatRoom(body.chatRoomId))) {
      throw new WsException("needs to be in the chat room first before sending a message");
    }
    const res = await this.mainGatewayService.newChatMessage(client.data.user, body);
    this.server
      .to(mainGatewayChatRoom(body.chatRoomId))
      .emit("onChatMessage", res);
  }

  // Redis 
  // store message by ttl and the max amount of messages allowed
  //@UseGuards(WsThrottlerGuard)
  //@Throttle({ default: { limit: 3, ttl: 10000 } })
  @UsePipes(new WsZodValidationPipe(newJoinChatRoomSchema))
  @SubscribeMessage('newJoinChatRoom')
  newJoinChatRoom(@ConnectedSocket() client: Socket,
    @MessageBody() body: NewJoinChatRoomZodDto
  ) {
    this.mainGatewayService.newjoinChatRoom(client, body.chatRoomId);
  }


  //@UseGuards(WsThrottlerGuard)
  //@Throttle({ default: { limit: 3, ttl: 10000  } })
  @UsePipes(new WsZodValidationPipe(newPublicChatMessageSchema))
  @SubscribeMessage('newPublicChatMessage')
  newPublicChatMessage(@ConnectedSocket() client: Socket,
    @MessageBody() body: NewPublicChatMessageZodDto
  ) {
    const res: onPublicChatMessageResponse = {
      senderUserId: client.data.user,
      type: "USER",
      message: body.message
    }

    this.server
      .emit('onPublicChatMessage', res);
  }
  
}


