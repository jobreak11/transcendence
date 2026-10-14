import { Module } from '@nestjs/common';
import { MainGatewayModule } from './main-gateway/main-gateway.module.js';

@Module({
  imports: [MainGatewayModule]
})
export class WebsocketModule {}
