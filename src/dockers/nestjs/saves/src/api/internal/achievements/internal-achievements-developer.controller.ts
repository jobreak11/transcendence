import { Body, Controller, Delete, Get, Logger, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Req, UseFilters, UseGuards } from "@nestjs/common";
import { IpThrottlerGuard } from "../../../modules/auth/guards/ip-throttler/ip-throttler.guard.js";
import { JwtAuthGuard } from "../../../modules/auth/guards/jwt-auth/jwt-auth.guard.js";
import { RolesGuard } from "../../../modules/auth/guards/roles/roles.guard.js";
import { UserThrottlerGuard } from "../../../modules/auth/guards/user-throttler/user-throttler.guard.js";
import { Roles } from "../../../modules/auth/decorators/roles.decorators.js";
import { Role } from "../../../modules/auth/enums/role.enum.js";
import { HttpAllExceptionsFilter } from "../../filters/HttpAllExceptionsFilter.js";
import { ApiTags } from "@nestjs/swagger";
import { ZodValidationPipe } from "../../../pipes/ZodValidationPipe.js";
import { AchievementCreateDto, achievementsCreateSchema } from "../../../modules/achievements/database/dtos/achievement-create.dto.js";
import { InternalAchievementsService } from "./internal-achievements.service.js";
import { achievementsUpdateSchema, AchievementUpdateDto } from "../../../modules/achievements/database/dtos/achievement-update.dto.js";

@ApiTags('Achievements')
@Controller('achievements/dev')
@UseGuards(IpThrottlerGuard, JwtAuthGuard, RolesGuard, UserThrottlerGuard)
@UseFilters(HttpAllExceptionsFilter)
@Roles(Role.ADMIN, Role.DEVELOPER, Role.EDITOR)
export class InternalAchievementsDeveloperController {

    private readonly logger = new Logger(InternalAchievementsDeveloperController.name);

    constructor(
        private readonly internalAchievementsService: InternalAchievementsService
    ) {

    }

    @Get('all')
    allAchievements(
        @Req() req: any,
        @Query('limit', new ParseIntPipe({optional: true})) limit?: number,
        @Query('offset', new ParseIntPipe({optional: true})) offset?: number
    ) {

        return this.internalAchievementsService.getAllAchievements(limit, offset);
    }

    @Post('create')
    async createAchievement(
        @Req() req: any,
        @Body(new ZodValidationPipe(achievementsCreateSchema)) body: AchievementCreateDto
    ) {

        return this.internalAchievementsService.createNewAchievement(body);
    }

    @Patch('update')
    updateAchievements(
        @Req() req: any,
        @Query('achievementId', ParseUUIDPipe) achievementId: string,
        @Body(new ZodValidationPipe(achievementsUpdateSchema)) body: AchievementUpdateDto
    ) {

        return  this.internalAchievementsService.updateAchievement(achievementId, body);
    }


    @Post('give')
    giveUserAchievement(
        @Req() req: any,
        @Query('userId', ParseUUIDPipe) userId: string,
        @Query('achievementId', ParseUUIDPipe) achievementId: string
    ) {

        return this.internalAchievementsService.giveUserAchievement(userId, achievementId);
    }

    @Delete('revoke')
    revokeUserAchievement(
        @Req() req: any,
        @Query('userId', ParseUUIDPipe) userId: string,
        @Query('achievementId', ParseUUIDPipe) achievementId: string
    ) {

        return this.internalAchievementsService.revokeUserAchievement(userId, achievementId);
    }

    @Delete('delete')
    deleteAchievement(
        @Req() req: any,
        @Query('achievementId', ParseUUIDPipe) achievementId: string
    ) {

        return this.internalAchievementsService.deleteAchievement(achievementId);
    }
}