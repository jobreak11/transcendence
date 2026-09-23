
import { z } from 'zod'

export enum MainGatewayPrivateRequestCommand {
  GET_AVAILABLE_CHAT_ROOM = 'GET_AVAILABLE_CHAT_ROOM',
  JOIN_CHAT_ROOM = 'JOIN_CHAT_ROOM'

}

export const createMainGatewayPrivateRequestSchema = z.object({
  requestCommand: z.enum(MainGatewayPrivateRequestCommand),
  commandOptionalField: z.json().optional()
})

export type CreateMainGatewayPrivateRequestZodDto = z.infer<typeof createMainGatewayPrivateRequestSchema>;
