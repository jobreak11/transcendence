import { Injectable, Logger } from "@nestjs/common";
import { Server } from "socket.io";

@Injectable()
export class LobbyGatewayService {

  private readonly logger = new Logger(LobbyGatewayService.name);
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  constructor(

  ) {

  }

}