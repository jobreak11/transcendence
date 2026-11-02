import { Module } from '@nestjs/common';
import { MainGateway } from './main.gateway.js';
import { MainGatewayService } from './main-gateway.service.js';
import { ConnectionGatewayModule } from './connection-gateway/connection-gateway.module.js';
import { ChatGatewayModule } from './chat-gateway/chat-gateway.module.js';
import { LobbyGatewayModule } from './lobby-gateway/lobby-gateway.module.js';

@Module({
  imports: [ConnectionGatewayModule, ChatGatewayModule, LobbyGatewayModule],
  providers: [MainGateway, MainGatewayService]
})
export class MainGatewayModule {}
