import { Injectable, Logger } from "@nestjs/common";
import { GameStatisticsService } from "../../../modules/game-statistics/game-statistics.service.js";
import { PublicUserStatDto } from "./dtos/public-user-stat.dto.js";

@Injectable()
export class PublicUsersStatisticsService {

    private readonly logger = new Logger(PublicUsersStatisticsService.name);

    constructor(
        private readonly gameStats: GameStatisticsService
    ) {

    }

    async allUserStats(limit: number = 50, offset: number = 0, orderByRank: boolean = true): Promise<PublicUserStatDto[]> {

        const result = await this.gameStats.getAllUserStats(limit, offset, orderByRank);

        const formatted: PublicUserStatDto[] = result.map((value) => {

            const {user, ...extractStat} = value;
            const {id, hashedRefreshToken, password, user_profile, ...extractedUser} = user;
            const {userId, ...extractedUserProfile} = user_profile;


            return {
                ...extractStat,
                user: {
                    ...extractedUser,
                    userProfile: extractedUserProfile
                }
            }

        })

        return formatted;
    }

    async findOne(targetUserId: string): Promise<PublicUserStatDto> {

        const found = await this.gameStats.findOneV2(targetUserId);

        const {user, ...extractedStat} = found;
        const {hashedRefreshToken, password, id, user_profile, ...extractedUser} = user;
        const {userId, ...extractedUserProfile} = user_profile

        return {
            ...extractedStat,
            user: {
                ...extractedUser,
                userProfile: {
                    ...extractedUserProfile
                }
            }
        }
    }

}