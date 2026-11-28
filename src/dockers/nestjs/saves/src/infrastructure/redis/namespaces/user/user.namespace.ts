
function redis_user_namespace(userId: string) {
    return `user:id:${userId}`
}

// set get
export function redis_user_game_lobby(userId: string) {
    return `${redis_user_namespace(userId)}:game_lobby`
}

export function redis_user_game_room(userId:string) {
    return `${redis_user_namespace(userId)}:game_room`
}

// set get
export function redis_user_is_online(userId: string) {
  return `${redis_user_namespace(userId)}:is_online`
}