import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { ChatGatewayService } from "./chat-gateway.service.js";
import { event_main_chat } from "../events/chat.event.js";
import { Server, Socket } from "socket.io";
import { WsZodValidationPipe } from "../../pipes/wsZodValidationPipe.js";
import { ChatMessageType } from "../../../drizzle/schema/chat_messages/chat_messages.schema.js";
import { ChatMessage } from "./dtos/chat-message.dto.js";

@WebSocketGateway({
  transports: ['websocket'],
  namespace: "/"
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatGatewayService: ChatGatewayService,
  ) {

  }

  afterInit(server: Server) {
    this.chatGatewayService.setServer(server);
    
  }

  handleConnection(client: any, ...args: any[]) {
  }

  handleDisconnect(client: any, reason?: string) {
    
  }

  @SubscribeMessage(event_main_chat.to_server())
  messageFromClient(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsZodValidationPipe(ChatMessage.newMessageFromClientSchema)) body: ChatMessage.NewMessageFromClientZodDto
  ) {
    this.chatGatewayService.newChatMessage({
      messageText: body.messageText,
      chatRoomId: body.chatRoomId,
      type: ChatMessageType.USER_MESSAGE,
      userId: client.data.user

    });

  }

}