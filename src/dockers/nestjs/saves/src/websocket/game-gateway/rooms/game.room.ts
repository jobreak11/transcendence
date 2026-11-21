
export function room_game_namespace() {
  return `game`
}

export function room_game_specific_room(gameRoomId: string) {
  return `${room_game_namespace()}:${gameRoomId}`
}