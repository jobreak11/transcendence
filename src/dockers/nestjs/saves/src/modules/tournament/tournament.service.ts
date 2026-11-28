import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { randomInt } from "node:crypto";
import { GameGatewayService } from "../../api/websocket/game-gateway/game-gameway.service.js";
import { GameSettingFormat } from "../lobby/redis/schemas/lobby-gameSettings.redis.schema.js";
import { LobbyRoomType } from "../lobby/redis/schemas/lobby-generalSettings.redis.schema.js";
import { LobbyService } from "../lobby/lobby.service.js";
import { MatchProgress } from "../../api/websocket/game-gateway/dtos/match-progress.dto.js";
import { TournamentDatabaseService } from "./database/tournament-database.service.js";

const GROUP_SIZE = 8;
const ADVANCERS_PER_GROUP = 4;
const ROUND_CHECK_INTERVAL_MS = 1_000;
const ROUND_START_DELAY_MS = 60_000;

@Injectable()
export class TournamentService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TournamentService.name);
  private registrationTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly database: TournamentDatabaseService,
    private readonly lobbyService: LobbyService,
    private readonly gameGatewayService: GameGatewayService,
  ) {}

  onModuleInit() {
    this.registrationTimer = setInterval(() => {
      void this.closeExpiredTournaments().catch((error: unknown) => {
        this.logger.error(
          "Failed to process expired tournament registrations",
          error instanceof Error ? error.stack : String(error),
        );
      });
    }, ROUND_CHECK_INTERVAL_MS);
    void this.closeExpiredTournaments().catch((error: unknown) => {
      this.logger.error(
        "Failed to process expired tournament registrations",
        error instanceof Error ? error.stack : String(error),
      );
    });
  }

  onModuleDestroy() {
    if (this.registrationTimer) clearInterval(this.registrationTimer);
  }

  create(input: {
    name: string;
    registrationEndsAt: Date;
    maxParticipants: number | null;
    requirements: string[];
    prizePools: string[];
  }, hostUserId: string) {
    if (input.registrationEndsAt.getTime() <= Date.now()) {
      throw new ConflictException("Registration end time must be in the future.");
    }
    return this.database.create({ ...input, hostUserId });
  }

  list(viewerUserId: string) {
    return this.database.list(viewerUserId);
  }

  detail(tournamentId: string, viewerUserId: string) {
    return this.database.detail(tournamentId, viewerUserId);
  }

  getMatchOutcome(lobbyPinId: string, userId: string) {
    return this.database.getMatchOutcome(lobbyPinId, userId);
  }

  register(tournamentId: string, userId: string) {
    return this.database.register(tournamentId, userId);
  }

  unregister(tournamentId: string, userId: string) {
    return this.database.unregister(tournamentId, userId);
  }

  async closeRegistration(tournamentId: string, hostUserId: string) {
    if (await this.database.getHostId(tournamentId) !== hostUserId) {
      throw new ForbiddenException("Only the tournament host can close registration.");
    }
    const tournament = await this.database.claimTournament(tournamentId);
    if (!tournament) {
      throw new ConflictException("Tournament registration is already closed.");
    }
    await this.seedFirstRound(tournament.id);
    return this.database.detail(tournament.id, hostUserId);
  }

  async recordMatchResult(
    lobbyPinId: string,
    matchId: string,
    matchProgress: MatchProgress,
  ) {
    if (!matchProgress.matchComplete) return;
    const result = await this.database.completeGroup(
      lobbyPinId,
      matchId,
      matchProgress.playerPlaces,
      ADVANCERS_PER_GROUP,
    );
    if (!result || !result.roundComplete) return;

    try {
      await Promise.all(result.completedLobbyPinIds.map((completedLobbyPinId) =>
        this.lobbyService.removeLobby(completedLobbyPinId)
      ));
    } catch (error) {
      if (result.nextRound !== null) {
        await this.database.cancel(result.tournamentId);
      }
      throw error;
    }
    if (result.nextRound === undefined || result.nextRound === null) return;
    if (result.roundNumber === null) {
      throw new Error("Tournament result is missing the next round number.");
    }

    try {
      await this.createRound(
        result.tournamentId,
        result.roundNumber,
        result.nextRound,
      );
    } catch (error) {
      await this.database.cancel(result.tournamentId);
      throw error;
    }
  }

  private async closeExpiredTournaments() {
    const due = await this.database.claimDueTournaments(new Date());
    for (const tournament of due) {
      try {
        await this.seedFirstRound(tournament.id);
      } catch (error) {
        await this.database.cancel(tournament.id);
        this.logger.error(
          `Failed to seed tournament ${tournament.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }

  private async seedFirstRound(tournamentId: string) {
    const participants = await this.database.participants(tournamentId);
    if (participants.length < 2) {
      await this.database.cancel(tournamentId);
      return;
    }
    try {
      await this.createRound(
        tournamentId,
        1,
        this.shuffle(participants.map(({ userId }) => userId)),
      );
    } catch (error) {
      await this.database.cancel(tournamentId);
      throw error;
    }
  }

  private async createRound(
    tournamentId: string,
    roundNumber: number,
    participantIds: string[],
  ) {
    if (participantIds.length < 2) {
      await this.database.cancel(tournamentId);
      return;
    }

    const playerGroups = this.splitIntoBalancedGroups(this.shuffle(participantIds));
    let startAt: Date;
    let roundSaved = false;
    const createdLobbyIds: string[] = [];

    try {
      const groups: { lobbyPinId: string; players: string[] }[] = [];
      for (const players of playerGroups) {
        const hostUserId = players[0];
        if (!hostUserId) throw new Error("Cannot create an empty tournament table.");
        const lobby = await this.lobbyService.createTournamentLobby(hostUserId, {
          details: { createdByUserId: hostUserId },
          generalSettings: {
            catchPhrase: `Tournament ${tournamentId.slice(0, 8)} · Round ${roundNumber}`,
            roomType: LobbyRoomType.TOURNAMENT,
            password: null,
          },
          gameSettings: {
            maxPlayer: players.length,
            maxSpectator: 0,
            format: GameSettingFormat.PRO,
          },
        });
        const lobbyPinId = lobby.details.roomPinId;
        createdLobbyIds.push(lobbyPinId);
        for (const userId of players.slice(1)) {
          await this.lobbyService.joinTournamentLobby(userId, lobbyPinId);
        }
        groups.push({ lobbyPinId, players });
      }

      startAt = new Date(Date.now() + ROUND_START_DELAY_MS);
      await this.database.saveRound({
        tournamentId,
        roundNumber,
        startAt,
        groups,
      });
      roundSaved = true;

      for (const { lobbyPinId } of groups) {
        await this.gameGatewayService.scheduleTournamentFirstHand(lobbyPinId, startAt);
        await this.lobbyService.prepareTournamentLobby(lobbyPinId);
      }
    } catch (error) {
      if (roundSaved) {
        try {
          await this.database.deleteRound(tournamentId, roundNumber);
        } catch (cleanupError) {
          this.logger.error(
            `Failed to remove incomplete tournament round ${roundNumber}`,
            cleanupError instanceof Error ? cleanupError.stack : String(cleanupError),
          );
        }
      }
      await Promise.all(createdLobbyIds.map(async (lobbyPinId) => {
        await this.gameGatewayService.cancelScheduledTournamentStart(lobbyPinId);
        await this.lobbyService.removeLobby(lobbyPinId).catch((cleanupError: unknown) => {
          this.logger.error(
            `Failed to clean up tournament lobby ${lobbyPinId}`,
            cleanupError instanceof Error ? cleanupError.stack : String(cleanupError),
          );
        });
      }));
      throw error;
    }
  }

  private splitIntoBalancedGroups(playerIds: string[]) {
    const groupCount = Math.ceil(playerIds.length / GROUP_SIZE);
    const baseSize = Math.floor(playerIds.length / groupCount);
    const largerGroupCount = playerIds.length % groupCount;
    const groups: string[][] = [];
    let offset = 0;

    for (let index = 0; index < groupCount; index += 1) {
      const size = baseSize + (index < largerGroupCount ? 1 : 0);
      groups.push(playerIds.slice(offset, offset + size));
      offset += size;
    }
    return groups;
  }

  private shuffle<T>(values: T[]): T[] {
    const shuffled = [...values];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = randomInt(index + 1);
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex]!, shuffled[index]!];
    }
    return shuffled;
  }
}
