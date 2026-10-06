import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from '../../redis/redis.provider.js';
import type { RedisClient } from '../../redis/redis.provider.js';

@Injectable()
export class LobbyService {
  constructor(
    @Inject(REDIS_CLIENT) private redis: RedisClient
  ) {
  }

  createLobby(creatorUserId: string) {
  /*
    Create a lobby which would live in redis not in database
    NOTE:
     - Assuming you must already check
  */

    this.redis.pipeline()
 
  }
}
