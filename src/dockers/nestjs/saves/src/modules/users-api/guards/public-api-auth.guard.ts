import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { UsersApiService } from "../users-api.service.js";
import { Observable } from "rxjs";
import { FastifyRequest } from "fastify";
import { API_KEY_PREFIX } from "../database/users-api-database.constants.js";

declare module 'fastify' {
  interface FastifyRequest {
    user?: any
  }
}

@Injectable()
export class PublicApiAuthGuard implements CanActivate {
    
    private readonly logger = new Logger(PublicApiAuthGuard.name);

    constructor(
        private readonly usersApiService: UsersApiService,
    ) {

    }

    async canActivate(context: ExecutionContext) {


        const request = context.switchToHttp().getRequest<FastifyRequest>();

        const apiKey = request.headers['x-api-key'];

        if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith(API_KEY_PREFIX)) {
            throw new UnauthorizedException('Missing or invalid API Key format');
        }

        const result = await this.usersApiService.validateApiKey(apiKey);

        if (!result) {
            throw new UnauthorizedException('Invalid or revoked API Key');
        }

        request.user = {
            id: result.userId,
            role: result.role
        }


        return true;
    }

}