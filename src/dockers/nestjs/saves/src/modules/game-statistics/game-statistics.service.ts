import { Injectable, Logger } from "@nestjs/common";
import { GameStatisticsDatabaseService } from "./database/game-statistics-database.service.js";
import { GameStatisticsCachingService } from "./caching/game-statistics-caching.service.js";
import { UserService } from "../user/user.service.js";

@Injectable()
export class GameStatisticsService {

    private readonly logger = new Logger(GameStatisticsService.name);

    constructor(
        private readonly gameStatisticsDatabaseService: GameStatisticsDatabaseService,
        private readonly gameStatisticsCachingService: GameStatisticsCachingService,
        private readonly userService: UserService,
    ) {}


    // find the target user statistics
    findOne(userId : string) {

        return this.gameStatisticsDatabaseService.findOne(userId);
    }

    findOneV2( userId: string ) {
        return this.gameStatisticsDatabaseService.findOneV2(userId);
    }

    getAllUserStats(limit: number = 50, offset: number = 0, orderByRank: boolean = true) {
        return this.gameStatisticsDatabaseService.getAllUserStats(limit, offset, orderByRank)
    }

    async getUserRankIndex(userId: string) {

        const [userRank, totaluserCount] = await Promise.all([
            this.gameStatisticsDatabaseService.getUserRankIndex(userId),
            this.userService.countTotalUser()
        ])

        return  {
            userRankIndex: userRank,
            totalUserCount: totaluserCount
        }
    }

}