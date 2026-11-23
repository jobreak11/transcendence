import { BadRequestException, Controller, Get, InternalServerErrorException, Logger, ParseIntPipe, ParseUUIDPipe, Query, Req, UseFilters, UseGuards } from "@nestjs/common";
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
import { PublicUsersService } from "./public-users.service.js";
import { IpThrottlerGuard } from "../../../modules/auth/guards/ip-throttler/ip-throttler.guard.js";
import { PublicApiAuthGuard } from "../../../modules/users-api/guards/public-api-auth.guard.js";
import { UserThrottlerGuard } from "../../../modules/auth/guards/user-throttler/user-throttler.guard.js";
import { RolesGuard } from "../../../modules/auth/guards/roles/roles.guard.js";
import { InternalUsersService } from "../../internal/users/internal-users.service.js";
import { HttpAllExceptionsFilter } from "../../filters/HttpAllExceptionsFilter.js";
import { Throttle } from "@nestjs/throttler";
import { byRoleHttp } from "../../../utility/by-role.helper.js";

@ApiTags('Users API')
@UseGuards(
    IpThrottlerGuard,
    PublicApiAuthGuard,
    UserThrottlerGuard,
//    RolesGuard, // Roles guard would prevent fsome endpoint for specific role only
)
@ApiSecurity('x-api-key')
@ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing x-api-key' })
@ApiTooManyRequestsResponse({ description: 'Too Many Requests - Rate limit exceeded' })
@UseFilters(HttpAllExceptionsFilter)
@Controller('public-api/users')
export class PublicUsersUserController {

    private readonly logger = new Logger(PublicUsersUserController.name);

    constructor(
        private readonly publicUsersService: PublicUsersService,
        private readonly internUsersService: InternalUsersService
    ) {

    }

    /*
    Get users informations of all users
    
    */
    @ApiOperation({ 
        summary: 'Get all users', 
        description: 'Retrieve information of all users with optional pagination. Rate limits: IP (100/min), Role-based (ADMIN: 50, DEVELOPER: 30, EDITOR: 15, USER: 8 per min).' 
    })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of users to return (0 - 1000)', example: 20 })
    @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of users to skip (>= 0)', example: 0 })
    @ApiOkResponse({ description: 'Successfully retrieved list of users' })
    @ApiBadRequestResponse({ description: 'Invalid limit and offset value (limit must be 0-1000, offset >= 0)' })
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
    @Get()
    endpoint1(
        @Req() req: any,
        @Query('limit', new ParseIntPipe({optional: true})) limit?: number,
        @Query('offset', new ParseIntPipe({optional: true})) offset?: number
    ) {

        if ((limit && (limit < 0 || limit > 1000)) || (offset && offset < 0)) {
            throw new BadRequestException("invalid limit and offset value");
        }

        return this.publicUsersService.getAllUsers(limit, offset);
    }

    @ApiOperation({ 
        summary: 'Find a user by ID, email, or tag ID', 
        description: 'Find a specific user. Exactly ONE query parameter (userId, email, or tagId) must be provided. Rate limits: IP (200/min), Role-based (ADMIN: 100, DEVELOPER: 70, EDITOR: 50, USER: 30 per min).' 
    })
    @ApiQuery({ name: 'userId', required: false, type: String, format: 'uuid', description: 'UUID of the user (provide only 1 of userId, email, or tagId)' })
    @ApiQuery({ name: 'email', required: false, type: String, description: 'Email address of the user (provide only 1 of userId, email, or tagId)' })
    @ApiQuery({ name: 'tagId', required: false, type: String, description: 'Tag ID of the user (provide only 1 of userId, email, or tagId)' })
    @ApiOkResponse({ description: 'Successfully found user information' })
    @ApiBadRequestResponse({ description: 'Must provide 1 query param only, or invalid UUID format for userId' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    @Throttle({
        ip: {
            limit: 200,
            ttl: 60_000
        },
        user: {
            ttl: 60_000,
            limit: byRoleHttp({ADMIN: 100, DEVELOPER: 70, EDITOR: 50, USER: 30})
        }
    })
    @Get('find')
    endpoint2(
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

        if (userId) {
            return this.publicUsersService.findById(userId);


        }
        else if (email) {
            return this.publicUsersService.findByEmail(email);
        }

        else if (tagId) {
            return this.publicUsersService.findByTagId(tagId);
        }

        throw new InternalServerErrorException("logic error, none should be here")
    }


    @ApiOperation({ 
        summary: 'Get total user count', 
        description: 'Returns the total count of users. Rate limits: IP (400/min), Role-based (ADMIN: 400, DEVELOPER: 300, EDITOR: 200, USER: 100 per min).' 
    })
    @ApiOkResponse({ description: 'Successfully retrieved total user count' })
    @Throttle({
        ip: {
            limit: 400,
            ttl: 60_000
        },
        user: {
            ttl: 60_000,
            limit: byRoleHttp({ADMIN: 400, DEVELOPER: 300, EDITOR: 200, USER: 100})
        }
    })
    @Get('totalCount')
    totalUserCount() {

        return this.publicUsersService.getTotalCountUser();

    }


}
