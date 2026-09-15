import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module.js';
import { AuthModule } from './auth/auth.module.js';
import { RedisModule } from './redis/redis.module.js';
import { GatewayModule } from './gateway/gateway.module.js';
// import { DrizzleModule } from './drizzle/drizzle.module.js';
import { ChatModule } from './chat/chat.module.js';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [ConfigModule.forRoot({ isGlobal: true }), UserModule, AuthModule, RedisModule, GatewayModule, ChatModule, 
    // DrizzleModule
  ],
})
export class AppModule {}
