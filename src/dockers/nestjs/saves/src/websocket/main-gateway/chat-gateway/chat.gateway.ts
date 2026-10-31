import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { ChatGatewayService } from "./chat-gateway.service.js";
import { Server, Socket } from "socket.io";
import { WsZodValidationPipe } from "../../pipes/wsZodValidationPipe.js";
import { ChatMessageType } from "../../../drizzle/schema/chat_messages/chat_messages.schema.js";
import { ChatMessage } from "./dtos/chat-message.dto.js";
import { Logger } from "@nestjs/common";
import { event_main_chat_message } from "../events/chat.event.js";

@WebSocketGateway({
  transports: ['websocket'],
  namespace: "/"
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatGatewayService: ChatGatewayService,
  ) {

  }

  afterInit(server: Server) {
    this.chatGatewayService.setServer(server);
    
    this.logger.log("initialized ChatGateway");
  }

  async handleConnection(client: Socket) {

    // handle connection 
    // chat gateway would auto matically connect this client
    // socket to all available chat room

    await this.chatGatewayService.clientSocketJoinAllChatRoom(client);
    this.logger.debug(`test: ${event_main_chat_message.to_server()}`);
  }

  handleDisconnect(client: any) {
    
  }

  @SubscribeMessage(event_main_chat_message.to_server())
  async messageFromClient(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsZodValidationPipe(ChatMessage.newMessageFromClientSchema)) body: ChatMessage.NewMessageFromClientZodDto
  ) {
    this.logger.debug("message received");

    await this.chatGatewayService.newChatMessage({
      messageText: body.messageText,
      chatRoomId: body.chatRoomId,
      type: ChatMessageType.USER_MESSAGE,
      userId: client.data.user

    });
  }

}