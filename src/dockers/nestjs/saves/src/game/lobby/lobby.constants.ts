
export const LOBBY_ROOM_MAX = 200;

export const LOBBY_REDIS_GLOBAL_DETAILS_LOBBY_LISTS = "lobby:global_details:lobby_lists";

export const lobby_redis_general_settings = (lobbyPinId: string) => {
  return `lobby:${lobbyPinId}:general_settings`
}

export const lobby_redis_game_settings = (lobbyPinId: string) => {
  return `lobby:${lobbyPinId}:game_settings`
}

export const lobby_redis_player_member_list = (lobbyPinId: string) => {
  return `lobby:${lobbyPinId}:player_member_list`
}

export const lobby_redis_spectator_member_list = (lobbyPinId: string) => {
  return `lobby:${lobbyPinId}:spectator_member_list`
}

export const user_game_lobby = (userId: string) => {
  return `user:id:${userId}:game_lobby`
}