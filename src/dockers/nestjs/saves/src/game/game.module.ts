import { Module } from '@nestjs/common';
import { LobbyModule } from './lobby/lobby.module.js';

@Module({
  imports: [LobbyModule]
})
export class GameModule {}
