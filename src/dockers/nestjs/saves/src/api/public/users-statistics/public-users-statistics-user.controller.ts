import { BadRequestException, Body, Controller, Get, HttpStatus, Logger, ParseBoolPipe, ParseIntPipe, ParseUUIDPipe, Query, Req, UseFilters, UseGuards } from "@nestjs/common";
import { 
    ApiBadRequestResponse, 
    ApiInternalServerErrorResponse, 
    ApiOkResponse, 
    ApiOperation, 
    ApiQuery, 
    ApiSecurity, 
    ApiTags, 
    ApiTooManyRequestsResponse, 
    ApiUnauthorizedResponse 
} from "@nestjs/swagger";
import { number } from "zod";
import { PublicUsersStatisticsService } from "./public-users-statistics.service.js";
import { HttpAllExceptionsFilter } from "../../filters/HttpAllExceptionsFilter.js";
import { PublicApiAuthGuard } from "../../../modules/users-api/guards/public-api-auth.guard.js";
import { IpThrottlerGuard } from "../../../modules/auth/guards/ip-throttler/ip-throttler.guard.js";
import { UserThrottlerGuard } from "../../../modules/auth/guards/user-throttler/user-throttler.guard.js";
import { PublicUsersService } from "../users/public-users.service.js";
import { PublicUserAndProfileDto } from "../users/dtos/public-user-and-profile.dto.js";
import { logError } from "../../../utility/logError.js";
import { Throttle } from "@nestjs/throttler";
import { byRoleHttp } from "../../../utility/by-role.helper.js";

@Controller('public-api/user-statistics')
@ApiTags("User Statistics")
@ApiSecurity('x-api-key')
@ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing x-api-key' })
@ApiTooManyRequestsResponse({ description: 'Too Many Requests - Rate limit exceeded' })
@UseFilters(HttpAllExceptionsFilter)
@UseGuards(IpThrottlerGuard, PublicApiAuthGuard, UserThrottlerGuard)
export class PublicUsersStatisticsUserController {

    private readonly logger = new Logger(PublicUsersStatisticsUserController.name);

    constructor(
        private readonly publicUserStatsService: PublicUsersStatisticsService,
        private readonly publicUserService: PublicUsersService

    ) {

    }

    @Throttle({
        ip: {
            limit: 100,
            ttl: 60_000
        },
        user: {
            ttl: 60_000,
            limit: byRoleHttp({ADMIN: 50, DEVELOPER: 30, EDITOR: 15, USER: 8})
        }
    })
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

        return this.publicUserStatsService.allUserStats(limit, offset, orderByRank);
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
    @Throttle({
        ip: {
            limit: 200,
            ttl: 60_000
        },
        user: {
            ttl: 60_000,
            limit: byRoleHttp({ADMIN: 200, DEVELOPER: 100, EDITOR: 50, USER: 20})
        }
    })
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
        if (existCount !== 1) {
            throw new BadRequestException('must provide 1 query param only');
        }

        if (email) {
            const result = await this.publicUserService.findByEmail(email);

            return this.publicUserStatsService.findOne(result.id);
        }
        else if (tagId) {
            const result = await this.publicUserService.findByTagId(tagId);

            return this.publicUserStatsService.findOne(result.id);

        }
        else if (userId) {
            return this.publicUserStatsService.findOne(userId);
        }

        throw logError(
            this.logger,
            "error from findUserStats()",
            "invalid logic should not reach here",
            HttpStatus.INTERNAL_SERVER_ERROR
        )


    }

}
