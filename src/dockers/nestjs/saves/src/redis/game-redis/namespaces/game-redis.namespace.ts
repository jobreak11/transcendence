
function redis_game_namespace() {
  return `game:`
}

// sadd
// just set of every game room
export function redis_game_all_rooms() {
  return `${redis_game_namespace()}:all_rooms`
}

