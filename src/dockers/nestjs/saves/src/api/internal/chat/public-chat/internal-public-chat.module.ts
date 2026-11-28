import { Module } from "@nestjs/common";
import { InternalPublicChatController } from "./internal-public-chat.controller.js";
import { PublicChatModule } from "../../../../modules/chat/public-chat/public-chat.module.js";

@Module({
    imports: [
        PublicChatModule
    ],
    controllers: [
        InternalPublicChatController
    ]
})
export class InternalPublicChatModule {

}