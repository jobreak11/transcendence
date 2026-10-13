import { Module } from '@nestjs/common';
import { GameGateway } from './game-gateway.js';
import { GameGatewayService } from './game-gateway.service.js';

@Module({
  providers: [GameGateway, GameGatewayService],
  //exports: [GameGatewayService]
})
export class GameGatewayModule {
}
