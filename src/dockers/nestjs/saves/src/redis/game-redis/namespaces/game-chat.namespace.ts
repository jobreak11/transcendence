import { redis_game_namespace } from "./game.namespace.js";

function redis_game_chat_namespace(gameRoomId: string) {
  return (`${redis_game_namespace(gameRoomId)}:chat`);
}

export function redis_game_chat_messages(gameRoomId: string) {
  return `${redis_game_chat_namespace(gameRoomId)}:messages`
}
