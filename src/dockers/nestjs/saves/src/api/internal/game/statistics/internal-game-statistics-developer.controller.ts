import { Controller, UseGuards } from "@nestjs/common";
import { RolesGuard } from "../../../../modules/auth/guards/roles/roles.guard.js";
import { IpThrottlerGuard } from "../../../../modules/auth/guards/ip-throttler/ip-throttler.guard.js";
import { JwtAuthGuard } from "../../../../modules/auth/guards/jwt-auth/jwt-auth.guard.js";
import { UserThrottlerGuard } from "../../../../modules/auth/guards/user-throttler/user-throttler.guard.js";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

@ApiBearerAuth()
@ApiTags("Game Statistics")
@Controller('game/statistics/dev')
@UseGuards(IpThrottlerGuard, JwtAuthGuard, RolesGuard,UserThrottlerGuard)
export class InternalGameStatisticsDeveloperController {

}