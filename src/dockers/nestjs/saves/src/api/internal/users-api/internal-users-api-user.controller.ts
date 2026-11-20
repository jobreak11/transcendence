import { BadRequestException, Body, ConflictException, Controller, Delete, ForbiddenException, Get, HttpStatus, Logger, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Req, UseFilters, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { InternalUsersApiService } from "./internal-users-api.service.js";
import { IpThrottlerGuard } from "../../../modules/auth/guards/ip-throttler/ip-throttler.guard.js";
import { HttpAllExceptionsFilter } from "../../filters/HttpAllExceptionsFilter.js";
import { JwtAuthGuard } from "../../../modules/auth/guards/jwt-auth/jwt-auth.guard.js";
import { UserThrottlerGuard } from "../../../modules/auth/guards/user-throttler/user-throttler.guard.js";
import { RolesGuard } from "../../../modules/auth/guards/roles/roles.guard.js";
import { Roles } from "../../../modules/auth/decorators/roles.decorators.js";
import { Role } from "../../../modules/auth/enums/role.enum.js";
import { ZodValidationPipe } from "../../../pipes/ZodValidationPipe.js";
import { UsersApiCreateDto, usersApiCreateSchema } from "../../../modules/users-api/database/dtos/users-api-create.dto.js";
import { USER_API_DEVELOPER_API_LIMIT, USER_API_EDITOR_API_LIMIT, USER_API_USER_API_LIMIT } from "./internal-users-api.constants.js";
import { userApisRevokeSchema, UsersApiRevokeDto } from "./dtos/users-api-revoke.dto.js";
import { UsersApiRemoveDto, usersApiRemoveSchema } from "./dtos/users-api-remove.dto.js";
import { logError } from "../../../utility/logError.js";
import { UsersApiKeyNoHashedDto } from "./dtos/users-api-key-no-hashed.dto.js";

@ApiTags("Api Request")
@Controller('users-api')
@UseGuards(IpThrottlerGuard, JwtAuthGuard, RolesGuard, UserThrottlerGuard)
@UseFilters(HttpAllExceptionsFilter)
export class InternalUsersApiUserController {

    private readonly logger = new Logger(InternalUsersApiUserController.name);

    constructor(
        private readonly internalUsersApiService: InternalUsersApiService,
    ) {

    }

    // info of your api
    @Get()
    yourApis(
        @Req() req: any,
        @Query('limit', new ParseIntPipe({optional: true})) limit?: number,
        @Query('offset', new ParseIntPipe({optional: true})) offset?: number
    ) {

        if ((limit && (limit < 0 || limit > 1000)) || (offset && offset < 0)) {
            throw new BadRequestException("invalid limit and offset value");
        }

        return this.internalUsersApiService.userApiKeys(req.user.id, limit, offset);
    }

    @Post('request-new')
    async requestNewApi(
        @Req() req: any,
        @Body(new ZodValidationPipe(usersApiCreateSchema)) body: UsersApiCreateDto

    ) {

        if (req.user.role !== Role.ADMIN) {
            // developer cannot create too much api key

            const countResult = await this.internalUsersApiService.totalUserApiCount(req.user.id);

            if (req.user.role === Role.DEVELOPER && countResult.totalCount >= USER_API_DEVELOPER_API_LIMIT) {
                throw new ForbiddenException(`cannot request any more api key, try removing old ones`);
            }
            else if (req.user.role === Role.EDITOR && countResult.totalCount >= USER_API_EDITOR_API_LIMIT) {
                throw new ForbiddenException(`cannot request any more api key, try removing old ones`);
            }
            else if (req.user.role === Role.USER && countResult.totalCount >= USER_API_USER_API_LIMIT) {
                throw new ForbiddenException(`cannot request any more api key, try removing old ones`);
            }
        }

        return this.internalUsersApiService.createOne(req.user.id, body);
    }

    @Get('totalUserApiCount')
    totalUserApiCount(
        @Req() req:any,
        @Query('userId', new ParseUUIDPipe({optional: true})) userId?: string
    ) {

        if (req.user.role === Role.DEVELOPER) {
            if (userId) {
                throw new ForbiddenException("DEVELOPER ROLE cannot look to other user api information")
            }
        }

        if (userId) {
            return this.internalUsersApiService.totalUserApiCount(userId);
        }
        else {
            return this.internalUsersApiService.totalUserApiCount(req.user.id);
        }
    }

    @Patch('revoke')
    async revokeApi(
        @Req() req: any,
        @Query('apiId', ParseUUIDPipe) apiId: string
    ) {

        const foundApiData = await this.internalUsersApiService.findOneById(apiId);

        console.error(foundApiData);

        if (foundApiData.isRevoked === true) {
            throw new ConflictException("this api key is already revoked")
        }
        if (req.user.role !== Role.ADMIN) {

            if (foundApiData.userId !== req.user.id) {
                throw new ForbiddenException("DEVELOPER role cannot revoke this api key")
            }
        }

        const result = await this.internalUsersApiService.revokeApiKey(foundApiData.id);


        return result;
    }

    @Delete('remove')
    async removeApi(
        @Req() req: any,
        @Query('apiId', ParseUUIDPipe) apiId: string
    ) {


        const foundApiData = await this.internalUsersApiService.findOneById(apiId);

        if (req.user.role === Role.DEVELOPER) {

            if (foundApiData.userId !== req.user.id) {
                throw new ForbiddenException("DEVELOPER role cannot remove this api key")
            }
        }


        const result = await this.internalUsersApiService.removeApiKey(foundApiData.id);

        return result;
    }

    @Get('find')
    async findApi(
        @Req() req: any,
        @Query('apiId', new ParseUUIDPipe({optional: true})) apiId?: string,
        @Query('apiKey') apiKey?: string
    ) {

        if ((apiId && apiKey) || (!apiId && !apiKey)) {
            throw new BadRequestException("must provide only one of parameters")
        }

        let result: UsersApiKeyNoHashedDto | null = null;

        if (apiId) {
            result = await this.internalUsersApiService.findOneById(apiId);
        }
        else if (apiKey) {
            result = await this.internalUsersApiService.findOneByRawApiKey(apiKey);
        }

        if (result === null) {
            throw logError(
                this.logger,
                'error from findApi()',
                "logic should not be here",
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        if (result.userId !== req.user.id) {
            throw new ForbiddenException("cannot look into this api key data");
        }

        return result;
    }

}