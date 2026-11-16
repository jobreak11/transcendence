import { Controller, UseGuards } from "@nestjs/common";
import { IpThrottlerGuard } from "../../../../modules/auth/guards/ip-throttler/ip-throttler.guard.js";
import { JwtAuthGuard } from "../../../../modules/auth/guards/jwt-auth/jwt-auth.guard.js";
import { UserThrottlerGuard } from "../../../../modules/auth/guards/user-throttler/user-throttler.guard.js";

@Controller('game/matches')
@UseGuards(IpThrottlerGuard, JwtAuthGuard, UserThrottlerGuard)
export class InternalGameMatchesUserController {

    

}