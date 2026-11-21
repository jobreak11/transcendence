import { Module } from '@nestjs/common';
import { ConnectionGateway } from './connection.gateway.js';
import { ConnectionGatewayService } from './connection-gateway.service.js';
import { UserRedisModule } from '../../../redis/user-redis/user-redis.module.js';
import { AuthModule } from '../../../auth/auth.module.js';

@Module({
  imports: [AuthModule, UserRedisModule],
  providers: [ConnectionGateway, ConnectionGatewayService],
  exports: [ConnectionGatewayService]
})
export class ConnectionGatewayModule {}
