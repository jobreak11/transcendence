import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { RedisService } from './redis.service.js';
import type { RedisClient } from './redis.provider.js';
import { REDIS_CLIENT, redisProvider } from './redis.provider.js';

@Global()
@Module({
  providers: [redisProvider, RedisService],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnApplicationShutdown{
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient
  ) {}

  async onApplicationShutdown(signal?: string) {
    await this.redis.quit();
  }
}
