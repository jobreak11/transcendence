import z from "zod";
import { ChatRoomMemberRole, chatRoomMemberSchema } from "./chat_room_members.schema.js";
import { ApiProperty } from "@nestjs/swagger";
import { v7 as uuidv7 } from 'uuid'

type ChatRoomMember = z.infer<typeof chatRoomMemberSchema.select>

export class ChatRoomMemberDto implements ChatRoomMember {

  @ApiProperty({
    description: "user uuid",
    example: uuidv7()
  })
  userId: string;

  @ApiProperty({
    description: "chat room uuid",
    example: uuidv7()
  })
  chatRoomId: string;

  @ApiProperty({
    description: "the date this user has joined"
  })
  joinedAt: Date;

  @ApiProperty({
    description: "user role on this chat room",
    enum: ChatRoomMemberRole,
    example: ChatRoomMemberRole.MEMBER
  })
  role: ChatRoomMemberRole;

}