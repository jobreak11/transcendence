import { Injectable, Logger } from "@nestjs/common";
import { Server } from "socket.io";

@Injectable()
export class GameConnectionGatewayService {

  private readonly logger = new Logger(GameConnectionGatewayService.name);
  private server: Server | null = null;

  constructor() {

  }

  setServer(server: Server) {
    this.server = server;
  }

}