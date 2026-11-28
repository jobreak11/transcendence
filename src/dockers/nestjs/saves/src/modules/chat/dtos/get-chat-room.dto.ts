import { OmitType } from "@nestjs/swagger";
import { ChatRoomCreateDto } from "./chat-room-create.dto.js";


export class GetChatRoomDto extends OmitType(ChatRoomCreateDto, ['createdByUserId'] as const) {

}