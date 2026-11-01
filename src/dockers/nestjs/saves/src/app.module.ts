import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module.js';
import { AuthModule } from './auth/auth.module.js';
import { RedisModule } from './redis/redis.module.js';
// import { DrizzleModule } from './drizzle/drizzle.module.js';
import { FriendModule } from './friend/friend.module.js';
import { ChatModule } from './chat/chat.module.js';
import { ThrottlerModule } from '@nestjs/throttler'
import type { Redis } from 'ioredis';
import { GameModule } from './game/game.module.js';
import { WebsocketModule } from './websocket/websocket.module.js';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          limit: 20,
          ttl: 10 * 1000,
        }
      ],
    }),
    UserModule,
    AuthModule,
    RedisModule,
    ChatModule,
    FriendModule,
    GameModule,
    WebsocketModule,
    // DrizzleModule
  ],
})
export class AppModule {}
