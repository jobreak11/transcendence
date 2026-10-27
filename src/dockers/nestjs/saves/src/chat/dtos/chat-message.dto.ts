import z from "zod";
import { chatMessageSchema } from "../schemas/chat-message.schema.js";
import { OmitType } from "@nestjs/swagger";
import { ChatMessageDatabaseDto } from "../../drizzle/schema/chat_messages/chat_message.dto.js";

export class ChatMessageDto extends OmitType(ChatMessageDatabaseDto, ['id', 'chatRoomId'] as const) {

}

