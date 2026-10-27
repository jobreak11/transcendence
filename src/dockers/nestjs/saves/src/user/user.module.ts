import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
// import { TypeOrmModule } from '@nestjs/typeorm';
import { DrizzleModule } from '../drizzle/drizzle.module.js';
import { TitleModule } from './title/title.module.js';
import { UserRedisModule } from '../redis/user-redis/user-redis.module.js';
import { UserCachingModule } from '../redis/caching/user-caching/user-caching.module.js';

@Module({
  imports: [DrizzleModule, TitleModule, UserRedisModule, UserCachingModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
