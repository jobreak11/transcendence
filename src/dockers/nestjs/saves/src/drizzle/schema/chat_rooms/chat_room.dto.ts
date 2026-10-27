import z from "zod";
import { chatRoomsSchema, ChatRoomVisibilityType } from "./chat_rooms.schema.js";
import { ApiProperty } from "@nestjs/swagger";

type ChatRoom = z.infer<typeof chatRoomsSchema.select>;

export class ChatRoomDto implements ChatRoom {

  @ApiProperty({
    description: "the uuid of the chat room"

  })
  id: string;

  @ApiProperty({
    description: "the room name",
    example: "yolo room"
  })
  roomName: string | null;

  @ApiProperty({
    description: "room visibility type, PUBLIC would mean anyone could join and private would mean can only invite to the room",
    enum: ChatRoomVisibilityType,
    example: ChatRoomVisibilityType.PRIVATE
  })
  visibilityType: ChatRoomVisibilityType;

  //@ApiProperty({
  //  description: "room visibility type, PUBLIC would mean anyone could join and private would mean can only invite to the room",
  //  enum: ChatRoomMessageStorageType,
  //  example: ChatRoomMessageStorageType.PERSISTENT
  //})
  //storageType: ChatRoomMessageStorageType;

  @ApiProperty({
    description: "the date this chat room was created"
  })
  createdAt: Date;

}