import { ApiProperty } from "@nestjs/swagger";
import { UserApiKeyDto } from "../../../../infrastructure/drizzle/schema/user_api_keys/user_api_keys.dto.js";
import { Role } from "../../../auth/enums/role.enum.js";

export class UserApiKeyUserRoleDto extends UserApiKeyDto {

    @ApiProperty({
        enum: Role,
        description: "the role of the user"
    })
    role: Role;
}