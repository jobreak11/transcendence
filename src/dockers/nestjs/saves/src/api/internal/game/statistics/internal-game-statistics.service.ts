import { Injectable, Logger } from "@nestjs/common";
import { GameStatisticsService } from "../../../../modules/game-statistics/game-statistics.service.js";
import { GetOneUserGameStatisticsDto } from "./dtos/get-one-user-game-statistics.dto.js";

@Injectable()
export class InternalGameStatisticsService {

    private readonly logger = new Logger(InternalGameStatisticsService.name);

    constructor(
        private readonly gameStatisticsService: GameStatisticsService
    ) {}

    async getOneUserGameStatistics(targetUserId: string): Promise<GetOneUserGameStatisticsDto> {

        const result = await this.gameStatisticsService.findOne(targetUserId);

        const {userId, ...extracted} = result;
        
        return {
            ...extracted
        }
    }


}