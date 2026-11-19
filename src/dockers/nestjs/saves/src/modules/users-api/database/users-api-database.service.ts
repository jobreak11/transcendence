import { HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { dbSchema } from "../../../infrastructure/drizzle/schema/schema.js";
import { DRIZZLE } from "../../../infrastructure/drizzle/drizzle.module.js";
import { UsersApiCreateDto } from "./dtos/users-api-create.dto.js";
import { user_api_keys } from "../../../infrastructure/drizzle/schema/user_api_keys/user_api_keys.schema.js";
import * as crypto from "node:crypto"
import { API_KEY_PREFIX, API_KEY_RANDOM_BYTE_AMOUNT } from "./users-api-database.constants.js";
import { logError } from "../../../utility/logError.js";
import { errorWithCode } from "../../../utility/errorWithCode.js";
import { log } from "node:console";
import { off } from "node:process";
import { eq } from "drizzle-orm";

@Injectable()
export class UsersApiDatabaseService {

    private readonly logger = new Logger(UsersApiDatabaseService.name);

    constructor(
        @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof dbSchema.dbRelations>,
    ) {

    }

    async totalApiCount() {
        const result = await this.db.$count(user_api_keys);

        return (result);
    }

    async totalUserApiCount(userId: string) {
        const result = await this.db.$count(user_api_keys, eq(user_api_keys.userId, userId));

        return result;
    }


    async createNewApi(body: UsersApiCreateDto, userId: string) {

        try {
            const rawKey = crypto.randomBytes(API_KEY_RANDOM_BYTE_AMOUNT).toString("hex");
            const rawKeyPrefix = `${API_KEY_PREFIX}${rawKey}`
            // use crypto not argon because the data to hash is already long
            const hashed  = crypto.createHash('sha256').update(rawKeyPrefix).digest('hex');
            const keyPrefix = `${API_KEY_PREFIX}${rawKey.slice(0, 10)}...`;

            const [result] = await this.db
                .insert(user_api_keys).
                values({
                    keyName: body.keyName,
                    userId: userId,
                    keyPrefix: keyPrefix,
                    keyHashed: hashed,
                })
                .returning()

            if (!result) {
                throw logError(this.logger,
                    "error from createNewApi()",
                    "insert failed from database with unknown error",
                    HttpStatus.INTERNAL_SERVER_ERROR
                )
            }


            return {
                ...result,
                rawApiKey: rawKeyPrefix
            };
        } catch (error: any) {

            if (error?.cause?.code) {
                if (error.cause.code === "23505") {
                    throw errorWithCode(
                        HttpStatus.CONFLICT,
                        "uuid api in conflicted, maybe retry again"
                    )
                }
                else if (error.cause.code === "23503") {
                    throw errorWithCode(
                        HttpStatus.NOT_FOUND,
                        "userId is not found",
                    )
                }
            }

            throw logError(
                this.logger,
                "error from createNewApi()",
                "unknown error from database",
                HttpStatus.INTERNAL_SERVER_ERROR,
                error
            )
        }

    }

    async findOneById(apiId: string) {

        const  result = await this.db.query.user_api_keys.findFirst({
            where: {
                id: apiId
            }
        })

        if (!result) {
            throw errorWithCode(
                HttpStatus.NOT_FOUND,
                "target api id is not found"
            )
        }

        return result;
    }

    async findOneByApiKey(apiKey: string) {

        const result = await this.db.query.user_api_keys.findFirst({
            where: {
                keyHashed: crypto.createHash('sha256').update(apiKey).digest('hex')
            }
        })

        if (!result) {
            throw errorWithCode(
                HttpStatus.NOT_FOUND,
                "target api key is not found"
            )
        }

        return result;
    }

    async allApiKeys(limit: number = 50, offset: number = 0) {

        if (limit < 0 || limit > 1000 || offset < 0) {
            throw logError(
                this.logger,
                "error from allApiKeys",
                "invalid limit and offset",
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        }

        const result = await this.db.query.user_api_keys.findMany({
            with: {
                user: true
            },
            orderBy: {
                createdAt: "desc"
            },
            limit: limit,
            offset: offset
        })

        return result
    }

    async allUserApiKeys(userId: string, limit: number = 50, offset: number = 0) {

        if (limit < 0 || limit > 1000 || offset < 0) {
            throw logError(
                this.logger,
                "error from allApiKeys",
                "invalid limit and offset",
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        }

        const result = await this.db.query.user_api_keys.findMany({
            where: {
                userId: userId
            },
            limit: limit,
            offset: offset,
            orderBy: {
                createdAt: "desc"
            }
        })

        return result
    }

    async revokeApiKey(apiId: string) {

        const [result] = await this.db.update(user_api_keys)
            .set({
                isRevoked: true
            })
            .where(eq(user_api_keys.id, apiId))
            .returning()

        if (!result) {
            throw errorWithCode(
                HttpStatus.NOT_FOUND,
                "target api to revoke is not found"
            )
        }

        return result;
    }

    async removeApiKey(apiId: string) {

        const [result] = await this.db.delete(user_api_keys)
            .where(eq(user_api_keys.id, apiId))
            .returning()

        if (!result) {
            throw errorWithCode(
                HttpStatus.NOT_FOUND,
                "target api to remove is not found"
            )
        }

        return result;
    }

    // can change only key name to display
    async updateApiKey(apiId: string, keyName: string) {

        const [result] = await this.db
            .update(user_api_keys)
            .set({
                keyName: keyName
            })
            .where(eq(user_api_keys.id, apiId))
            .returning()

        if (!result) {
            throw errorWithCode(
                HttpStatus.NOT_FOUND,
                "target api to remove is not found"
            )
        }

        return result;
    }
    

}