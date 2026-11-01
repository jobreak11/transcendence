import { Module } from '@nestjs/common';
import { RedisModule } from '../../../redis/redis.module.js';
import { GameGatewayService } from './game-gateway.service.js';
import { PokerGateway } from './game.gateway.js';

@Module({
  imports: [RedisModule],
  providers: [PokerGateway, GameGatewayService],
  exports: [GameGatewayService],
})
export class GameGatewayModule {}