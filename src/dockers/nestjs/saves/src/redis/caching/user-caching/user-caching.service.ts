import { Inject, Injectable, Logger } from "@nestjs/common";
import { REDIS_CLIENT } from "../../redis.provider.js";
import type { RedisClient } from "../../redis.provider.js";
import { RedisCacheUserDto } from "./schemas/user.redis.schema.js";
import { redis_cache_user_all_keys, redis_cache_user_email, redis_cache_user_profile, redis_cache_user_tag_id } from "./namespaces/cache-user.namespace.js";
import { CACHING_USER_SERVICE_EXPIRE_TIME } from "./user-caching.constants.js";

@Injectable()
export class UserCachingService {

  private readonly logger = new Logger(UserCachingService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
  ) {

  }

  async getCacheByEmail(email: string): Promise<RedisCacheUserDto | null> {

    const foundRes = await this.redis.get(redis_cache_user_email(email))

    if (foundRes) {
      return this.getCacheById(foundRes)
    }

    return (null);
  }

  async getCacheByTagId(tagId: string): Promise<RedisCacheUserDto | null> {

    const foundRes = await this.redis.get(redis_cache_user_tag_id(tagId))

    if (foundRes) {
      return this.getCacheById(foundRes)
    }

    return (null);
  }

  async getCacheById(userId: string): Promise<RedisCacheUserDto | null> {

    const res = await this.redis.get(redis_cache_user_profile(userId));

    if (!res) {
      return null;
    }

    const data = JSON.parse(res) as RedisCacheUserDto
    await this.resetExpireTime(data.id, data.email, data.tagId);
    return data;
  }

  private async resetExpireTime(userId: string, email: string, tagId: string) {
    await this.redis.pipeline()
      .expire(redis_cache_user_profile(userId), CACHING_USER_SERVICE_EXPIRE_TIME)
      .expire(redis_cache_user_email(email), CACHING_USER_SERVICE_EXPIRE_TIME)
      .expire(redis_cache_user_tag_id(tagId), CACHING_USER_SERVICE_EXPIRE_TIME)
      .exec()
  }

  cachingUser(redisCacheUserDto: RedisCacheUserDto) {

    const stringCacheData = JSON.stringify(redisCacheUserDto);

    return this.redis.msetex(3,
      redis_cache_user_profile(redisCacheUserDto.id), stringCacheData,
      redis_cache_user_email(redisCacheUserDto.email), redisCacheUserDto.id, 
      redis_cache_user_tag_id(redisCacheUserDto.tagId), redisCacheUserDto.id,
      "EX", CACHING_USER_SERVICE_EXPIRE_TIME
    )
  }

  async cacheDeleteUser(userId: string) {
    const res = await this.redis.get(redis_cache_user_profile(userId));

    if (res) {
      const data = JSON.parse(res) as RedisCacheUserDto;

      await this.redis.unlink(
        redis_cache_user_all_keys(data.id, data.email, data.tagId)
      )
    }
  }
  

}