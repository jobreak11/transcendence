import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConnectionGateway } from './connection.gateway.js';
import { ConnectionGatewayService } from './connection-gateway.service.js';
import { UserRedisModule } from '../../../redis/user-redis/user-redis.module.js';

@Module({
  imports: [JwtModule, UserRedisModule],
  providers: [ConnectionGateway, ConnectionGatewayService],
  exports: [ConnectionGatewayService]
})
export class ConnectionGatewayModule {}
