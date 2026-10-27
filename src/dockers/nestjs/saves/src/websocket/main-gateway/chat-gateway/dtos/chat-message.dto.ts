import { z } from 'zod'
import { chatMessagesDatabaseSchema, ChatMessageType } from '../../../../drizzle/schema/chat_messages/chat_messages.schema.js';

export namespace ChatMessage {

  //const baseMessageSchema = z.object({
  //  //roomType: z.enum(RoomType).default(RoomType.GLOBAL),
  //  //messageType: z.enum(ChatMessageType).default(ChatMessageType.SYSTEM_MESSAGE),
  //  roomType: z.enum(RoomType),
  //  messageType: z.enum(ChatMessageType),
  //  chatRoomId: z.uuid().nullable(),
  //  senderUserId: z.uuid().nullable(),
  //  message: z.string().trim().min(1).max(5000)
  //})

  const baseMessageSchema = z.object({
    ...chatMessagesDatabaseSchema.select.omit({
      id: true
    }).shape,
    chatRoomId: chatMessagesDatabaseSchema.select.shape.chatRoomId.nullable(),
  })

  const insertMessageSchemaBase = z.object({
    ...baseMessageSchema.omit({
      createdAt: true,
    }).shape,
    chatRoomId: baseMessageSchema.shape.chatRoomId.default(null),
    type: baseMessageSchema.shape.type.default(ChatMessageType.SYSTEM_MESSAGE),
    userId: baseMessageSchema.shape.userId.default(null)
  })

  const  insertMessageSchema = z.object({
    ...insertMessageSchemaBase.shape
  }).superRefine((data, ctx) => {

    if (data.type === ChatMessageType.USER_MESSAGE) {
      if (data.userId === null) {
        ctx.addIssue({
          code: "custom",
          message: "user message needs to attach senderUserId with payload",
          path: ['senderUserId', 'messageType']
        });
      }

    } else {
      if (data.userId !== null) {
        ctx.addIssue({
          code: "custom",
          message: "system message doesn't have senderUserId",
          path: ['senderUserId', 'messageType']
        });
      }
    }

  })

  export const newMessageFromClientSchema = z.object({
    ...insertMessageSchemaBase.omit({
      userId: true,
      type: true
    }).shape,
  })

  export type NewMessageInputFromClientZodDto = z.input<typeof newMessageFromClientSchema>;
  export type NewMessageFromClientZodDto = z.infer<typeof newMessageFromClientSchema>;

  export const insertSchema = insertMessageSchema

  export type MessageInsertZodDto = z.input<typeof insertSchema>;

  export const responseSchema = baseMessageSchema.required();

  export type ResponseZodDto = z.infer<typeof responseSchema>;

}
