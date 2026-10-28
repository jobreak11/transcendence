import { Module } from '@nestjs/common';
import { MainGatewayModule } from './main-gateway/main-gateway.module.js';
import { GameGatewayModule } from './game-gateway/game-gateway.module.js';

@Module({
  imports: [MainGatewayModule, GameGatewayModule]
})
export class WebsocketModule {}
