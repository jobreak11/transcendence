import { Module } from '@nestjs/common';
import { LobbyController } from './lobby.controller.js';
import { LobbyService } from './lobby.service.js';
import { LobbyGuard } from './lobby.guard.js';
import { ChatGatewayModule } from '../../websocket/main-gateway/chat-gateway/chat-gateway.module.js';
import { ConnectionGatewayModule } from '../../websocket/main-gateway/connection-gateway/connection-gateway.module.js';
import { LobbyRedisModule } from '../../redis/lobby-redis/lobby-redis.module.js';
import { UserRedisModule } from '../../redis/user-redis/user-redis.module.js';

@Module({
  imports: [ChatGatewayModule, ConnectionGatewayModule, LobbyRedisModule, UserRedisModule],
  controllers: [LobbyController],
  providers: [
    LobbyService
  ],
})
export class LobbyModule {}
