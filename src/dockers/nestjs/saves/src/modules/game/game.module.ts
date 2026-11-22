import { Module } from '@nestjs/common';
import { LobbyModule } from '../lobby/lobby.module.js';
import { UserModule } from '../user/user.module.js';
import { GameRedisService } from './redis/game-redis.service.js';
import { GameDatabaseService } from './database/game-database.service.js';
import { GameService } from './game.service.js';

@Module({
  providers: [
    GameRedisService, GameDatabaseService, GameService
  ],
  exports: [
    GameRedisService
  ]
})
export class GameModule {}
