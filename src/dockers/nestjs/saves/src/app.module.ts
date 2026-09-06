import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module.js';
import { AuthModule } from './auth/auth.module.js';
import { RedisModule } from './redis/redis.module.js';
import { GatewayModule } from './gateway/gateway.module.js';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, UserModule, AuthModule, RedisModule, GatewayModule],
})
export class AppModule {}
