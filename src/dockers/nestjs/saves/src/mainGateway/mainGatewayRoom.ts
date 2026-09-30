
export function mainGatewayPrivateUserRoom(userId: string): string {
  return `main_gateway_private_room_user_${userId}`;
}

export function mainGatewayChatRoom(chatRoomId: string): string {
  return `main_gateway_chat_room_${chatRoomId}`;
}