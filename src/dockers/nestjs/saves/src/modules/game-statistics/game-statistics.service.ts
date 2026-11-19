import { Injectable, Logger } from "@nestjs/common";
import { GameStatisticsDatabaseService } from "./database/game-statistics-database.service.js";
import { GameStatisticsCachingService } from "./caching/game-statistics-caching.service.js";

@Injectable()
export class GameStatisticsService {

    private readonly logger = new Logger(GameStatisticsService.name);

    constructor(
        private readonly gameStatisticsDatabaseService: GameStatisticsDatabaseService,
        private readonly gameStatisticsCachingService: GameStatisticsCachingService,
    ) {}


    // find the target user statistics
    findOne(userId : string) {

        return this.gameStatisticsDatabaseService.findOne(userId);
    }

}