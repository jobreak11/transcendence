
export function redis_chat_namespace() {
  return "chat"
}

function redis_chat_room_namespace(chatRoomId: string) {
  return `${redis_chat_namespace()}:room:${chatRoomId}`
}

function redis_chat_room_member_namespace(chatRoomId: string, userId: string) {
  return `${redis_chat_room_namespace(chatRoomId)}:member_user:${userId}`
}

// 
function redis_chat_user_namespace(userId: string) {
  return `${redis_chat_namespace()}:user:${userId}`

}


// sadd
// redis_chat_user_room_list is for that user to quick look how many chat room they were in

export function redis_chat_room_all_keys(chatRoomId: string): string[] {

// sadd scard
// redis_chat_room_member_details need to remove all in the set then removed

  return [
    redis_chat_room_messages(chatRoomId),
    redis_chat_room_details(chatRoomId),
    redis_chat_room_member_lists(chatRoomId),
    redis_chat_room_spectator_lists(chatRoomId),

  ]
}

// chat room of that user
// use sadd
export function redis_chat_user_room_list(userId: string){
  return `${redis_chat_user_namespace(userId)}:room_lists`
}

// use lpush rpop ltrim
// for temporary chat message won't store the chat forever
export function redis_chat_room_messages(chatRoomId: string) {
  return `${redis_chat_room_namespace(chatRoomId)}:messages`
}

// use hset hget
export function redis_chat_room_details(chatRoomId: string) {
  return `${redis_chat_room_namespace(chatRoomId)}:details`
}

// use zadd to be able to collect timestamp
export function redis_chat_room_member_lists(chatRoomId: string) {
  return `${redis_chat_room_namespace(chatRoomId)}:member_lists`
}
// use zadd to be able to collect timestamp
export function redis_chat_room_spectator_lists(chatRoomId: string) {
  return `${redis_chat_room_namespace(chatRoomId)}:member_lists`
}

// use hset hget
// just details of each member eg role
export function redis_chat_room_member_details(chatRoomId: string, userId: string) {
  return `${redis_chat_room_member_namespace(chatRoomId, userId)}:details`
}

