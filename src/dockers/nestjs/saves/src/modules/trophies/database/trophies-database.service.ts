import { HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { DRIZZLE } from "../../../infrastructure/drizzle/drizzle.module.js";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { dbSchema } from "../../../infrastructure/drizzle/schema/schema.js";
import { logError } from "../../../utility/logError.js";
import { trophies } from "../../../infrastructure/drizzle/schema/throphies/trophies.schema.js";
import { user_trophies } from "../../../infrastructure/drizzle/schema/user_trophies/user_trophies.schema.js";
import { and, eq } from "drizzle-orm";
import { CreateUserDto } from "../../user/dto/create-user.dto.js";
import { CreateNewTrophyDto } from "../../../api/internal/trophies/dtos/create-new-trophy.dto.js";
import { errorWithCode } from "../../../utility/errorWithCode.js";
import { TrophiesUpdateDto } from "./dtos/trophies-update.dto.js";
import path from "path";
import { BASEURL, SHARED_STORAGE_PATH, STORAGE_URL_PATH } from "../../../constant.js";
import * as fs from 'fs/promises'

@Injectable()
export class TrophiesDatabaseService {

    private readonly logger = new Logger(TrophiesDatabaseService.name);

    constructor(
        @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof dbSchema.dbRelations>,
    ) {}

    async getAllTrophies(limit: number = 50, offset: number = 0) {

        if (offset < 0 || limit < 0) {
            throw logError(
                this.logger,
                "error from getAllTrophies()",
                "invalid offset",
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        const result = await this.db.query.trophies.findMany({
            orderBy: {
                createdAt: "desc",
                name: "asc"
            },
            limit: limit,
            offset: offset
        })


        return result;
    }

    async getUserTrophies(userId: string, limit: number = 50, offset: number = 0) {

        if (offset < 0 || limit < 0) {
            throw logError(
                this.logger,
                "error from getUserTrophies()",
                "invalid offset",
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        const result = await this.db.query.user_trophies.findMany({
            where: {
                userId: userId
            },
            with: {
                trophy: true
            },
            orderBy: {
                unlockedAt: "desc"
            },
            offset:  offset,
            limit: limit
        })


        return result;
    }

    async findOne(trophyId: string) {

        const result = await this.db.query.trophies.findFirst({
            where: {
                id: trophyId
            }
        });

        if (!result) {
            throw errorWithCode(
                HttpStatus.NOT_FOUND,
                "target trophy id is not found"
            )
        }

        return result;
    }

    async update( trophyId: string, updateDto: TrophiesUpdateDto) {


        const oldData = await this.findOne(trophyId);

        if (oldData.imageUrl) {

            const baseStorageUrl = path.join(BASEURL, STORAGE_URL_PATH);

            if (oldData.imageUrl.startsWith(baseStorageUrl)) {

                const cutUrl = oldData.imageUrl.slice(baseStorageUrl.length);

                const fullStoragePath = path.join(SHARED_STORAGE_PATH, 'trophies', trophyId, cutUrl);

                await fs.unlink(fullStoragePath).catch(() => {})
            }
        }


        const [updateResult] = await this.db.update(trophies)
            .set({
                name: updateDto.name,
                imageUrl: updateDto.imageUrl,
                description: updateDto.description,
                createdAt: updateDto.createdAt
            })
            .where(eq(trophies.id, trophyId))
            .returning()
        
        if (!updateResult) {
            throw errorWithCode(
                HttpStatus.NOT_FOUND,
                "target trophy id is not found and cannot update"
            )
        }

        return updateResult;
    }

    async uploadThrophyPic(trophyId: string, fileBuffer: Buffer) {

        const targetTrophy = await this.findOne(trophyId);

        const dateString = (new Date()).toISOString();
        const uploadDir = path.join(SHARED_STORAGE_PATH, 'trophies', String(trophyId));
        const destinationPath = path.join(uploadDir, `${dateString}_image.jpg`);

        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(destinationPath, fileBuffer);

        const newUrl = path.join(BASEURL, STORAGE_URL_PATH, `trophies/${String(trophyId)}/${dateString}_image.jpg`)

        return this.update(trophyId, {
            imageUrl: newUrl
        });
    }

    async createTrophy(body: CreateNewTrophyDto) {

        const [result] = await this.db

            .insert(trophies)
            .values({
                name: body.name,
                description: body.description,
                imageUrl: body.imageUrl,
                createdAt: body.createdAt,
            })
            .returning();

        
        if (!result) {
            throw logError(
                this.logger,
                'error from createTrophy()',
                "insert new row for trohpies has failed",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }

        return result;
    }

    async countAllUserTrophy(userId: string) {
        return await this.db.$count(user_trophies, eq(user_trophies.userId, userId));
    }

    async countAll() {
        return await this.db.$count(trophies);
    }



    async giveUserTrophy(userId: string, trophyId: string) {

        try {
            const [result] = await this.db.insert(user_trophies)
                .values({
                    trophyId: trophyId,
                    userId: userId,
                })
                .returning()
            
            if (!result) {
                throw logError(
                    this.logger,
                    "error from giveUserTrophy()",
                    "unkown error but result is not found",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            return result;
        }
        catch (error: any) {
            if (error?.cause?.code) {

                if (error.cause.code === '23505') {
                    throw errorWithCode(
                        HttpStatus.CONFLICT,
                        "target user already have this trophies"
                    )
                }
                else if (error.cause.code === '23503') {
                    throw errorWithCode(
                        HttpStatus.NOT_FOUND,
                        "target user or target trophy is not exist"
                    )
                }
            }
            throw logError(
                this.logger,
                "error from giveUserTrophy()",
                "unknown database error",
                HttpStatus.INTERNAL_SERVER_ERROR,
                error
            );
        }

    }

    async revokeUserTrophy( userId: string , trophyId: string ) {

        const [result] = await this.db.delete(user_trophies)
            .where(and(
                eq(user_trophies.userId, userId),
                eq(user_trophies.trophyId, trophyId)
            ))
            .returning()

        if (!result) {
            throw errorWithCode(
                HttpStatus.NOT_FOUND,
                "the user trophy relation is not found"
            )
        }

        return result
    }

    async deleteTrophy( trophyId: string ) {

        const [result] = await this.db.delete(trophies)
            .where(eq(trophies.id, trophyId))
            .returning()

        if (!result) {
            throw errorWithCode(
                HttpStatus.NOT_FOUND,
                "target trophy id is not found"
            )
        }

        if (result.imageUrl) {
            const baseStorageUrl = path.join(BASEURL, STORAGE_URL_PATH);

            if (result.imageUrl.startsWith(baseStorageUrl)) {

                const cutUrl = result.imageUrl.slice(baseStorageUrl.length);

                const fullStoragePath = path.join(SHARED_STORAGE_PATH, 'trophies', trophyId, cutUrl);

                await fs.unlink(fullStoragePath).catch(() => {})
            }
        }

        return result;
    }

}