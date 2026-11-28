import { ExecutionContext } from "@nestjs/common";
import { Role } from "../modules/auth/enums/role.enum.js";
import { FastifyRequest } from "fastify";

export const byRoleHttp = (limits: Record<Role, number>) => (context: ExecutionContext) => {
	const req = context.switchToHttp().getRequest<FastifyRequest>();

	const role = (req.user?.role as Role) ?? Role.USER;

	return limits[role] ?? limits.USER
}