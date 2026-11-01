import { Module } from '@nestjs/common';
import { ConnectionGateway } from './connection.gateway.js';
import { ConnectionGatewayService } from './connection-gateway.service.js';
import { AuthModule } from '../../../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  providers: [ConnectionGateway, ConnectionGatewayService],
  exports: [ConnectionGatewayService]
})
export class ConnectionGatewayModule {}
