import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module.js';
// import { DrizzleModule } from './drizzle/drizzle.module.js';
import { FriendModule } from './modules/friend/friend.module.js';
import { ThrottlerModule } from '@nestjs/throttler'
import type { Redis } from 'ioredis';
import { GameModule } from './modules/game/game.module.js';
import { WebsocketModule } from './api/websocket/websocket.module.js';
import { RedisModule } from './infrastructure/redis/redis.module.js';
import { UserModule } from './modules/user/user.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { InternalModule } from './api/internal/internal.module.js';
import { PublicModule } from './api/public/public.module.js';

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
    InternalModule,
    PublicModule
  ],
})
export class AppModule {}
