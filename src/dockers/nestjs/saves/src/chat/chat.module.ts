import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { DrizzleModule } from '../drizzle/drizzle.module.js';
import { UserModule } from '../user/user.module.js';
import { ChatRedisModule } from '../redis/chat-redis/chat-redis.module.js';
import { PublicChatModule } from './public-chat/public-chat.module.js';

@Module({
  imports: [DrizzleModule, ChatRedisModule, PublicChatModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
