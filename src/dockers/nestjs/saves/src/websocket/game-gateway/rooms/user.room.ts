import { room_game_namespace } from "./game.room.js";

// private room per one and only for one each user
export function room_game_private_user(userId: string) {
  return `${room_game_namespace()}:private:user:${userId}`
}
