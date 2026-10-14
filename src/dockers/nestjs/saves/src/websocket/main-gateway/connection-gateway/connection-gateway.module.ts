import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConnectionGateway } from './connection.gateway.js';
import { ConnectionGatewayService } from './connection-gateway.service.js';

@Module({
  imports: [JwtModule],
  providers: [ConnectionGateway, ConnectionGatewayService],
  exports: [ConnectionGatewayService]
})
export class ConnectionGatewayModule {}
