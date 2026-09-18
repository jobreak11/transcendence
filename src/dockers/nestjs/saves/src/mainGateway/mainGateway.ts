import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io'
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service.js";
import { WEBSOCKET_MAINGATEWAY_PRIVATE_USER_SOCKET_ROOM_PREFIX } from "../constant.js";
import { Logger } from "@nestjs/common";

@WebSocketGateway({
  transports: ['websocket'],
})
export class MainGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  private readonly logger = new Logger(MainGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
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

      client.data.user = payload;

      this.logger.log(`Client authenticated: ${client.id} (User ID: ${payload.sub})`);

      // client need to join thier own room for all notification that would have notify here

      // payload sub is the actual user id extracted from the jwtService
      await client.join(`${WEBSOCKET_MAINGATEWAY_PRIVATE_USER_SOCKET_ROOM_PREFIX}${payload.sub}`);
      this.logger.debug(`client User ID: ${payload.sub} joined the main user private room`);
    } catch (error) {
      this.logger.warn(`Connection rejected (Invalid token): ${client.id}`, error);
      client.disconnect(true);
    }

  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('newMessage')
  async onNewMessage(@MessageBody() body: any,
  @ConnectedSocket() client: Socket
) {
    this.logger.log(
      {
        realUserId: client.data.user
      }
    )
    this.server.emit('onMessage', {
      senderId: (await this.userService.findOne(client.data.user.sub))?.displayName ?? 'Default Name',
      content: body,
      timestamp: new Date().toISOString()
    });
    this.logger.log({
      newMessage: "message from client",
      body: body
    });

  }
}