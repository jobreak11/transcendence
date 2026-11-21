import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, count, desc, eq, lte } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DRIZZLE } from "../../../infrastructure/drizzle/drizzle.module.js";
import { dbRelations } from "../../../infrastructure/drizzle/schema/schema.js";
import { users } from "../../../infrastructure/drizzle/schema/users/users.schema.js";
import { user_profiles } from "../../../infrastructure/drizzle/schema/user_profiles/user_profiles.schema.js";
import {
  TournamentGroupStatus,
  TournamentRoundStatus,
  TournamentStatus,
  tournamentGroupPlayers,
  tournamentGroups,
  tournamentParticipants,
  tournamentRounds,
  tournaments,
} from "../../../infrastructure/drizzle/schema/tournaments/tournaments.schema.js";

type TournamentGroupView = {
  id: string;
  groupNumber: number;
  lobbyPinId: string;
  startAt: Date;
  status: TournamentGroupStatus;
  players: { userId: string; username: string; place: number | null; qualified: boolean }[];
};

@Injectable()
export class TournamentDatabaseService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof dbRelations>,
  ) {}

  create(
    input: {
      name: string;
      hostUserId: string;
      registrationEndsAt: Date;
      maxParticipants: number | null;
    },
  ) {
    return this.db.insert(tournaments).values(input).returning().then(([created]) => {
      if (!created) throw new Error("Tournament creation returned no row.");
      return created;
    });
  }

  async list(viewerUserId: string) {
    const records = await this.db
      .select()
      .from(tournaments)
      .orderBy(tournaments.registrationEndsAt);
    const [counts, viewerRegistrations] = await Promise.all([
      this.db
        .select({
          tournamentId: tournamentParticipants.tournamentId,
          participantCount: count(),
        })
        .from(tournamentParticipants)
        .groupBy(tournamentParticipants.tournamentId),
      this.db
        .select({ tournamentId: tournamentParticipants.tournamentId })
        .from(tournamentParticipants)
        .where(eq(tournamentParticipants.userId, viewerUserId)),
    ]);
    const countByTournament = new Map<string, number>();
    for (const { tournamentId, participantCount } of counts) {
      countByTournament.set(tournamentId, participantCount);
    }
    const registeredTournamentIds = new Set<string>();
    for (const { tournamentId } of viewerRegistrations) {
      registeredTournamentIds.add(tournamentId);
    }

    return records.map((record) => ({
      ...record,
      participantCount: countByTournament.get(record.id) ?? 0,
      isHost: record.hostUserId === viewerUserId,
      isRegistered: registeredTournamentIds.has(record.id),
    }));
  }

  async detail(tournamentId: string, viewerUserId: string) {
    const [tournament] = await this.db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .limit(1);
    if (!tournament) throw new NotFoundException("Tournament not found.");

    const [participants, rounds, groupRows] = await Promise.all([
      this.db
        .select({
          userId: tournamentParticipants.userId,
          registeredAt: tournamentParticipants.registeredAt,
          finalPlace: tournamentParticipants.finalPlace,
        })
        .from(tournamentParticipants)
        .where(eq(tournamentParticipants.tournamentId, tournamentId)),
      this.db
        .select()
        .from(tournamentRounds)
        .where(eq(tournamentRounds.tournamentId, tournamentId))
        .orderBy(tournamentRounds.roundNumber),
      this.db
        .select({
          roundId: tournamentRounds.id,
          roundNumber: tournamentRounds.roundNumber,
          groupId: tournamentGroups.id,
          groupNumber: tournamentGroups.groupNumber,
          lobbyPinId: tournamentGroups.lobbyPinId,
          startAt: tournamentGroups.startAt,
          status: tournamentGroups.status,
          userId: tournamentGroupPlayers.userId,
          place: tournamentGroupPlayers.place,
          qualified: tournamentGroupPlayers.qualified,
        })
        .from(tournamentRounds)
        .innerJoin(tournamentGroups, eq(tournamentGroups.roundId, tournamentRounds.id))
        .innerJoin(tournamentGroupPlayers, eq(tournamentGroupPlayers.groupId, tournamentGroups.id))
        .where(eq(tournamentRounds.tournamentId, tournamentId))
        .orderBy(tournamentRounds.roundNumber, tournamentGroups.groupNumber),
    ]);

    const playerRows = await this.db
      .select({
        userId: tournamentParticipants.userId,
        tagId: users.tagId,
        displayName: user_profiles.displayName,
      })
      .from(tournamentParticipants)
      .innerJoin(users, eq(users.id, tournamentParticipants.userId))
      .leftJoin(user_profiles, eq(user_profiles.userId, users.id))
      .where(eq(tournamentParticipants.tournamentId, tournamentId));
    const tagByUserId = new Map<string, string>();
    const usernameByUserId = new Map<string, string>();
    for (const { userId, tagId, displayName } of playerRows) {
      tagByUserId.set(userId, tagId);
      usernameByUserId.set(userId, displayName?.trim() || tagId);
    }
    const participantByUserId = new Map<string, {
      userId: string;
      registeredAt: Date;
      finalPlace: number | null;
      tagId: string;
    }>();
    for (const participant of participants) {
      participantByUserId.set(participant.userId, {
        ...participant,
        tagId: tagByUserId.get(participant.userId) ?? participant.userId,
      });
    }
    const groupMap = new Map<string, TournamentGroupView>();

    for (const row of groupRows) {
      let group = groupMap.get(row.groupId);
      if (!group) {
        group = {
          id: row.groupId,
          groupNumber: row.groupNumber,
          lobbyPinId: row.lobbyPinId,
          startAt: row.startAt,
          status: row.status,
          players: [],
        };
        groupMap.set(row.groupId, group);
      }
      group.players.push({
        userId: row.userId,
        username: usernameByUserId.get(row.userId) ?? tagByUserId.get(row.userId) ?? row.userId,
        place: row.place,
        qualified: row.qualified,
      });
    }

    const groupsByRound = new Map<number, TournamentGroupView[]>();
    for (const row of groupRows) {
      const group = groupMap.get(row.groupId);
      if (!group) continue;
      const roundGroups = groupsByRound.get(row.roundNumber) ?? [];
      if (!roundGroups.some(({ id }) => id === group.id)) roundGroups.push(group);
      groupsByRound.set(row.roundNumber, roundGroups);
    }

    const currentGroup = [...groupMap.values()].find((group) =>
      group.status === TournamentGroupStatus.IN_PROGRESS
      && group.players.some(({ userId }) => userId === viewerUserId)
    );

    return {
      ...tournament,
      participantCount: participants.length,
      isHost: tournament.hostUserId === viewerUserId,
      isRegistered: participantByUserId.has(viewerUserId),
      participants: [...participantByUserId.values()],
      rounds: rounds.map((round) => ({
        ...round,
        groups: groupsByRound.get(round.roundNumber) ?? [],
      })),
      currentLobbyPinId: currentGroup?.lobbyPinId ?? null,
    };
  }

  async register(tournamentId: string, userId: string) {
    return this.db.transaction(async (tx) => {
      const [tournament] = await tx
        .select()
        .from(tournaments)
        .where(eq(tournaments.id, tournamentId))
        .for("update")
        .limit(1);
      if (!tournament) throw new NotFoundException("Tournament not found.");
      if (
        tournament.status !== TournamentStatus.OPEN
        || tournament.registrationEndsAt.getTime() <= Date.now()
      ) {
        throw new ConflictException("Tournament registration is closed.");
      }

      const [countRow] = await tx
        .select({ participantCount: count() })
        .from(tournamentParticipants)
        .where(eq(tournamentParticipants.tournamentId, tournamentId));
      if (!countRow) throw new Error("Tournament participant count query returned no result.");
      const { participantCount } = countRow;
      if (
        tournament.maxParticipants !== null
        && participantCount >= tournament.maxParticipants
      ) {
        throw new ConflictException("Tournament is full.");
      }

      const [participant] = await tx
        .insert(tournamentParticipants)
        .values({ tournamentId, userId })
        .onConflictDoNothing()
        .returning();
      if (!participant) throw new ConflictException("You are already registered.");
      return participant;
    });
  }

  async unregister(tournamentId: string, userId: string) {
    await this.db.transaction(async (tx) => {
      const [tournament] = await tx
        .select()
        .from(tournaments)
        .where(eq(tournaments.id, tournamentId))
        .for("update")
        .limit(1);
      if (!tournament) throw new NotFoundException("Tournament not found.");
      if (
        tournament.status !== TournamentStatus.OPEN
        || tournament.registrationEndsAt.getTime() <= Date.now()
      ) {
        throw new ConflictException("Tournament registration is closed.");
      }
      await tx
        .delete(tournamentParticipants)
        .where(and(
          eq(tournamentParticipants.tournamentId, tournamentId),
          eq(tournamentParticipants.userId, userId),
        ));
    });
  }

  async claimDueTournaments(now: Date) {
    return this.db
      .update(tournaments)
      .set({ status: TournamentStatus.SEEDING })
      .where(and(
        eq(tournaments.status, TournamentStatus.OPEN),
        lte(tournaments.registrationEndsAt, now),
      ))
      .returning();
  }

  async claimTournament(tournamentId: string) {
    const [claimed] = await this.db
      .update(tournaments)
      .set({ status: TournamentStatus.SEEDING })
      .where(and(
        eq(tournaments.id, tournamentId),
        eq(tournaments.status, TournamentStatus.OPEN),
      ))
      .returning();
    return claimed ?? null;
  }

  participants(tournamentId: string) {
    return this.db
      .select({ userId: tournamentParticipants.userId })
      .from(tournamentParticipants)
      .where(eq(tournamentParticipants.tournamentId, tournamentId));
  }

  async saveRound(input: {
    tournamentId: string;
    roundNumber: number;
    startAt: Date;
    groups: {
      lobbyPinId: string;
      players: string[];
    }[];
  }) {
    return this.db.transaction(async (tx) => {
      const [round] = await tx
        .insert(tournamentRounds)
        .values({
          tournamentId: input.tournamentId,
          roundNumber: input.roundNumber,
          startAt: input.startAt,
        })
        .returning();
      if (!round) throw new Error("Tournament round creation returned no row.");

      const groups = await tx
        .insert(tournamentGroups)
        .values(input.groups.map((groupInput, index) => ({
          roundId: round.id,
          groupNumber: index + 1,
          lobbyPinId: groupInput.lobbyPinId,
          startAt: input.startAt,
        })))
        .returning({ id: tournamentGroups.id });
      if (groups.length !== input.groups.length) {
        throw new Error("Tournament group creation returned an incomplete result.");
      }
      const groupPlayers = input.groups.flatMap((groupInput, index) => {
        const group = groups[index];
        if (!group) throw new Error("Tournament group player mapping failed.");
        return groupInput.players.map((userId) => ({ groupId: group.id, userId }));
      });
      await tx.insert(tournamentGroupPlayers).values(groupPlayers);
      await tx
        .update(tournaments)
        .set({
          status: TournamentStatus.IN_PROGRESS,
          ...(input.roundNumber === 1 ? { startedAt: input.startAt } : {}),
        })
        .where(eq(tournaments.id, input.tournamentId));
      return round;
    });
  }

  async cancel(tournamentId: string) {
    await this.db
      .update(tournaments)
      .set({ status: TournamentStatus.CANCELLED })
      .where(eq(tournaments.id, tournamentId));
  }

  async deleteRound(tournamentId: string, roundNumber: number) {
    const [round] = await this.db
      .select({ id: tournamentRounds.id })
      .from(tournamentRounds)
      .where(and(
        eq(tournamentRounds.tournamentId, tournamentId),
        eq(tournamentRounds.roundNumber, roundNumber),
      ))
      .limit(1);
    if (!round) return;
    await this.db
      .delete(tournamentRounds)
      .where(eq(tournamentRounds.id, round.id));
  }

  async completeGroup(
    lobbyPinId: string,
    matchId: string,
    places: Record<string, number>,
    advancersPerGroup: number,
  ) {
    return this.db.transaction(async (tx) => {
      const [group] = await tx
        .select({
          id: tournamentGroups.id,
          roundId: tournamentGroups.roundId,
          status: tournamentGroups.status,
          roundNumber: tournamentRounds.roundNumber,
          tournamentId: tournamentRounds.tournamentId,
        })
        .from(tournamentGroups)
        .innerJoin(tournamentRounds, eq(tournamentRounds.id, tournamentGroups.roundId))
        .where(eq(tournamentGroups.lobbyPinId, lobbyPinId))
        .for("update")
        .limit(1);
      if (!group || group.status === TournamentGroupStatus.COMPLETED) return null;

      const members = await tx
        .select({ userId: tournamentGroupPlayers.userId })
        .from(tournamentGroupPlayers)
        .where(eq(tournamentGroupPlayers.groupId, group.id));
      const actualPlaces = members.map(({ userId }) => places[userId]);
      if (
        members.length !== Object.keys(places).length
        || members.some(({ userId }) =>
          !Number.isInteger(places[userId])
          || places[userId]! < 1
          || places[userId]! > members.length
        )
        || new Set(actualPlaces).size !== members.length
      ) {
        throw new ConflictException("The finished match does not match the tournament table.");
      }

      for (const { userId } of members) {
        await tx
          .update(tournamentGroupPlayers)
          .set({
            place: places[userId]!,
            qualified: places[userId]! <= advancersPerGroup,
          })
          .where(and(
            eq(tournamentGroupPlayers.groupId, group.id),
            eq(tournamentGroupPlayers.userId, userId),
          ));
      }
      await tx
        .update(tournamentGroups)
        .set({
          status: TournamentGroupStatus.COMPLETED,
          gameMatchId: matchId,
          completedAt: new Date(),
        })
        .where(and(
          eq(tournamentGroups.id, group.id),
          eq(tournamentGroups.status, TournamentGroupStatus.IN_PROGRESS),
        ));

      const groupStatusRows = await tx
        .select({ status: tournamentGroups.status })
        .from(tournamentGroups)
        .where(eq(tournamentGroups.roundId, group.roundId));
      if (groupStatusRows.some(({ status }) => status !== TournamentGroupStatus.COMPLETED)) {
        return {
          tournamentId: group.tournamentId,
          roundComplete: false,
          completedLobbyPinIds: [] as string[],
          nextRound: undefined,
          roundNumber: null,
        };
      }

      const [completedRound] = await tx
        .update(tournamentRounds)
        .set({ status: TournamentRoundStatus.COMPLETED, completedAt: new Date() })
        .where(and(
          eq(tournamentRounds.id, group.roundId),
          eq(tournamentRounds.status, TournamentRoundStatus.IN_PROGRESS),
        ))
        .returning();
      if (!completedRound) return null;

      const groups = await tx
        .select({
          id: tournamentGroups.id,
          lobbyPinId: tournamentGroups.lobbyPinId,
        })
        .from(tournamentGroups)
        .where(eq(tournamentGroups.roundId, group.roundId));
      if (groups.length === 1) {
        const [winner] = await tx
          .select({ userId: tournamentGroupPlayers.userId })
          .from(tournamentGroupPlayers)
          .where(and(
            eq(tournamentGroupPlayers.groupId, group.id),
            eq(tournamentGroupPlayers.place, 1),
          ));
        if (!winner) throw new Error("Completed tournament final has no winner.");

        const allResults = await tx
          .select({
            userId: tournamentGroupPlayers.userId,
            place: tournamentGroupPlayers.place,
            roundNumber: tournamentRounds.roundNumber,
            groupNumber: tournamentGroups.groupNumber,
          })
          .from(tournamentGroupPlayers)
          .innerJoin(tournamentGroups, eq(tournamentGroups.id, tournamentGroupPlayers.groupId))
          .innerJoin(tournamentRounds, eq(tournamentRounds.id, tournamentGroups.roundId))
          .where(eq(tournamentRounds.tournamentId, group.tournamentId))
          .orderBy(
            desc(tournamentRounds.roundNumber),
            asc(tournamentGroupPlayers.place),
            asc(tournamentGroups.groupNumber),
          );
        const rankedUserIds = new Set<string>();
        const finalPlacements: { userId: string; place: number }[] = [];
        for (const result of allResults) {
          if (result.place === null || rankedUserIds.has(result.userId)) continue;
          rankedUserIds.add(result.userId);
          finalPlacements.push({
            userId: result.userId,
            place: finalPlacements.length + 1,
          });
        }
        for (const finalPlacement of finalPlacements) {
          await tx
            .update(tournamentParticipants)
            .set({ finalPlace: finalPlacement.place })
            .where(and(
              eq(tournamentParticipants.tournamentId, group.tournamentId),
              eq(tournamentParticipants.userId, finalPlacement.userId),
            ));
        }
        await tx
          .update(tournaments)
          .set({ status: TournamentStatus.COMPLETED, completedAt: new Date() })
          .where(eq(tournaments.id, group.tournamentId));
        return {
          tournamentId: group.tournamentId,
          roundComplete: true,
          completedLobbyPinIds: groups.map(({ lobbyPinId }) => lobbyPinId),
          nextRound: null as string[] | null,
          roundNumber: null,
        };
      }

      const qualifiedRows = await tx
        .select({ userId: tournamentGroupPlayers.userId })
        .from(tournamentGroupPlayers)
        .innerJoin(tournamentGroups, eq(tournamentGroups.id, tournamentGroupPlayers.groupId))
        .where(and(
          eq(tournamentGroups.roundId, group.roundId),
          eq(tournamentGroupPlayers.qualified, true),
        ));
      return {
        tournamentId: group.tournamentId,
        roundComplete: true,
        completedLobbyPinIds: groups.map(({ lobbyPinId }) => lobbyPinId),
        nextRound: qualifiedRows.map(({ userId }) => userId),
        roundNumber: group.roundNumber + 1,
      };
    });
  }

  async getHostId(tournamentId: string) {
    const [tournament] = await this.db
      .select({ hostUserId: tournaments.hostUserId })
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .limit(1);
    if (!tournament) throw new NotFoundException("Tournament not found.");
    return tournament.hostUserId;
  }

}
