import { OmitType } from "@nestjs/swagger";
import { UserApiKeyDto } from "../../../../infrastructure/drizzle/schema/user_api_keys/user_api_keys.dto.js";

export class UsersApiKeyNoHashedDto extends OmitType(UserApiKeyDto, ['keyHashed'] as const){

}