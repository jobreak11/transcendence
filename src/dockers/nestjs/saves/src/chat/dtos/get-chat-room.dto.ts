import { OmitType } from "@nestjs/swagger";
import { ChatRoomDto } from "../../drizzle/schema/chat_rooms/chat_room.dto.js";
import { ChatRoomCreateDto } from "./chat-room-create.dto.js";


export class GetChatRoomDto extends OmitType(ChatRoomCreateDto, ['createdByUserId'] as const) {

}