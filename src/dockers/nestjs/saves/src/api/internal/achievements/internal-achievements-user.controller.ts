import { BadRequestException, Controller, Get, Logger, ParseIntPipe, ParseUUIDPipe, Query, Req, UseFilters, UseGuards } from "@nestjs/common";
import { IpThrottlerGuard } from "../../../modules/auth/guards/ip-throttler/ip-throttler.guard.js";
import { JwtAuthGuard } from "../../../modules/auth/guards/jwt-auth/jwt-auth.guard.js";
import { UserThrottlerGuard } from "../../../modules/auth/guards/user-throttler/user-throttler.guard.js";
import { HttpAllExceptionsFilter } from "../../filters/HttpAllExceptionsFilter.js";
import { ApiTags } from "@nestjs/swagger";
import { InternalAchievementsService } from "./internal-achievements.service.js";

@ApiTags('Achievements')
@UseGuards(IpThrottlerGuard, JwtAuthGuard, UserThrottlerGuard)
@UseFilters(HttpAllExceptionsFilter)
@Controller('achievements')
export class InternalAchievementsUserController {
    private readonly logger = new Logger(InternalAchievementsUserController.name)

    constructor (
        private readonly internalAchievementsService: InternalAchievementsService,
    ) {
    }

    @Get()
    getUserAchievements(
        @Req() req: any,
        @Query('limit', new ParseIntPipe({optional: true})) limit?: number,
        @Query('offset', new ParseIntPipe({optional: true})) offset?: number,
        @Query('userId', new ParseUUIDPipe({optional: true})) userId?: string
    ) {

        if ((limit && (limit < 0 || limit > 1000)) || (offset && offset < 0)) {
            throw new BadRequestException("invalid limit and offset parameters");
        }

        if (userId) {
            return this.internalAchievementsService.getUserAchievements(userId, limit, offset);

        }
        else {
            return this.internalAchievementsService.getUserAchievements(req.user.id, limit, offset);
        }
    }

    @Get('totalUserCount')
    totalAchievementsUserCount(
        @Req() req: any,
        @Query('userId', new ParseUUIDPipe({optional: true})) userId?: string
    ) {

        if (userId) {
            return this.internalAchievementsService.getTotalUserAchievementCount(userId);
        }
        else {
            return this.internalAchievementsService.getTotalUserAchievementCount(req.user.id);
        }

    }

    @Get('allTotalCount')
    totalAchievementsCount(
        @Req() req: any
    ) {

        return this.internalAchievementsService.getAllAchievementsCount();
    }

    @Get('find')
    findAchievement(
        @Req() req:any,
        @Query('achievementId', ParseUUIDPipe) achievementId: string
    ) {

        return this.internalAchievementsService.getOneAchievement(achievementId);
    }


}