
export const LOBBY_ROOM_MAX = 200;

// use sadd scard sismember
export const LOBBY_REDIS_GLOBAL_DETAILS_LOBBY_LISTS = "lobby:global_details:lobby_lists";

// use hset hget
export const lobby_redis_general_settings = (lobbyPinId: string) => {
  return `lobby:${lobbyPinId}:general_settings`
}

// use hset hget
export const lobby_redis_game_settings = (lobbyPinId: string) => {
  return `lobby:${lobbyPinId}:game_settings`
}


// use zadd
export const lobby_redis_player_member_list = (lobbyPinId: string) => {
  return `lobby:${lobbyPinId}:player_member_list`
}

// use zadd
export const lobby_redis_spectator_member_list = (lobbyPinId: string) => {
  return `lobby:${lobbyPinId}:spectator_member_list`
}

// normal get set
export const user_game_lobby = (userId: string) => {
  return `user:id:${userId}:game_lobby`
}