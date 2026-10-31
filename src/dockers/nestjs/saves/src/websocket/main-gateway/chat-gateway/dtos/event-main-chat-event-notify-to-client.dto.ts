

export enum EventMainChatEventNodifyStatusType {
  JOIN_CHAT = "JOIN_CHAT", // JOIN_CHAT to tell the client through websocket that new chat room is able to receive message
  LEAVE_CHAT = "LEAVE_CHAT", // LEAVE_CHAT to tell client through websocket that this chat room will is close and user won't receive any
                            // new messages
}

export interface EventMainChatEventNotifyToClientDto {
  notifyStatus: EventMainChatEventNodifyStatusType,
  chatRoomId: string
}
