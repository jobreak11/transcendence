import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Public } from "../auth/decorators/public.decorators.js";
import { Server } from 'socket.io'
import { OnModuleInit } from "@nestjs/common";

@Public()
@WebSocketGateway({
  cors: {
    origin: '*',
  }
})
export class MyGateway implements OnModuleInit {

  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log(socket.id);
      console.log('Connected');
    })
  }

  @SubscribeMessage('newMessage')
  onNewMessage(@MessageBody() body: any) {
    console.log(body);
    
  }
}