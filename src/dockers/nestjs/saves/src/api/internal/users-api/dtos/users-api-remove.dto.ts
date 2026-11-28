import z from "zod";
import { userApisRevokeSchema, UsersApiRevokeDto } from "./users-api-revoke.dto.js";

export const usersApiRemoveSchema = z.object({
    ...userApisRevokeSchema.shape
})

export class UsersApiRemoveDto extends UsersApiRevokeDto {

}