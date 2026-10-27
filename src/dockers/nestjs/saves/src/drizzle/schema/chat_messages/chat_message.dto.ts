import z from "zod";
import { ApiProperty } from "@nestjs/swagger";
import { chatMessagesDatabaseSchema, ChatMessageType } from "./chat_messages.schema.js";

type ChatMessageDatabase = z.infer<typeof chatMessagesDatabaseSchema.select>

export class ChatMessageDatabaseDto implements ChatMessageDatabase {

  @ApiProperty({
    example: "01a105d0-bf8f-758a-a1ab-cf9098fded20",
    description: "the uuid the chat message",
  })
  id: string;

  @ApiProperty({
    description: "the chat room id that this message belongs to",
    example: "01a105d0-bf8f-758a-a1ab-cf9098fded20",
  })
  chatRoomId: string;

  @ApiProperty({
    description: "the user id that send this message. Can be empty if it is system message.",
    example: "01a105d0-bf8f-758a-a1ab-cf9098fded20",
  })
  userId: string | null;

  @ApiProperty({
    description: "the chat message type to fast check whether it is USER message or SYSTEM message",
    enum: ChatMessageType,
    example: ChatMessageType.USER_MESSAGE
  })
  type: ChatMessageType;

  @ApiProperty({
    description: "the message",
    example: "hello world. my name is pop siam."
  })
  messageText: string;

  @ApiProperty({
    description: "the time this message was created"
  })
  createdAt: Date;
}