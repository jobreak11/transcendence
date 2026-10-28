import { Injectable, Logger } from "@nestjs/common";
import { Server } from "socket.io";

@Injectable()
export class GameGatewayService {
  private readonly logger = new Logger(GameGatewayService.name);

  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

}