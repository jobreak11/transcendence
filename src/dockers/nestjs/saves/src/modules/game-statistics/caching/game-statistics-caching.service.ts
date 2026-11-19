import { Inject, Injectable, Logger } from "@nestjs/common";
import { REDIS_CLIENT, type RedisClient } from "../../../infrastructure/redis/redis.provider.js";

@Injectable()
export class GameStatisticsCachingService {

    private readonly logger = new Logger(GameStatisticsCachingService.name);

    constructor(
        @Inject(REDIS_CLIENT) private readonly db: RedisClient,
    ) {}




}