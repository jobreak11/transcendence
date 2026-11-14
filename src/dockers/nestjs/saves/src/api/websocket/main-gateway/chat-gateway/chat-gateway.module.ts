import { forwardRef, Module } from '@nestjs/common';
import { ChatGatewayService } from './chat-gateway.service.js';
import { ChatGateway } from './chat.gateway.js';
import { ChatModule } from '../../../../modules/chat/chat.module.js';
import { PublicChatModule } from '../../../../modules/chat/public-chat/public-chat.module.js';

@Module({
  imports: [forwardRef(() => ChatModule), PublicChatModule],
  providers: [ChatGatewayService, ChatGateway],
  exports: [ChatGatewayService]
})
export class ChatGatewayModule {

}
