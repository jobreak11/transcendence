
function redis_user_namespace(userId: string) {
    return `user:id:${userId}`
}

export function redis_user_game_lobby(userId: string) {
    return `${redis_user_namespace(userId)}:game_lobby`
}