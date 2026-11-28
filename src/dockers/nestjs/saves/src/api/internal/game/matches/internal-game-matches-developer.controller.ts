import { BadRequestException, Controller, Get, Logger, ParseIntPipe, Query, Req, UseFilters, UseGuards } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { UserThrottlerGuard } from "../../../../modules/auth/guards/user-throttler/user-throttler.guard.js";
import { IpThrottlerGuard } from "../../../../modules/auth/guards/ip-throttler/ip-throttler.guard.js";
import { JwtAuthGuard } from "../../../../modules/auth/guards/jwt-auth/jwt-auth.guard.js";
import { RolesGuard } from "../../../../modules/auth/guards/roles/roles.guard.js";
import { ApiTags } from "@nestjs/swagger";
import { HttpAllExceptionsFilter } from "../../../filters/HttpAllExceptionsFilter.js";
import { Roles } from "../../../../modules/auth/decorators/roles.decorators.js";
import { Role } from "../../../../modules/auth/enums/role.enum.js";
import { InternalGameMatchesService } from "./internal-game-matches.service.js";

@ApiTags("Game Matches")
@Controller('game/matches/dev')
@Roles(Role.ADMIN, Role.DEVELOPER)
@UseGuards(IpThrottlerGuard, JwtAuthGuard, RolesGuard, UserThrottlerGuard)
@UseFilters(HttpAllExceptionsFilter)
export class InternalGameMatchesDeveloperController {

	private readonly logger = new Logger(InternalGameMatchesDeveloperController.name);

	constructor(
		private readonly internalGameMatchesService: InternalGameMatchesService
	) {

	}

	@Get()
	async allMatches(
		@Req() req: any,
		@Query('limit', new ParseIntPipe({optional: true})) limit?: number,
		@Query('offset', new ParseIntPipe({optional: true})) offset?: number
	) {

		if ((limit && (limit < 0 || limit > 1000)) || (offset && offset < 0)) {
			throw new BadRequestException("invalid request params");
		}

		return this.internalGameMatchesService.getAllMatches(limit, offset);
	}

}