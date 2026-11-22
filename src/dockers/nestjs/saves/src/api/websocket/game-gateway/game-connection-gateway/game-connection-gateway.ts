import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { GameConnectionGatewayService } from "./game-connection-gateway.service.js";
import { Logger, UseFilters } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { WsAllExceptionsFilter } from "../../filters/WsAllExceptionsFilter.js";

@UseFilters(WsAllExceptionsFilter)
@WebSocketGateway({
  transports: ['websocket'],
  namespace: "/game"
})
export class GameConnectionGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  private readonly logger = new Logger(GameConnectionGateway.name);

  @WebSocketServer()
  private server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly gameConnectionGatewayService: GameConnectionGatewayService,
  ) {

  }

  afterInit(server: Server) {
    this.gameConnectionGatewayService.setServer(server);

    server.use(async (client: Socket, next) => {
      try {
        const authHeader = client.handshake.headers?.authorization;
        const bearerToken = authHeader?.startsWith('Bearer ')
          ? authHeader.split(' ')[1]
          : undefined;

        const accessToken = client.handshake.auth?.accessToken || bearerToken;
        if (!accessToken) {
          this.logger.debug(`client ${client.id}: Auth failed`);
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

    this.logger.log("GameConnectionGateway Initialized");
  }

  async handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
    this.logger.log(`Client authenticated: ${client.id} (User ID: ${client.data.user})`);

    await this.gameConnectionGatewayService.addClientId(client.id, client.data.user);

    this.logger.debug(`client User ID: ${client.data.user} joined the GAME user private room`);
  }

  async handleDisconnect(client: Socket) {
    await this.gameConnectionGatewayService.removeClientId(client.id, client.data.user);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

}