import { Controller, UseFilters, UseGuards } from "@nestjs/common";
import { RolesGuard } from "../../../../modules/auth/guards/roles/roles.guard.js";
import { IpThrottlerGuard } from "../../../../modules/auth/guards/ip-throttler/ip-throttler.guard.js";
import { JwtAuthGuard } from "../../../../modules/auth/guards/jwt-auth/jwt-auth.guard.js";
import { UserThrottlerGuard } from "../../../../modules/auth/guards/user-throttler/user-throttler.guard.js";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { HttpAllExceptionsFilter } from "../../../filters/HttpAllExceptionsFilter.js";
import { Role } from "../../../../modules/auth/enums/role.enum.js";
import { Roles } from "../../../../modules/auth/decorators/roles.decorators.js";

@ApiBearerAuth()
@ApiTags("Game Statistics")
@Controller('game/statistics/dev')
@Roles(Role.ADMIN, Role.DEVELOPER)
@UseFilters(HttpAllExceptionsFilter)
@UseGuards(IpThrottlerGuard, JwtAuthGuard, RolesGuard,UserThrottlerGuard)
export class InternalGameStatisticsDeveloperController {

}