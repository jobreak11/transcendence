import { forwardRef, Module } from '@nestjs/common';
import { ChatService } from './chat.service.js';
import { UserModule } from '../user/user.module.js';
import { PublicChatModule } from './public-chat/public-chat.module.js';
import { DrizzleModule } from '../../infrastructure/drizzle/drizzle.module.js';
import { ChatRedisService } from './redis/chat-redis.service.js';
import { ChatGatewayModule } from '../../api/websocket/main-gateway/chat-gateway/chat-gateway.module.js';
import { ChatDatabaseService } from './database/chat-database.service.js';

@Module({
  imports: [DrizzleModule, PublicChatModule, forwardRef(()=>ChatGatewayModule)],
  providers: [ChatService, ChatRedisService, ChatDatabaseService],
  exports: [ChatService],
})
export class ChatModule {}
