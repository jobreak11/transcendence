import { Injectable, Logger } from "@nestjs/common";
import { UsersApiService } from "../../../modules/users-api/users-api.service.js";
import { Role } from "../../../modules/auth/enums/role.enum.js";
import { UsersApiTotalUserApiCountDto } from "./dtos/users-api-total-user-api-count.dto.js";
import { UsersApiCreateDto } from "../../../modules/users-api/database/dtos/users-api-create.dto.js";
import { UserApiKeyDto } from "../../../infrastructure/drizzle/schema/user_api_keys/user_api_keys.dto.js";
import { UsersApiCreateRawApiKeyDto } from "./dtos/users-api-create-raw-api-key.dto.js";
import { UsersApiAllApiDto } from "./dtos/users-api-all-api.dto.js";
import { UsersApiKeyNoHashedDto } from "./dtos/users-api-key-no-hashed.dto.js";

@Injectable()
export class InternalUsersApiService {

    private readonly logger = new Logger(InternalUsersApiService.name);

    constructor(
        private readonly usersApiService: UsersApiService,
    ) {
    }


    async totalUserApiCount(userId: string): Promise<UsersApiTotalUserApiCountDto> {
        const result = await this.usersApiService.totalUserApiCount(userId);

        return {
            totalCount: result
        }
    }

    async totalApiCount(): Promise<UsersApiTotalUserApiCountDto> {
        const result = await this.usersApiService.totalApiCount();

        return {
            totalCount: result
        }
    }

    async createOne(userId: string, body: UsersApiCreateDto): Promise<UsersApiCreateRawApiKeyDto> {

        const result = await this.usersApiService.createNewApi(userId, body);

        const {keyHashed, ...extracted} = result;

        return extracted;
    }

    async allApis(limit: number = 50, offset: number = 0): Promise<UsersApiAllApiDto[]> {
        const result = await this.usersApiService.allApiKeys(limit, offset)

        return  result
    }

    async userApiKeys(userId: string, limit: number = 50, offset: number = 0): Promise<UsersApiKeyNoHashedDto[]> {

        const result = await this.usersApiService.allUserApiKeys(userId, limit, offset);

        const formatted: UsersApiKeyNoHashedDto[] = result.map((value) => {
            const {keyHashed, ...extracted} = value;
            return {
                ...extracted
            }
        })

        return formatted;
    }


    async findOneByRawApiKey(rawApiKey: string): Promise<UsersApiKeyNoHashedDto> {

        const result = await this.usersApiService.findOneByApiKey(rawApiKey);

        const {role, keyHashed, ...extracted} = result;

        return extracted;
    }

    async findOneById(apiId: string): Promise<UsersApiKeyNoHashedDto> {

        const result = await this.usersApiService.findOneById(apiId);

        const {keyHashed, ...extracted} = result;

        return extracted;
    }

    async removeApiKey(apiId: string): Promise<UsersApiKeyNoHashedDto> {

        const result = await this.usersApiService.removeApiKey(apiId);

        const {keyHashed, ...extracted} = result;

        return extracted
    }

    async revokeApiKey(apiId: string): Promise<UsersApiKeyNoHashedDto> {

        const result = await this.usersApiService.revokeApiKey(apiId);

        const {keyHashed, ...extracted} = result;

        return extracted
    }

}