import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Public } from "../auth/decorators/public.decorators.js";
import { Server, Socket } from 'socket.io'
import { OnModuleInit } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service.js";

@WebSocketGateway({
  transports: ['websocket'],
})
export class MyGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService
  ) {}

  afterInit(server: Server) {
    console.log('Websocket Gateway Initialized');
  }


  async handleConnection(client: Socket) {

    console.log(`Client connected: ${client.id}`);
    try {
      const authHeader = client.handshake.headers?.authorization;
      const bearerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : undefined;

      const accessToken = client.handshake.auth?.accessToken || bearerToken;

      if (!accessToken) {
        console.warn(`Connection rejected (missing accessToken): ${client.id}`);
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync(accessToken);

      client.data.user = payload;

      console.log(`Client authenticated: ${client.id} (User ID: ${payload.sub})`);
    } catch (error) {
      console.warn(`Connection rejected (Invalid token): ${client.id}`, error);
      client.disconnect(true);
    }
    
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('newMessage')
  async onNewMessage(@MessageBody() body: any,
  @ConnectedSocket() client: Socket
) {
    console.log(
      {
        realUserId: client.data.user
      }
    )
    this.server.emit('onMessage', {
      senderId: (await this.userService.findOne(client.data.user.sub))?.displayName ?? 'Default Name',
      content: body,
      timestamp: new Date().toISOString()
    });
    console.log({
      newMessage: "message from client",
      body: body
    });
  }
}