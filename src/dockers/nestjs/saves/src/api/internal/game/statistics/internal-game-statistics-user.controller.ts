import { Controller, Get, Module, ParseUUIDPipe, Query, Req, UseFilters, UseGuards } from "@nestjs/common";
import { IpThrottlerGuard } from "../../../../modules/auth/guards/ip-throttler/ip-throttler.guard.js";
import { JwtAuthGuard } from "../../../../modules/auth/guards/jwt-auth/jwt-auth.guard.js";
import { UserThrottlerGuard } from "../../../../modules/auth/guards/user-throttler/user-throttler.guard.js";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { HttpAllExceptionsFilter } from "../../../filters/HttpAllExceptionsFilter.js";
import { InternalGameStatisticsService } from "./internal-game-statistics.service.js";

@ApiBearerAuth()
@ApiTags("Game Statistics")
@Controller('game/statistics')
@UseFilters(HttpAllExceptionsFilter)
@UseGuards(IpThrottlerGuard, JwtAuthGuard, UserThrottlerGuard)
export class InternalGameStatisticsUserController  {

    constructor(
        private readonly internalGameStatisticsService: InternalGameStatisticsService
    ) {
    }

    @Get()
    getGameStatistics(
        @Req() req: any,
        @Query('userId', new ParseUUIDPipe({optional: true})) userId?: string,
    ) {

        if (userId) {
            return this.internalGameStatisticsService.getOneUserGameStatistics(userId);
        }
        else {
            return this.internalGameStatisticsService.getOneUserGameStatistics(req.user.id);
        }
    }
    

}