import { ApiProperty } from "@nestjs/swagger";
import { ChatMessageDto } from "./chat-message.dto.js";

class baseAllChatRoomsMessagesDto {
  @ApiProperty({
    description: "that uuid of the chat room",
  })
  chatRoomId: string;

  @ApiProperty({
    description: "list of messages in the chat room",
    type: () => [ChatMessageDto]
  })
  messages: ChatMessageDto[];

}

export type AllChatRoomsMessagesDto = baseAllChatRoomsMessagesDto[];