import { ApiProperty } from "@nestjs/swagger";
import { UserApiKeyDto } from "../../../../infrastructure/drizzle/schema/user_api_keys/user_api_keys.dto.js";
import { UserDto } from "../../../../infrastructure/drizzle/schema/users/user.dto.js";

export class UsersApiAllApiDto extends UserApiKeyDto {

    @ApiProperty({
        description: "the user infomation",
        type: () => UserDto
    })
    user: UserDto;
}