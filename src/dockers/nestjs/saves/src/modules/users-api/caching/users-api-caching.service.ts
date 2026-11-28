import { Inject, Injectable, Logger } from "@nestjs/common";
import { REDIS_CLIENT, type RedisClient } from "../../../infrastructure/redis/redis.provider.js";
import { UserApiKeyDto } from "../../../infrastructure/drizzle/schema/user_api_keys/user_api_keys.dto.js";
import { redis_cache_api_key } from "./users-api-caching.namespace.js";
import { REDIS_HASHED_API_EXPIRE_TIME } from "./users-api-caching.constants.js";
import { UserApiKeyUserRoleDto } from "./dtos/user-api-key-user-role.dto.js";

@Injectable()
export class UsersApiCachingService {

    private readonly logger = new Logger(UsersApiCachingService.name);

    constructor(
        @Inject(REDIS_CLIENT) private readonly redis: RedisClient,

    ) {
        
    }

    async saveHashedApi(ApiData: UserApiKeyUserRoleDto) {

        const result = await this.redis.setex(redis_cache_api_key(ApiData.keyHashed), REDIS_HASHED_API_EXPIRE_TIME, JSON.stringify(ApiData));

        return result
    }

    async loadHashedApi(hashedApiKey: string): Promise<UserApiKeyUserRoleDto | null> {
        const result = await this.redis.getex(redis_cache_api_key(hashedApiKey), "EX", REDIS_HASHED_API_EXPIRE_TIME);

        if (!result) {
            return null;
        }
        return JSON.parse(result) as UserApiKeyUserRoleDto
    }

    async removeHashedApi(hashedApiKey: string) {
        const result = await this.redis.del(redis_cache_api_key(hashedApiKey));

        return result;
    }
}