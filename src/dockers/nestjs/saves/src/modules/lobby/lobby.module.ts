import { forwardRef, Module } from '@nestjs/common';
import { LobbyService } from './lobby.service.js';
import { ConnectionGatewayModule } from '../../api/websocket/main-gateway/connection-gateway/connection-gateway.module.js';
import { UserModule } from '../user/user.module.js';
import { LobbyRedisService } from './redis/lobby-redis.service.js';
import { LobbyDatabaseService } from './database/lobby-database.service.js';
import { GameModule } from '../game/game.module.js';
import { LobbyGatewayModule } from '../../api/websocket/main-gateway/lobby-gateway/lobby-gateway.module.js';
import { ChatModule } from '../chat/chat.module.js';
import { GameGatewayModule } from '../../api/websocket/game-gateway/game-gateway.module.js';

@Module({
  imports: [GameGatewayModule, ConnectionGatewayModule, UserModule, GameModule, forwardRef(() => LobbyGatewayModule), ChatModule],
  providers: [
    LobbyService,
    LobbyRedisService,
    LobbyDatabaseService
  ],
  exports: [
    LobbyService,
    LobbyRedisService
  ]
})
export class LobbyModule {}
