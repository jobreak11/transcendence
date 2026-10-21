import { redis_chat_namespace } from "../../namespaces/chat-redis.namespace.js";

function redis_chat_lobby_namespace(lobbyPinId: string) {
  return `${redis_chat_namespace()}:lobby:${lobbyPinId}`
}

// set get .. just act like pointer to actual chat room id
export function redis_chat_lobby_chat_room(lobbyPinId: string) {
  return `${redis_chat_lobby_namespace(lobbyPinId)}:chat_room`
}

