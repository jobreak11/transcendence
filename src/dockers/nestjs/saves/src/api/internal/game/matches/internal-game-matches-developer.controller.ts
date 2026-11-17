import { Controller, UseGuards } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { UserThrottlerGuard } from "../../../../modules/auth/guards/user-throttler/user-throttler.guard.js";
import { IpThrottlerGuard } from "../../../../modules/auth/guards/ip-throttler/ip-throttler.guard.js";
import { JwtAuthGuard } from "../../../../modules/auth/guards/jwt-auth/jwt-auth.guard.js";
import { RolesGuard } from "../../../../modules/auth/guards/roles/roles.guard.js";

@Controller('game/matches/dev')
@UseGuards(IpThrottlerGuard, JwtAuthGuard, RolesGuard, UserThrottlerGuard)
export class InternalGameMatchesDeveloperController {

    

}