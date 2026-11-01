import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { DrizzleModule } from '../drizzle/drizzle.module.js';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [DrizzleModule, UserModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
