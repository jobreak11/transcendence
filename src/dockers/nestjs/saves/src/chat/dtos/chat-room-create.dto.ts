import z from "zod";
import { chatRoomCreateSchema } from "../schemas/chat-room-create.schema.js";
import { ChatRoomDto } from "../../drizzle/schema/chat_rooms/chat_room.dto.js";
import { ApiProperty, OmitType } from "@nestjs/swagger";

export type ChatRoomCreateInputDto = z.input<typeof chatRoomCreateSchema.input>

type ChatRoomCreate = z.infer<typeof chatRoomCreateSchema.full>

export class ChatRoomCreateDto extends OmitType(ChatRoomDto, ['id']) {

  @ApiProperty({
    description: "user that create this room"
  })
  createdByUserId: string | null;

  @ApiProperty({
    description: "whether the chat room stores the temporary chat or persistent on database",
    example: true
  })
  isTemporary: boolean;

}
