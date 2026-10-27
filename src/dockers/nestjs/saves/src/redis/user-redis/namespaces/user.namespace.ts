
function redis_user_namespace(userId: string) {
    return `user:id:${userId}`
}

// sadd
export function redis_user_lobby_list(userId: string) {
    return `${redis_user_namespace(userId)}:game_lobby`
}

// sadd
export function redis_user_game_room_list(userId:string) {
    return `${redis_user_namespace(userId)}:game_room`
}

//// set get
//export function redis_user_is_online(userId: string) {
//  return `${redis_user_namespace(userId)}:is_online`
//}

// use zadd
export function redis_user_main_client_socket_list(userId: string) {
  return `${redis_user_namespace(userId)}:client_socket_list`
}

// use zadd
export function redis_user_game_client_socket_list(userId: string) {
  return `${redis_user_namespace(userId)}:client_socket_list`
}

