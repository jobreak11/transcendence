import { Module } from '@nestjs/common';
import { ChatGatewayService } from './chat-gateway.service.js';
import { ChatModule } from '../../../chat/chat.module.js';

@Module({
  imports: [ChatModule],
  providers: [ChatGatewayService, ChatGatewayService],
  exports: [ChatGatewayService]
})
export class ChatGatewayModule {

}
