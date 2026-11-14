import { Module } from "@nestjs/common";
import { InternalChatController } from "./internal-chat.controller.js";
import { InternalPublicChatModule } from "./public-chat/internal-public-chat.module.js";
import { ChatModule } from "../../../modules/chat/chat.module.js";

@Module({
  imports: [
    InternalPublicChatModule,
    ChatModule
  ],
  controllers: [
    InternalChatController
  ]
})
export class InternalChatModule {

}