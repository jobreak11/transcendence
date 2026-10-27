import { redis_chat_namespace } from "../../namespaces/chat-redis.namespace.js";

function redis_chat_public_namespace() {
  return `${redis_chat_namespace()}:public`
}

// use lpush lrange ltrim
export function redis_chat_public_messages() {
  return `${redis_chat_public_namespace()}:messages`
}