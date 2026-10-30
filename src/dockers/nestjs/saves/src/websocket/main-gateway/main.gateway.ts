import { Logger } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { MainGatewayService } from "./main-gateway.service.js";

@WebSocketGateway({
  transports: ['polling', 'websocket'],
  namespace: '/'
})
export class MainGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  private readonly logger = new Logger(MainGateway.name);

  @WebSocketServer()
  private server: Server;

  constructor (
    private readonly mainGatewayService: MainGatewayService,

  ) {

  }

  afterInit(server: any) {
    
  }

  async handleConnection(client: any) {

  }
  
  handleDisconnect(client: any) {
    
  }

  
}