import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
// import { TypeOrmModule } from '@nestjs/typeorm';
import { DrizzleModule } from '../drizzle/drizzle.module.js';
import { TitleModule } from './title/title.module.js';
import { UserRedisModule } from '../redis/user-redis/user-redis.module.js';

@Module({
  imports: [DrizzleModule, TitleModule, UserRedisModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
