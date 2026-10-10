import { Module } from '@nestjs/common';
import { LobbyController } from './lobby.controller.js';
import { LobbyService } from './lobby.service.js';
import { LobbyGuard } from './lobby.guard.js';
import { MainGatewayModule } from '../../mainGateway/mainGateway.module.js';

@Module({
  imports: [MainGatewayModule],
  controllers: [LobbyController],
  providers: [
    LobbyService
  ],
})
export class LobbyModule {}
