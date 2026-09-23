import type { JSONType } from "zod";
import { MainGatewayPrivateRequestCommand } from "./createMainGatewayPrivateRequestZod.dto.js";
import { ApiProperty } from "@nestjs/swagger";
import { ChatRoomType } from "../../drizzle/schema/chat_rooms.schema.js";



export class CreateMainGatewayPrivateGetAllChatRoomResponseDto {
  responseCommand: MainGatewayPrivateRequestCommand.GET_AVAILABLE_CHAT_ROOM;
  status: "true" | "false" | "error"
  responseData: {
    roomId: string;
    roomName: string | null;
    type: ChatRoomType;
  }[] | {
    errorStatus: number;
    message?: string;
  }
}