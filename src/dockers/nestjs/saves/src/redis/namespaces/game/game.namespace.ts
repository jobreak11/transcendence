
export function redis_game_namespace(gameRoomId: string) {
  return `game:${gameRoomId}`
}