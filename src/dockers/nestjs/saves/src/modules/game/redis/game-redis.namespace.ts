function redis_game_namespace() {
  return `game:`
}

// sadd
// just set of every game room
export function redis_game_all_rooms() {
  return `${redis_game_namespace()}:all_rooms`
}

export function redis_game_table(gameRoomId: string) {
  return `${redis_game_namespace()}:table:${gameRoomId}`
}

// the hand id
// use normal get set
export function redis_game_table_hand(gameRoomId: string) {
  return `${redis_game_table(gameRoomId)}:hand`
}

// normal get set
export function redis_game_table_match_progress(gameRoomId: string) {
  return `${redis_game_table(gameRoomId)}:match_progress`
}

export function redis_game_table_completed_match(gameRoomId: string) {
  return `${redis_game_table(gameRoomId)}:completed_match`
}

// use hget hset
export function redis_game_table_stack(gameRoomId: string) {
  return `${redis_game_table(gameRoomId)}:stacks`
}

export function redis_game_table_button(gameRoomId: string) {
  return `${redis_game_table(gameRoomId)}:button`
}

export function redis_game_table_hand_lock(gameRoomId: string) {
  return `${redis_game_table_hand(gameRoomId)}:lock`
}

export function redis_game_table_scheduled_start(gameRoomId: string) {
  return `${redis_game_table(gameRoomId)}:scheduled_start`
}



