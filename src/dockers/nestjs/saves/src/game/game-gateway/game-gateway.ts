import { Logger } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { GameGatewayService } from "./game-gateway.service.js";

@WebSocketGateway({
  transports: ['websocket']
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect{

  private readonly logger = new Logger(GameGateway.name);

  constructor(
    private readonly gameGatewayService: GameGatewayService
  ) {

  }

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    this.gameGatewayService.setServer(server);
  }

  handleConnection(client: Socket) {
    
  }

  async handleDisconnect(client: Socket) {
    
  }

  
}