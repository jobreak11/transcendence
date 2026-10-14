import { z } from 'zod'
import { ChatMessageType } from '../../../../drizzle/schema/chat_messages.schema.js';

export namespace ChatMessage {

  export enum RoomType {
    GLOBAL = "GLOBAL",
    LOBBY = "LOBBY",
    IN_GAME = "IN_GAME",
    SPECIFIC_ROOM = "SPECIFIC_ROOM"
  }

  const baseMessageSchema = z.object({
    roomType: z.enum(RoomType).default(RoomType.GLOBAL),
    messageType: z.enum(ChatMessageType).default(ChatMessageType.SYSTEM_MESSAGE),
    chatRoomId: z.uuid().optional(),
    senderUserId: z.uuid().optional(),
    message: z.string().trim().min(1).max(5000)
  })



  export const newMessageFromClientSchema = baseMessageSchema.omit({
    senderUserId: true,
    messageType: true
  }).refine((data) => {
    if (data.roomType === RoomType.SPECIFIC_ROOM) {
      return data.chatRoomId !== undefined
    }
    return data.chatRoomId === undefined
  })

  export type NewMessageFromClientZodDto = z.infer<typeof newMessageFromClientSchema>;

  export const messageSchema = baseMessageSchema.extend({

  }).superRefine((data, ctx) => {
    if (data.roomType === RoomType.SPECIFIC_ROOM) {
      if (data.chatRoomId === undefined ) {
        ctx.addIssue({
          code: "custom",
          message: "needs chatRoomId to send message to specific room",
          path: ['chatRoomId', 'roomType']
        });
      }
    }
    else {
      if (data.chatRoomId !== undefined ) {
        ctx.addIssue({
          code: "custom",
          message: "this chat room type doesn't have chatRoomId",
          path: ['chatRoomId', 'roomType']
        });
      }
    }

    if (data.messageType === ChatMessageType.USER_MESSAGE) {
      if (data.senderUserId === undefined) {
        ctx.addIssue({
          code: "custom",
          message: "user message needs to attach senderUserId with payload",
          path: ['senderUserId', 'messageType']
        });
      }

    } else {
      if (data.senderUserId !== undefined) {
        ctx.addIssue({
          code: "custom",
          message: "system message doesn't have senderUserId",
          path: ['senderUserId', 'messageType']
        });
      }
    }
  });

  export type MessageZodDto = z.infer<typeof messageSchema>;

  export const responseSchema = baseMessageSchema.required();

  export type ResponseZodDto = z.infer<typeof responseSchema>;

}
