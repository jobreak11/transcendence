import { redis_cache_namespace } from "../../../infrastructure/redis/caching/cache.namespace.js";

const redis_cache_api_key_namespace = `${redis_cache_namespace()}:api_hashed_key`;

// setex getex
export function redis_cache_api_key(hashedApiKey: string) {
    return `${redis_cache_api_key_namespace}:${hashedApiKey}`
}
