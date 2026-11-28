import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../../modules/auth/guards/jwt-auth/jwt-auth.guard.js";
import { UserThrottlerGuard } from "../../../../modules/auth/guards/user-throttler/user-throttler.guard.js";
import { Throttle } from "@nestjs/throttler";
import { THROTTLER_CHAT_CONTROLLER_LIMIT, THROTTLER_CHAT_CONTROLLER_TTL } from "../internal-chat.constants.js";
import { PublicChatService } from "../../../../modules/chat/public-chat/public-chat.service.js";
import { httpControllerCatch } from "../../../../utility/httpControllerCatch.js";

@UseGuards(JwtAuthGuard, UserThrottlerGuard)
@Throttle({
  default: {
    limit: THROTTLER_CHAT_CONTROLLER_LIMIT,
    ttl: THROTTLER_CHAT_CONTROLLER_TTL
  }
})
@Controller('chat/public')
export class InternalPublicChatController {

  constructor (
    private readonly publicChatService: PublicChatService,
  ) {

  }


  @Get()
  getAllChatMessages() {
    try {
      return this.publicChatService.getPublicChatHistory();
    } catch (error: any) {
      throw httpControllerCatch(error);
    }
  }

}