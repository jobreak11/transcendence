import { Controller, Get, UseGuards } from "@nestjs/common";
import { PublicChatService } from "./public-chat.service.js";
import { httpControllerCatch } from "../../utility/httpControllerCatch.js";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth/jwt-auth.guard.js";
import { UserThrottlerGuard } from "../../auth/guards/user-throttler/user-throttler.guard.js";
import { Throttle } from "@nestjs/throttler";
import { THROTTLER_CHAT_CONTROLLER_LIMIT, THROTTLER_CHAT_CONTROLLER_TTL } from "../../constant.js";
import { ApiBearerAuth } from "@nestjs/swagger";

@UseGuards(JwtAuthGuard, UserThrottlerGuard)
@Throttle({
  default: {
    limit: THROTTLER_CHAT_CONTROLLER_LIMIT,
    ttl: THROTTLER_CHAT_CONTROLLER_TTL
  }
})
@ApiBearerAuth()
@Controller('/chat/public')
export class PublicChatController {

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