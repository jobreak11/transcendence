import { Module } from '@nestjs/common';
import { ConnectionGateway } from './connection.gateway.js';
import { ConnectionGatewayService } from './connection-gateway.service.js';
import { UserModule } from '../../../../modules/user/user.module.js';
import { AuthModule } from '../../../../modules/auth/auth.module.js';

@Module({
  imports: [AuthModule, UserModule],
  providers: [ConnectionGateway, ConnectionGatewayService],
  exports: [ConnectionGatewayService]
})
export class ConnectionGatewayModule {}
