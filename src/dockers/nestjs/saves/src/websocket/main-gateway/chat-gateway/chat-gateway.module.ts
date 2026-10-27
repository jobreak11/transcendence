import { Module } from '@nestjs/common';
import { ChatGatewayService } from './chat-gateway.service.js';
import { ChatModule } from '../../../chat/chat.module.js';
import { ChatPublicRedisModule } from '../../../redis/chat-redis/chat-public-redis/chat-public-redis.module.js';

@Module({
  imports: [ChatModule, ChatPublicRedisModule],
  providers: [ChatGatewayService, ChatGatewayService],
  exports: [ChatGatewayService]
})
export class ChatGatewayModule {

}
