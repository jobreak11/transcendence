import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseFilters,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { z } from "zod";
import { HttpAllExceptionsFilter } from "../../filters/HttpAllExceptionsFilter.js";
import { JwtAuthGuard } from "../../../modules/auth/guards/jwt-auth/jwt-auth.guard.js";
import { ThrottlerGuard } from "@nestjs/throttler";
import { InternalLobbyGuard } from "../lobby/internal-lobby.guard.js";
import { ZodValidationPipe } from "../../../pipes/ZodValidationPipe.js";
import { TournamentService } from "../../../modules/tournament/tournament.service.js";

const createTournamentSchema = z.strictObject({
  name: z.string().trim().min(2).max(100),
  registrationEndsAt: z.coerce.date(),
  maxParticipants: z.number().int().min(2).max(100_000).nullable().optional(),
});

type AuthenticatedRequest = { user: { id: string } };

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, InternalLobbyGuard, ThrottlerGuard)
@UseFilters(HttpAllExceptionsFilter)
@Controller("tournament")
export class InternalTournamentController {
  constructor(private readonly tournamentService: TournamentService) {}

  @Get()
  @ApiOperation({ summary: "List tournaments" })
  list(@Req() request: AuthenticatedRequest) {
    return this.tournamentService.list(request.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a tournament" })
  create(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createTournamentSchema))
    body: z.infer<typeof createTournamentSchema>,
  ) {
    return this.tournamentService.create({
      name: body.name,
      registrationEndsAt: body.registrationEndsAt,
      maxParticipants: body.maxParticipants ?? null,
    }, request.user.id);
  }

  @Get(":tournamentId")
  @ApiOperation({ summary: "Get tournament details and bracket" })
  detail(
    @Req() request: AuthenticatedRequest,
    @Param("tournamentId", new ParseUUIDPipe({ version: "all" })) tournamentId: string,
  ) {
    return this.tournamentService.detail(tournamentId, request.user.id);
  }

  @Post(":tournamentId/register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register for a tournament" })
  register(
    @Req() request: AuthenticatedRequest,
    @Param("tournamentId", new ParseUUIDPipe({ version: "all" })) tournamentId: string,
  ) {
    return this.tournamentService.register(tournamentId, request.user.id);
  }

  @Delete(":tournamentId/register")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Unregister before registration closes" })
  unregister(
    @Req() request: AuthenticatedRequest,
    @Param("tournamentId", new ParseUUIDPipe({ version: "all" })) tournamentId: string,
  ) {
    return this.tournamentService.unregister(tournamentId, request.user.id);
  }

  @Post(":tournamentId/close-registration")
  @ApiOperation({ summary: "Close registration and seed the first round" })
  closeRegistration(
    @Req() request: AuthenticatedRequest,
    @Param("tournamentId", new ParseUUIDPipe({ version: "all" })) tournamentId: string,
  ) {
    return this.tournamentService.closeRegistration(tournamentId, request.user.id);
  }
}
