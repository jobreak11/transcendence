import { HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { REDIS_CLIENT } from "../../redis.provider.js";
import type { RedisClient } from "../../redis.provider.js";
import { FindAllFriendshipsDto } from "../../../friend/dto/find-all-friendships.dto.js";
import { redis_cache_friendship_all_friendships } from "./namespaces/cache-friendship.namespace.js";
import { errorWithCode } from "../../../utility/errorWithCode.js";
import { CACHING_FRIENDSHIPS_SERVICE_EXPIRE_TIME } from "./friendships-caching.constants.js";

@Injectable()
export class FriendshipsCachingService {

  private readonly logger = new Logger(FriendshipsCachingService.name);

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
