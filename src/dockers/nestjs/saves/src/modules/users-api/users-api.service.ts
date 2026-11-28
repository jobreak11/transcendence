import { Injectable, Logger } from "@nestjs/common";
import { UsersApiDatabaseService } from "./database/users-api-database.service.js";
import { UsersApiCachingService } from "./caching/users-api-caching.service.js";
import { UsersApiCreateDto } from "./database/dtos/users-api-create.dto.js";
import { UserService } from "../user/user.service.js";
import * as crypto from "node:crypto"
import { UserApiKeyDto } from "../../infrastructure/drizzle/schema/user_api_keys/user_api_keys.dto.js";
import { redis_cache_api_key } from "./caching/users-api-caching.namespace.js";
import { UserApiKeyUserRoleDto } from "./caching/dtos/user-api-key-user-role.dto.js";

@Injectable()
export class UsersApiService {

    private readonly logger = new Logger(UsersApiService.name);

    constructor(
        private readonly usersApiDatabaseService: UsersApiDatabaseService,
        private readonly usersApiCachingService: UsersApiCachingService,
        private readonly userService: UserService
    ) {

    }

    totalApiCount() {
        return this.usersApiDatabaseService.totalApiCount();
    }

    async totalUserApiCount(userId: string) {

        const userData = await this.userService.findOne(userId);

        return this.usersApiDatabaseService.totalUserApiCount(userId);
    }

    async createNewApi(userId: string, body: UsersApiCreateDto) {

        const result = await this.usersApiDatabaseService.createNewApi(body, userId);

        const userData = await this.userService.findOne(result.userId);

        const {rawApiKey, ...extracted} = result;

        await this.usersApiCachingService.saveHashedApi({...extracted, role: userData.role});
        return result;
    }

    async findOneById(apiId: string): Promise<UserApiKeyDto> {

        const found = await this.usersApiDatabaseService.findOneById(apiId);

        return found;
        
    }

    async findOneByApiKey(apiKey: string): Promise<UserApiKeyUserRoleDto> {

        const cachingFound = await this.usersApiCachingService.loadHashedApi(crypto.createHash('sha256').update(apiKey).digest('hex'));

        if (cachingFound) {
            return cachingFound;
        }


        const found = await this.usersApiDatabaseService.findOneByApiKey(apiKey);

        const userData = await this.userService.findOne(found.userId);

        await this.usersApiCachingService.saveHashedApi({...found, role: userData.role});

        return {
            ...found,
            role: userData.role
        };
    }

    allApiKeys(limit: number = 50, offset: number = 0) {

        return this.usersApiDatabaseService.allApiKeys(limit, offset);
    }

    allUserApiKeys(userId: string, limit: number = 50, offset: number = 0): Promise<UserApiKeyDto[]> {

        return this.usersApiDatabaseService.allUserApiKeys(userId, limit, offset);
    }

    async revokeApiKey(apiId: string) {


        const result = await this.usersApiDatabaseService.revokeApiKey(apiId);
        await this.usersApiCachingService.removeHashedApi(redis_cache_api_key(result.keyHashed));

        return result;
    }

    async removeApiKey(apiId: string) {

        const result = await this.usersApiDatabaseService.removeApiKey(apiId);

        await this.usersApiCachingService.removeHashedApi(result.keyHashed);

        return result;
    }

    async updateApiKey(apiId: string, keyName: string) {
        const result = await this.usersApiDatabaseService.updateApiKey(apiId, keyName);

        await this.usersApiCachingService.removeHashedApi(result.keyHashed);
    }

    async validateApiKey(apiKey: string) {

        const result = await this.findOneByApiKey(apiKey);

        if (result.isRevoked === true) {
            return null;
        }

        return result;
    }


}