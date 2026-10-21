import { redis_cache_namespace } from "../../caching/namespaces/cache.namespace.js";


function redis_cache_friendship_namespace(userId: string) {
  return `${redis_cache_namespace()}:friendship:user:id:${userId}`
}

export function redis_cache_friendship_all_keys(userId: string): string[] {
  return [
    redis_cache_friendship_all_friendships(userId),
  ]
}

export function redis_cache_friendship_all_friendships(userId: string) {
  return `${redis_cache_friendship_namespace(userId)}:all_friendships`
}
