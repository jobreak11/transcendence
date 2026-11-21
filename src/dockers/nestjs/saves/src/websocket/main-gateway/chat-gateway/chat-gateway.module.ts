import { forwardRef, Module } from '@nestjs/common';
import { ChatGatewayService } from './chat-gateway.service.js';
import { ChatModule } from '../../../chat/chat.module.js';
import { ChatPublicRedisModule } from '../../../redis/chat-redis/chat-public-redis/chat-public-redis.module.js';
import { ChatGateway } from './chat.gateway.js';

@Module({
  imports: [forwardRef(() => ChatModule), ChatPublicRedisModule],
  providers: [ChatGatewayService, ChatGateway],
  exports: [ChatGatewayService]
})
export class ChatGatewayModule {

}
