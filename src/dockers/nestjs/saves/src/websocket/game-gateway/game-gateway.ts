import { Logger } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { GameGatewayService } from "./game-gameway.service.js";

@WebSocketGateway({
  transports: ['websocket'],
  namespace: '/game'
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  private readonly logger = new Logger(GameGateway.name);

  @WebSocketServer()
  private server: Server;

  constructor(
    private readonly gameGatewayService: GameGatewayService 
  ) {

  }

  afterInit(server: Server) {
    this.gameGatewayService.setServer(server);
  }

  handleConnection(client: any, ...args: any[]) {
    
  }

  handleDisconnect(client: any, reason?: string) {
    
  }

}