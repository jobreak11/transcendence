import { Logger } from "@nestjs/common";
import { isConstructor } from "@nestjs/common/internal";
import { JwtService } from "@nestjs/jwt";
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { room_main_private_user } from "../rooms/user.room.js";
import { ConnectionGatewayService } from "./connection-gateway.service.js";


@WebSocketGateway({
  transports: ['polling', 'websocket'],
  namespace: '/'
})
export class ConnectionGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect{

  private readonly logger = new Logger(ConnectionGateway.name);

  // optional though
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly connectionGatewayService: ConnectionGatewayService
  ) {
  }

  afterInit(server: Server) {
    this.connectionGatewayService.setServer(server);

    server.use(async (client: Socket, next) => {
      try {
        const authHeader = client.handshake.headers?.authorization;
        const bearerToken = authHeader?.startsWith('Bearer ')
          ? authHeader.split(' ')[1]
          : undefined;

        const accessToken = client.handshake.auth?.accessToken || bearerToken;
        if (!accessToken) {
          return next(new Error('accessToken is required'));
        }

        const payload = await this.jwtService.verifyAsync(accessToken);

        client.data.user = payload.sub;
        next();
      }
      catch {
        next(new Error("Unauthorized"));
      }
    });

    this.logger.log('Websocket main Connection gateway initialized');
  }

  async handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
    this.logger.log(`Client authenticated: ${client.id} (User ID: ${client.data.user})`);
    // client need to join thier own room for all notification that would have notify here

    // payload sub is the actual user id extracted from the jwtService
    await this.connectionGatewayService.addClientId(client.id, client.data.user);
    this.logger.debug(`client User ID: ${client.data.user} joined the main user private room`);
  }

  async handleDisconnect(client: Socket) {
    await this.connectionGatewayService.removeClientId(client.id, client.data.user);
    this.logger.log(`Client disconnected: ${client.id}`);
  }
  
}