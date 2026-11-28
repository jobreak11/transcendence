import { Module } from '@nestjs/common';
import { FriendService } from './friend.service.js';
import { UserModule } from '../user/user.module.js';
import { DrizzleModule } from '../../infrastructure/drizzle/drizzle.module.js';
import { FriendRedisService } from './redis/friend-redis.service.js';
import { FriendDatabaseService } from './database/friend-database.service.js';
import { FriendCachingService } from './caching/friend-caching.service.js';

@Module({
  imports: [UserModule, DrizzleModule],
  providers: [FriendService, FriendRedisService, FriendDatabaseService, FriendCachingService],
  exports: [FriendService]
})
export class FriendModule {}
