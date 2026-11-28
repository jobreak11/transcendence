import z from "zod";
import { Role } from "../../auth/enums/role.enum.js";
import { ApiProperty } from "@nestjs/swagger";

export const userSetRoleSchema = z.object({
	userId: z.uuid(),
	newRole: z.enum(Role)
})


type base = z.infer<typeof userSetRoleSchema>;

export class UserSetRoleDto implements base {

	@ApiProperty({
		description: "target user id to set role"

	})
	userId: string;

	@ApiProperty({
		description: "target role to set"

	})
	newRole: Role;
}