import { BadRequestException, Controller, Get, Logger, ParseIntPipe, ParseUUIDPipe, Query, Req, UseFilters, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { HttpAllExceptionsFilter } from "../../filters/HttpAllExceptionsFilter.js";
import { IpThrottlerGuard } from "../../../modules/auth/guards/ip-throttler/ip-throttler.guard.js";
import { JwtAuthGuard } from "../../../modules/auth/guards/jwt-auth/jwt-auth.guard.js";
import { UserThrottlerGuard } from "../../../modules/auth/guards/user-throttler/user-throttler.guard.js";
import { InternalTrophiesService } from "./internal-trophies.service.js";
import { GetTrophyDto } from "./dtos/get-trophy.dto.js";

@ApiTags('Trophies')
@Controller('trophies')
@UseFilters(HttpAllExceptionsFilter)
@UseGuards(IpThrottlerGuard, JwtAuthGuard, UserThrottlerGuard)
export class InternalTrophiesUserController {

    private readonly logger = new Logger(InternalTrophiesUserController.name);

    constructor(
        private readonly internalTrophiesService: InternalTrophiesService,
    ) {

    }


    @Get()
    // all the trophies of the targeted user
    allUserThrophies(
        @Req() req:any,

        @Query('limit', new ParseIntPipe({optional: true})) limit?: number,
        @Query('offset', new ParseIntPipe({optional: true})) offset?: number,
        // if not provided will be the requester user
        @Query('userId', new ParseUUIDPipe({optional: true})) userId? :string
    ) {

        if ((limit && (limit < 0 || limit > 1000)) || (offset && offset < 0)) {
            throw new BadRequestException("invalid limit and offset");
        }

        if (userId) {
            return this.internalTrophiesService.getUserTrophies(userId, limit, offset);
        }
        else {
            return this.internalTrophiesService.getUserTrophies(req.user.id, limit, offset);
        }
    }

    @Get('totalUserCount')
    totalTrophiesCount(
        @Req() req: any,
        @Query('userId', new ParseUUIDPipe({optional: true})) userId?: string
    ) {
        if (userId) {
            return this.internalTrophiesService.getAllUserTrophiesCount(userId);
        }
        else {
            return this.internalTrophiesService.getAllUserTrophiesCount(req.user.id);
        }
    }

    @Get('allTotalCount')
    allTotalCount(
        @Req() req: any,
    ) {
        return this.internalTrophiesService.getAllTrophiesCount();
    }

    @Get('find')
    findOneTrophy(
        @Req() req: any,
        @Query('trophyId', ParseUUIDPipe) trophyId: string
    ): Promise<GetTrophyDto> {

        return this.internalTrophiesService.findOneTrophy(trophyId)
    }

}