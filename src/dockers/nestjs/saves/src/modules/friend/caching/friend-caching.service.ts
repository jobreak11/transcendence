import { HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { REDIS_CLIENT, type RedisClient } from "../../../infrastructure/redis/redis.provider.js";
import { FindAllFriendshipsDto } from "../dto/find-all-friendships.dto.js";
import { redis_cache_friendship_all_friendships } from "./friend-caching.namespace.js";
import { CACHING_FRIENDSHIPS_SERVICE_EXPIRE_TIME } from "./friend-caching.constants.js";
import { errorWithCode } from "../../../utility/errorWithCode.js";

@Injectable()
export class FriendCachingService {

  private readonly logger = new Logger(FriendCachingService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient

  ) {

  }

  setCacheFriendships(allFriendShips: FindAllFriendshipsDto, userId: string) {
    return this.redis
      .set(redis_cache_friendship_all_friendships(userId), JSON.stringify(allFriendShips), "EX", CACHING_FRIENDSHIPS_SERVICE_EXPIRE_TIME);
  }

  async getCacheFriendships(userId: string) {

    try {
      const stringData = await this.redis
        .getex(redis_cache_friendship_all_friendships(userId), "EX", CACHING_FRIENDSHIPS_SERVICE_EXPIRE_TIME);
      if (stringData) {
        return JSON.parse(stringData) as FindAllFriendshipsDto
      }
      return (null);
    } catch (err) {
      throw errorWithCode(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "cache redis internal error"
      )
    }
  }

  delCacheFriendships(userId: string) {
    return this.redis
      .del(redis_cache_friendship_all_friendships(userId));
  }





}