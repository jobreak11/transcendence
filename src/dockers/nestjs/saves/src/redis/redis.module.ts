import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service.js';
import { redisProvider } from './redis.provider.js';

@Global()
@Module({
  providers: [redisProvider, RedisService],
  exports: [RedisService],
})
export class RedisModule {}
