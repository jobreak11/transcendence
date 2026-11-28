import { Injectable, Logger } from "@nestjs/common";
import { GameDatabaseService } from "../../../../modules/game/database/game-database.service.js";
import { UserService } from "../../../../modules/user/user.service.js";
import { of } from "rxjs";
import { GetGameMatchDto } from "./dtos/getGameMatches.dto.js";
import { FullGameMatchDto } from "./dtos/full-game-match.dto.js";
import { GetAllGameMatchDto } from "./dtos/get-all-game-match.dto.js";

@Injectable()
export class InternalGameMatchesService {

    private readonly logger = new Logger(InternalGameMatchesService.name);

    constructor (
        private readonly gameDatabaseService: GameDatabaseService,
        private readonly userService: UserService,
    ) {
    }

    async getMatches(userId: string, limit: number = 50, offset: number = 0): Promise<GetGameMatchDto[]> {

        // must check if target user exist
        const targetUser = await this.userService.findOne(userId);
        const result = await this.gameDatabaseService.getGameMatches(userId, limit, offset);


        const formatted: GetGameMatchDto[] = result.map((value) => {

            const {id, ...extracted} = value.game_matches;

            return {
                gameMatchId: value.game_matches.id,
                expEarned: value.user_game_matches.expEarned,
                rankEarned: value.user_game_matches.rankEarned,
                winCount: value.user_game_matches.winCount,
                playCount: value.user_game_matches.playCount,
                playerPlace: value.user_game_matches.playerPlace,
                gameMatch: extracted
            }
        })

        return formatted;
    }

    async getAllMatches(limit: number = 50, offset: number = 0): Promise<GetAllGameMatchDto[]>  {

        const result = await this.gameDatabaseService.getAllGameMatches(limit, offset);

        const formatted: GetAllGameMatchDto[] = result.map((value) => {
            const {user_game_matches, ...extracted} = value;

            return {
                ...extracted,
                userGameMatches: user_game_matches
            }
        })
        
        return formatted
    }

    async findMatch(gameMatchId: string): Promise<FullGameMatchDto> {

        const match = await this.gameDatabaseService.findOne(gameMatchId);

        const formattedUserResult = match.user_game_matches.map((value) => {

            const {gameMatchId, ...extracted} = value;

            return extracted;
        })

        const {user_game_matches, ...extractedMatch} = match;

        return {
            ...extractedMatch,
           userMatchResult: formattedUserResult 
        }
    }
    
}
