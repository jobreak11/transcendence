import { redis_cache_namespace } from "./cache.namespace.js"

function redis_cache_user_namespace(userId: string) {
  return `${redis_cache_namespace()}:user:id:${userId}`
}

export function redis_cache_user_all_keys(userId: string, email:string, tagId: string): string[] {
  return [
    redis_cache_user_profile(userId),
    redis_cache_user_email(userId),
    redis_cache_user_tag_id(userId),
  ]
};

// set get
export function redis_cache_user_all_friendships(userId: string) {

}

// set get
export function redis_cache_user_profile(userId: string) {
  return `${redis_cache_user_namespace(userId)}:user_profile`
}

// set get
export function redis_cache_user_email(email: string) {
  return `${redis_cache_namespace()}:user:email:${email}`
}

// set get
export function redis_cache_user_tag_id(tagId: string) {
  return `${redis_cache_namespace()}:user:tag_id:${tagId}`
}