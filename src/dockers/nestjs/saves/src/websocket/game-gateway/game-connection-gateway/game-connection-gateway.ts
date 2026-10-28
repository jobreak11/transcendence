import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { GameConnectionGatewayService } from "./game-connection-gateway.service.js";
import { Logger } from "@nestjs/common";

@WebSocketGateway({
  transports: ['websocket'],
  namespace: "/game"
})
export class GameConnectionGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  private readonly logger = new Logger(GameConnectionGateway.name);

  @WebSocketServer()
  private server: Server;

  constructor(
    private readonly gameConnectionGatewayService: GameConnectionGatewayService,
  ) {

  }

  afterInit(server: Server) {
    this.gameConnectionGatewayService.setServer(server);
    this.logger.log("GameConnectionGateway Initialized");
  }

  handleConnection(client: any, ...args: any[]) {
    
  }

  handleDisconnect(client: any, reason?: string) {
    
  }

}