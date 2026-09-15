import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gatewat.js';
import { MessageBody, SubscribeMessage } from '@nestjs/websockets';

@Module({
  providers: [ChatGateway]
})
export class ChatModule {

  @SubscribeMessage('newMessage')
  handleNewMessage(@MessageBody() message: any) {
    console.log(message);
  }
}
