import { Logger, UseFilters, UseGuards } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { MainGatewayService } from "./main-gateway.service.js";
import { WsAllExceptionsFilter } from "../filters/WsAllExceptionsFilter.js";
import { WsThrottlerGuard } from "../guards/ws-throttler.guard.js";
import { Throttle } from "@nestjs/throttler";

@UseFilters(WsAllExceptionsFilter)
@WebSocketGateway({
  transports: ['websocket'],
  namespace: '/',
  cors: {
    origin: [
    `https://${process.env.TRANSCENDENCE_DOMAIN_NAME ?? "localhost"}`,
    `https://${process.env.TRANSCENDENCE_DOMAIN_NAME ?? "localhost"}:${process.env.NGINX_BIND_PORT ?? "4333"}`,
    `https://${process.env.TRANSCENDENCE_LOCAL_IP_ADDRESS ?? "192.168.1.1"}.sslip.io:${process.env.NGINX_BIND_PORT ?? "4333"}`
    ]
  }
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