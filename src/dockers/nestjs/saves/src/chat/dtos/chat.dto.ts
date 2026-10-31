import { z } from "zod"
import { ChatRoomVisibilityType } from "../../drizzle/schema/chat_rooms/chat_rooms.schema.js";
import { ChatRoomMemberRole } from "../../drizzle/schema/chat_room_members/chat_room_members.schema.js";
import { ApiProperty } from "@nestjs/swagger";
import { ChatRoomMemberDto } from "../../drizzle/schema/chat_room_members/chat_room_member.dto.js";

export const CreateChatRoomSchema = z.object({
  roomName: z.string().max(100).optional(),
  type: z.enum([ ChatRoomVisibilityType.PRIVATE, ChatRoomVisibilityType.PUBLIC]).default(ChatRoomVisibilityType.PRIVATE),
})

type CreateChatRoomZodDtoBase = z.infer<typeof CreateChatRoomSchema>;

export class CreateChatRoomZodDto implements CreateChatRoomZodDtoBase {

  @ApiProperty({
    description: "chat room type",
    enum: [ChatRoomVisibilityType.PUBLIC, ChatRoomVisibilityType.PRIVATE],
    example: ChatRoomVisibilityType.PRIVATE
  })
  type: ChatRoomVisibilityType.PUBLIC | ChatRoomVisibilityType.PRIVATE;

  @ApiProperty({
    description: "the name of the chat room",
    example: "aftermatch meeting chat room"
  })
  roomName?: string | undefined;
}

export const InviteUserToChatRoomSchema = z.object({
  chatRoomId: z.uuid(),
  targetUserId: z.uuid(),
  role: z.enum([ChatRoomMemberRole.MEMBER, ChatRoomMemberRole.SPECTATOR]).default(ChatRoomMemberRole.MEMBER)
});

type InviteUserToChatRoomZodDtoBase = z.infer<typeof InviteUserToChatRoomSchema>;

export class InviteUserToChatRoomZodDto implements InviteUserToChatRoomZodDtoBase {

  @ApiProperty({
    description: "the chat room id"
  })
  chatRoomId: string;

  @ApiProperty({
    description: "the target user id to join the chat room"
  })
  targetUserId: string;

  @ApiProperty({
    description: "the role to invite to the chat room",
    enum: [ChatRoomMemberRole.MEMBER, ChatRoomMemberRole.SPECTATOR],
    default: ChatRoomMemberRole.MEMBER
  })
  role: ChatRoomMemberRole.MEMBER | ChatRoomMemberRole.SPECTATOR;
}

export const KickUserChatRoomSchema = z.object({
  chatRoomId: z.uuid(),
  targetUserId: z.uuid()
});

type KickUserChatRoomZodDtoBase = z.infer<typeof KickUserChatRoomSchema>;

export class KickUserChatRoomZodDto implements KickUserChatRoomZodDtoBase {
  @ApiProperty({
    description: "the chat room id"
  })
  chatRoomId: string;

  @ApiProperty({
    description: "the target user to kick from the chat room"
  })
  targetUserId: string;
}
