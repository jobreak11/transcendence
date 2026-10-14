import { redis_global_namespace } from "./global.namespace.js";

function redis_global_chat_namespace() {
  return `${redis_global_namespace()}:chat`
}

export function redis_global_chat_messages() {
  return `${redis_global_chat_namespace()}:messages`
}