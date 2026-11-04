import { Logger, UseFilters, UseGuards } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { MainGatewayService } from "./main-gateway.service.js";
import { WsAllExceptionsFilter } from "../filters/WsAllExceptionsFilter.js";
import { WsThrottlerGuard } from "../guards/ws-throttler.guard.js";
import { Throttle } from "@nestjs/throttler";

@UseFilters(WsAllExceptionsFilter)
@WebSocketGateway({
  transports: ['polling', 'websocket'],
  namespace: '/'
})
@UseGuards(WsThrottlerGuard)
@Throttle({
  default: {
    limit: 5,
    ttl: 10_000
  }
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