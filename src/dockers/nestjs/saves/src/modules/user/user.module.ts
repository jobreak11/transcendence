import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { DrizzleModule } from '../../infrastructure/drizzle/drizzle.module.js';
import { UsersRedisService } from './redis/users-redis.service.js';
import { UsersDatabaseService } from './database/users-database.service.js';
import { UsersCachingService } from './caching/users-caching.service.js';
import { TitlesModule } from '../titles/titles.module.js';
// import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [DrizzleModule, TitlesModule],
  providers: [UsersRedisService, UsersDatabaseService, UserService, UsersCachingService],
  exports: [UserService, UsersRedisService]
})
export class UserModule {}
