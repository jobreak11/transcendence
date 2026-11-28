import { BadRequestException, Controller, Get, HttpStatus, Logger, Module, ParseBoolPipe, ParseIntPipe, ParseUUIDPipe, Query, Req, UseFilters, UseGuards } from "@nestjs/common";
import { IpThrottlerGuard } from "../../../../modules/auth/guards/ip-throttler/ip-throttler.guard.js";
import { JwtAuthGuard } from "../../../../modules/auth/guards/jwt-auth/jwt-auth.guard.js";
import { UserThrottlerGuard } from "../../../../modules/auth/guards/user-throttler/user-throttler.guard.js";
import { ApiBadRequestResponse, ApiBearerAuth, ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { HttpAllExceptionsFilter } from "../../../filters/HttpAllExceptionsFilter.js";
import { InternalGameStatisticsService } from "./internal-game-statistics.service.js";
import { Throttle } from "@nestjs/throttler";
import { PublicUsersStatisticsService } from "../../../public/users-statistics/public-users-statistics.service.js";
import { PublicUsersService } from "../../../public/users/public-users.service.js";
import { logError } from "../../../../utility/logError.js";

@ApiBearerAuth()
@ApiTags("Game Statistics")
@Controller('game/statistics')
@UseFilters(HttpAllExceptionsFilter)
@UseGuards(IpThrottlerGuard, JwtAuthGuard, UserThrottlerGuard)
export class InternalGameStatisticsUserController  {

    private readonly logger = new Logger(InternalGameStatisticsUserController.name);

    constructor(
        private readonly internalGameStatisticsService: InternalGameStatisticsService,
        private readonly publicUsersStat: PublicUsersStatisticsService,
        private readonly publicUserService: PublicUsersService,
    ) {
    }

    // @Get()
    // getGameStatistics(
    //     @Req() req: any,
    //     @Query('userId', new ParseUUIDPipe({optional: true})) userId?: string,
    // ) {

    //     if (userId) {
    //         return this.internalGameStatisticsService.getOneUserGameStatistics(userId);
    //     }
    //     else {
    //         return this.internalGameStatisticsService.getOneUserGameStatistics(req.user.id);
    //     }
    // }

    
    // @Throttle({
    //     ip: {
    //         limit: 100,
    //         ttl: 60_000
    //     },
    //     user: {
    //         ttl: 60_000,
    //         limit: byRoleHttp({ADMIN: 50, DEVELOPER: 30, EDITOR: 15, USER: 8})
    //     }
    // })
    @ApiOperation({
        summary: "list all users stats",
        description: "Retrieve statistics for all users with optional pagination and rank ordering. Rate limits: IP (100/min), Role-based (ADMIN: 50, DEVELOPER: 30, EDITOR: 15, USER: 8 per min)."
    })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of records to return (0 - 1000)', example: 20 })
    @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of records to skip (>= 0)', example: 0 })
    @ApiQuery({ name: 'orderByRank', required: false, type: Boolean, description: 'Order results by user rank', example: true })
    @ApiOkResponse({ description: 'Successfully retrieved list of user statistics' })
    @ApiBadRequestResponse({ description: 'Invalid limit or offset query (limit must be 0-1000, offset >= 0), or invalid boolean for orderByRank' })
    @Get()
    allUserStats(
        @Req() req: any,
        @Query('limit', new ParseIntPipe({optional: true})) limit?: number,
        @Query('offset', new ParseIntPipe({optional: true})) offset?: number,
        @Query('orderByRank', new ParseBoolPipe({optional: true})) orderByRank?: boolean,
    ) {

        if ((limit && (limit < 0 || limit > 1000)) || (offset && offset < 0)) {
            throw new BadRequestException('invalid limit or offset query ')
        }

        return this.publicUsersStat.allUserStats(limit, offset, orderByRank);
    }
    
    @ApiOperation({
        summary: "Find user statistics by ID, email, or tag ID",
        description: "Retrieve statistics for a specific user. Exactly ONE query parameter (userId, email, or tagId) must be provided. Rate limits: IP (200/min), Role-based (ADMIN: 200, DEVELOPER: 100, EDITOR: 50, USER: 20 per min)."
    })
    @ApiQuery({ name: 'userId', required: false, type: String, format: 'uuid', description: 'UUID of the user (provide only 1 of userId, email, or tagId)' })
    @ApiQuery({ name: 'email', required: false, type: String, description: 'Email address of the user (provide only 1 of userId, email, or tagId)' })
    @ApiQuery({ name: 'tagId', required: false, type: String, description: 'Tag ID of the user (provide only 1 of userId, email, or tagId)' })
    @ApiOkResponse({ description: 'Successfully retrieved user statistics' })
    @ApiBadRequestResponse({ description: 'Must provide 1 query param only, or invalid UUID format for userId' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    // @Throttle({
    //     ip: {
    //         limit: 200,
    //         ttl: 60_000
    //     },
    //     user: {
    //         ttl: 60_000,
    //         limit: byRoleHttp({ADMIN: 200, DEVELOPER: 100, EDITOR: 50, USER: 20})
    //     }
    // })
    @Get('find')
    async findUserStats(
        @Req() req: any,
        @Query('userId', new ParseUUIDPipe({optional: true})) userId?: string,
        @Query('email') email?: string,
        @Query('tagId') tagId?: string,
    ) {
        let existCount: number = 0;
        if (userId) {
            existCount += 1;
        }
        if (email) {
            existCount += 1;
        }
        if (tagId) {
            existCount += 1;
        }

        if (existCount === 0) {
            return this.publicUsersStat.findOne(req.user.id);
        }

        if (existCount !== 1) {
            throw new BadRequestException('must provide 1 query param only');
        }

        if (email) {
            const result = await this.publicUserService.findByEmail(email);

            return this.publicUsersStat.findOne(result.id);
        }
        else if (tagId) {
            const result = await this.publicUserService.findByTagId(tagId);

            return this.publicUsersStat.findOne(result.id);

        }
        else if (userId) {
            return this.publicUsersStat.findOne(userId);
        }

        throw logError(
            this.logger,
            "error from findUserStats()",
            "invalid logic should not reach here",
            HttpStatus.INTERNAL_SERVER_ERROR
        )

    }

    @Get('findRankIndex')
    async findUserRankIndex(
        @Req() req: any,
        @Query('userId', new ParseUUIDPipe({optional: true})) userId?: string
    ) {

        if (userId) {
            return this.internalGameStatisticsService.findUserRankIndex(userId);
        }
        else {
            return this.internalGameStatisticsService.findUserRankIndex(req.user.id);
        }
    }

}