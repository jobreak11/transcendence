import { Module } from '@nestjs/common';
import { UserRedisService } from './user-redis.service.js';

@Module({
  providers: [UserRedisService],
  exports: [UserRedisService]
})
export class UserRedisModule {}
