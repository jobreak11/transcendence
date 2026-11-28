import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, HttpStatus, InternalServerErrorException, Logger, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Req, UseFilters, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { InternalUsersApiService } from "./internal-users-api.service.js";
import { HttpAllExceptionsFilter } from "../../filters/HttpAllExceptionsFilter.js";
import { IpThrottlerGuard } from "../../../modules/auth/guards/ip-throttler/ip-throttler.guard.js";
import { PublicApiAuthGuard } from "../../../modules/users-api/guards/public-api-auth.guard.js";
import { PublicApiThrottlerGuard } from "../../../modules/users-api/guards/public-api-throttler.guard.js";
import { RolesGuard } from "../../../modules/auth/guards/roles/roles.guard.js";
import { JwtAuthGuard } from "../../../modules/auth/guards/jwt-auth/jwt-auth.guard.js";
import { UserThrottlerGuard } from "../../../modules/auth/guards/user-throttler/user-throttler.guard.js";
import { Roles } from "../../../modules/auth/decorators/roles.decorators.js";
import { Role } from "../../../modules/auth/enums/role.enum.js";
import { logError } from "../../../utility/logError.js";


@ApiTags("Api Request")
@Controller('users-api/admin')
@UseGuards(IpThrottlerGuard, JwtAuthGuard, RolesGuard, UserThrottlerGuard)
@Roles(Role.ADMIN)
@UseFilters(HttpAllExceptionsFilter)
export class InternalUsersApiDeveloperController {

    private readonly logger = new Logger(InternalUsersApiDeveloperController.name);

    constructor(
        private readonly internalUsersApiService: InternalUsersApiService,
    ) {

    }

    // ONLY ADMIN AND DEVELOPER CAN DO SOMETHING WITH PUBLIC API

    // info of all api
    @Get('all')
    allApis(
        @Req() req:any,
        @Query('limit', new ParseIntPipe({optional: true})) limit?: number,
        @Query('offset', new ParseIntPipe({optional: true})) offset?: number
    ) {

        if ((limit && (limit < 0 || limit > 1000)) || (offset && offset < 0)) {
            throw new BadRequestException("invalid limit and offset value");
        }

        return this.internalUsersApiService.allApis(limit, offset);
    }

    // only admin can see all
    @Get('allApiCount')
    totalAllApiCount(
        @Req() req: any
    ) {
        return this.internalUsersApiService.totalApiCount();
    }

    @Delete('delete')
    async deleteByApiId(
        @Req() req: any,
        @Query('apiId', ParseUUIDPipe) apiId: string
    ) {

        return this.internalUsersApiService.removeApiKey(apiId);
    }

    @Get('find')
    findApi(
        @Req() req: any,
        @Query('apiId', new ParseUUIDPipe({optional: true})) apiId?: string,
        @Query('apiKey') apiKey?: string
    ) {

        if ((apiId && apiKey) || (!apiId && !apiKey)) {
            throw new BadRequestException("must provide only one of parameters")
        }

        if (apiId) {
            return this.internalUsersApiService.findOneById(apiId);
        }
        else if (apiKey) {
            return this.internalUsersApiService.findOneByRawApiKey(apiKey);
        }

        throw logError(
            this.logger,
            'error from findApi()',
            "logic should not be here",
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }

    





}