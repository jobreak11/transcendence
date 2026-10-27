import { Inject, Injectable, Logger } from "@nestjs/common";
import { Server } from "socket.io";


@Injectable()
export class MainGatewayService {

  private readonly logger = new Logger(MainGatewayService.name);

  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

}