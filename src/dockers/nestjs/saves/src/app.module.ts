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
import { ApiModule } from './api/api.module.js';
import { LobbyModule } from './modules/lobby/lobby.module.js';
import { GameStatisticsModule } from './modules/game-statistics/game-statistics.module.js';
import { TrophiesModule } from './modules/trophies/trophies.module.js';
import { UsersApiModule } from './modules/users-api/users-api.module.js';
import { byRoleHttp } from './utility/by-role.helper.js';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    ThrottlerModule.forRoot({
      throttlers: [
        // {
        //   name: 'default',
        //   limit: 100,
        //   ttl: 10 * 1000,
        // }, 
        {
          name: 'ip',
          limit: 100,
          ttl: 10000
        },
        {
          name: 'user',
          limit: byRoleHttp({ ADMIN: 300, DEVELOPER: 200, EDITOR: 100, USER: 50}),
          ttl: 10000
        },
        // {
        //   name: 'public-api',
        //   limit: 100,
        //   ttl: 10000
        // }
      ],
    }),
    LobbyModule,
    UserModule,
    AuthModule,
    RedisModule,
    ChatModule,
    FriendModule,
    GameModule,
    GameStatisticsModule,
    UsersApiModule,
    ApiModule,
  ],
})
export class AppModule {}
