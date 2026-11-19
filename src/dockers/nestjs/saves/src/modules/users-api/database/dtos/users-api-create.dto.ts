import z from "zod";
import { userApiKeysDatabaseSchema } from "../../../../infrastructure/drizzle/schema/user_api_keys/user_api_keys.schema.js";
import { PickType } from "@nestjs/swagger";
import { UserApiKeyDto } from "../../../../infrastructure/drizzle/schema/user_api_keys/user_api_keys.dto.js";

export const usersApiCreateSchema = z.object({
    ...userApiKeysDatabaseSchema.insert.pick({keyName: true}).shape,
})

type test = z.infer<typeof usersApiCreateSchema>;

export class UsersApiCreateDto extends PickType(UserApiKeyDto, ['keyName'] as const) {

}