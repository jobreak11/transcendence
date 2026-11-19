import { ApiProperty, OmitType } from "@nestjs/swagger";
import { UserApiKeyDto } from "../../../../infrastructure/drizzle/schema/user_api_keys/user_api_keys.dto.js";
import { UsersApiKeyNoHashedDto } from "./users-api-key-no-hashed.dto.js";

export class UsersApiCreateRawApiKeyDto extends UsersApiKeyNoHashedDto {

    @ApiProperty({
        description: "the raw api key for user to store. DISPLAY ONE TIME ONLY!!"
    })
    rawApiKey: string;
}