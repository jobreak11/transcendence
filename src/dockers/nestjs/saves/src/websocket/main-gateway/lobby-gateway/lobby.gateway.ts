import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";


@WebSocketGateway({
  transports: ['websocket'],
  namespace: '/'
})
export class LobbyGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect{

  @WebSocketServer()
  server: Server;

  constructor(
    
  ) {

  }

  afterInit(server: Server) { 
    this.se
    
  }

}