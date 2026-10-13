import { Module } from '@nestjs/common';
import { LobbyModule } from './lobby/lobby.module.js';
import { GameGatewayModule } from './game-gateway/game-gateway.module.js';

@Module({
  imports: [LobbyModule, GameGatewayModule]
})
export class GameModule {}
