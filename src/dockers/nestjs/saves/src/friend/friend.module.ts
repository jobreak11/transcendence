import { Module } from '@nestjs/common';
import { FriendController } from './friend.controller.js';
import { FriendService } from './friend.service.js';
import { UserModule } from '../user/user.module.js';
import { DrizzleModule } from '../drizzle/drizzle.module.js';
import { FriendshipsCachingModule } from '../redis/caching/friendships-caching/friendships-caching.module.js';

@Module({
  imports: [UserModule, DrizzleModule, FriendshipsCachingModule],
  controllers: [FriendController],
  providers: [FriendService],
  exports: [FriendService]
})
export class FriendModule {}
