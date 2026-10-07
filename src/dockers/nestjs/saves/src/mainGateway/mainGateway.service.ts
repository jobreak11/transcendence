import { Inject, Injectable, Logger } from "@nestjs/common";
import { ChatService } from "../chat/chat.service.js";
import { CreateMainGatewayPrivateGetAllChatRoomResponseDto } from "./dto/createMainGatewayPrivateResponse.dto.js";
import { MainGatewayPrivateRequestCommand } from "./dto/createMainGatewayPrivateRequestZod.dto.js";
import { Server, Socket } from "socket.io";
import { mainGatewayChatRoom } from "./mainGatewayRoom.js";
import { NewChatMessageZodDto, onChatMessageResponse } from "./dto/chatMessageZod.dto.js";
import { WsException } from "@nestjs/websockets";
import { onJoinChatRoomResponse } from "./dto/joinChatRoom.dto.js";
import { REDIS_CLIENT } from "../redis/redis.provider.js";
import type { RedisClient } from "../redis/redis.provider.js";

@Injectable()
export class MainGatewayService {

  private readonly logger = new Logger(MainGatewayService.name);

  constructor(
    private readonly chatService: ChatService,
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient
  ) {

  }

  // use when the websocket boot up
  async redisInitialize() {
    
  }

  async setUserIsOnline(userId: string, isOnline: boolean) {
    if (isOnline === true)  {
      await this.redis.set(`user:id:${userId}:is_online`, "true")
    }
    else {
      await this.redis.del(`user:id:${userId}:is_online`);
    }
  }

  async isUserOnline(userId: string): Promise<boolean> {

    const res = await this.redis.get(`user:id:${userId}:is_online`);

    if (res) {
      return true;
    }
    return false;
  }

  async newChatMessage(senderUserId: string, body: NewChatMessageZodDto): Promise<onChatMessageResponse> {

    // record the message to database through chatService
    try {

      const res = await this.chatService.writeRoomMessage(senderUserId, body.chatRoomId, body.message);
      return {
        senderUserId: res.userId,
        chatRoomId: res.chatRoomId,
        message: res.messageText,
        type: res.type,
        createdAt: res.createdAt
      }
    }
    catch (err) {
        throw new WsException("Error Occurred please try again later");
    }
  }

  // let the user join the specific chat room in websocket
  async newjoinChatRoom(client: Socket, chatRoomId: string){
    if (client.rooms.has(mainGatewayChatRoom(chatRoomId))) {

      const formatRes: onJoinChatRoomResponse = {
        status: false,
        message: "This client socket is already join this chat room",
      }

      client.emit("onJoinChatRoom", formatRes);
      return ;
    }
    else {

      // prove that this user have access ftom chat service
      try {
        const res = await this.chatService.isUserInRoom(client.data.user, chatRoomId);

        if (res) {
          await client.join(mainGatewayChatRoom(chatRoomId))
          const formatRes: onJoinChatRoomResponse = {
            status: true,
            message: `Joined the chat room ${mainGatewayChatRoom(chatRoomId)}`
          }
          client.emit("onJoinChatRoom", formatRes);
          return ;
        }

        const formatRes: onJoinChatRoomResponse = {
          status: false,
          message: "the target chat room to join is not exist or this client socket dont have access to this chat room"
        }

        client.emit("onJoinChatRoom", formatRes);
        return ;
      } catch (err) {
        const formatRes: onJoinChatRoomResponse = {
          status: false,
          message: "Error Occurred"
        }

        client.emit("onJoinChatRoom", formatRes);
        return ;
      }
    }
  }

  async privateRequestGetAvailableChatRoom(userId: string) {

      try {
        const allChatRooms = await this.chatService.findAllJoinedChatRoom(userId);

        //const formattedChatRooms = allChatRooms.map((room) => ({
        //  ...room,
        //  createdAt: room.createdAt.toISOString(),
        //  joinedAt: room.joinedAt.toISOString(),
        //}));

        const response: CreateMainGatewayPrivateGetAllChatRoomResponseDto = {
          responseCommand: MainGatewayPrivateRequestCommand.GET_AVAILABLE_CHAT_ROOM,
          status: "true",
          responseData: allChatRooms.map((room) => ({
            roomId: room.id,
            roomName: room.roomName,
            type: room.type
          })),
        }
        return (response);
        //this.server
        //  .to(mainGatewayPrivateUserRoom(client.data.user))
        //  .emit(mainGatewayPrivateUserEvent.response(), response);
      } catch (error: any) {
        const errorResponse: CreateMainGatewayPrivateGetAllChatRoomResponseDto = {
           responseCommand: MainGatewayPrivateRequestCommand.GET_AVAILABLE_CHAT_ROOM,
           status: "error",
           responseData: {
             errorStatus: error?.status ?? 500,
             message: error?.message ?? "Failed to fetch chat rooms",
           },
        };

        //this.server
        //  .to(mainGatewayPrivateUserRoom(client.data.user))
        //  .emit(mainGatewayPrivateUserEvent.response(), errorResponse);
        
        return (errorResponse);
      }
  }
}
