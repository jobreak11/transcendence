
function redis_lobby_namespace(roomPinId: string) {
    return `lobby:${roomPinId}`
}

function redis_lobby_global_detals_name_space() {
    return `lobby:global_details:`
}

// user sadd scard sismember smemebers
export function redis_lobby_global_details_lobby_lists() {
    return `${redis_lobby_global_detals_name_space()}`
}

export function redis_lobby_all_keys(lobbyPinId: string): string[] {
  return [
    redis_lobby_general_settings(lobbyPinId),
    redis_lobby_game_settings(lobbyPinId),
    redis_lobby_player_member_list(lobbyPinId),
    redis_lobby_spectator_member_list(lobbyPinId),
    redis_lobby_player_ready_list(lobbyPinId),
  ]
}
// use hset hget
export function redis_lobby_general_settings(lobbyPinId: string) {
    return `${redis_lobby_namespace(lobbyPinId)}:general_settings`
}

// use hset hget
export function redis_lobby_game_settings(lobbyPinId: string) {
  return `${redis_lobby_namespace(lobbyPinId)}:game_settings`
}

// use zadd
export function redis_lobby_player_member_list(lobbyPinId: string) {
  return `${redis_lobby_namespace(lobbyPinId)}:player_member_list`
}

// use zadd
export function redis_lobby_spectator_member_list(lobbyPinId: string) {
  return `${redis_lobby_namespace(lobbyPinId)}:spectator_member_list`
}

// use sadd 
export function redis_lobby_player_ready_list(lobbyPinId: string) {
  return `${redis_lobby_namespace(lobbyPinId)}:ready_list`
}
