import { BadRequestException, Controller, Get, Logger, ParseIntPipe, ParseUUIDPipe, Query, Req, UseFilters, UseGuards } from "@nestjs/common";
import { IpThrottlerGuard } from "../../../../modules/auth/guards/ip-throttler/ip-throttler.guard.js";
import { JwtAuthGuard } from "../../../../modules/auth/guards/jwt-auth/jwt-auth.guard.js";
import { UserThrottlerGuard } from "../../../../modules/auth/guards/user-throttler/user-throttler.guard.js";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { HttpAllExceptionsFilter } from "../../../filters/HttpAllExceptionsFilter.js";
import { InternalGameMatchesService } from "./internal-game-matches.service.js";

@ApiBearerAuth()
@ApiTags("Game Matches")
@Controller('game/matches')
@UseFilters(HttpAllExceptionsFilter)
@UseGuards(IpThrottlerGuard, JwtAuthGuard, UserThrottlerGuard)
export class InternalGameMatchesUserController {
   
    private readonly logger = new Logger(InternalGameMatchesUserController.name);

    constructor(
        private readonly internalGameMatchesService: InternalGameMatchesService
    ) {
    }

    @ApiOperation({
        summary: "get the game matches data of the user"
    })
    @Get()
    getMatches(
        @Req() req: any,
        @Query('limit', new ParseIntPipe({optional: true})) limit?: number,
        @Query('offset', new ParseIntPipe({optional: true})) offset?: number,
        @Query('userId', new ParseUUIDPipe({optional: true})) userId?: string,
    ) {

        if ((limit && (limit < 0 || limit > 1000)) || (offset && offset < 0)) {
            throw new BadRequestException("too much data to retrieve for one request");
        }

        if (userId) {
            return this.internalGameMatchesService.getMatches(userId, limit, offset);
        }
        else {
            return this.internalGameMatchesService.getMatches(req.user.id, limit, offset);
        }
    }

    @Get('find')
    findMatch(
        @Req() req: any,
        @Query('gameMatchId', ParseUUIDPipe) gameMatchId: string
    ) {

        return this.internalGameMatchesService.findMatch(gameMatchId, req.user.id);
    }

}