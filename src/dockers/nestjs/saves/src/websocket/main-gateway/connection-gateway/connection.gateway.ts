import { Logger } from "@nestjs/common";
import { isConstructor } from "@nestjs/common/internal";
import { JwtService } from "@nestjs/jwt";
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { room_main_private_user } from "../rooms/user.room.js";
import { ConnectionGatewayService } from "./connection-gateway.service.js";


@WebSocketGateway({
  transports: ['websocket'],
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
    this.logger.log('Websocket main Connection gateway');
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
      await this.connectionGatewayService.addClientId(client.id, client.data.user);
      this.logger.debug(`client User ID: ${payload.sub} joined the main user private room`);
    } catch (error) {
      this.logger.warn(`Connection rejected (Invalid token): ${client.id}`, error);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    await this.connectionGatewayService.removeClientId(client.id, client.data.user);
    this.logger.log(`Client disconnected: ${client.id}`);
  }
  
}