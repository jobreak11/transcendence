import { Injectable, Logger } from "@nestjs/common";
import { TrophiesService } from "../../../modules/trophies/trophies.service.js";
import { GetUserTrophyDto } from "./dtos/get-user-trophy.dto.js";
import { GetAllTrophiesCountDto } from "./dtos/get-all-trophies-count.dto.js";
import { GetAllUserTrophiesCountDto } from "./dtos/get-all-user-trophies-count.dto.js";
import { CreateNewTrophyDto } from "./dtos/create-new-trophy.dto.js";
import { GetTrophyDto } from "./dtos/get-trophy.dto.js";
import { TrophiesUpdateDto } from "../../../modules/trophies/database/dtos/trophies-update.dto.js";
import { UserTrophyDto } from "../../../infrastructure/drizzle/schema/user_trophies/user_trophies.dto.js";
import { TrophyDto } from "../../../infrastructure/drizzle/schema/throphies/trophies.dto.js";

@Injectable()
export class InternalTrophiesService {

    private readonly logger = new Logger(InternalTrophiesService.name);

    constructor(
        private readonly trophiesService: TrophiesService
    ) {}

    async getUserTrophies(targetUserId: string, limit: number = 50, offset: number = 0): Promise<GetUserTrophyDto[]> {
        const result = await this.trophiesService.getUserTrophies(targetUserId, limit, offset);
        
        const formated: GetUserTrophyDto[] = result.map((value) => {
            const {userId, trophyId, ...extracted} = value;

            return  {
                ...value
            }
        })

        return formated;
    }

    async getAllTrophiesCount(): Promise<GetAllTrophiesCountDto> {
        const result = await this.trophiesService.countAllTrophies();
        return {
            totalCount: result
        }
    }

    async getAllUserTrophiesCount( userId: string ): Promise<GetAllUserTrophiesCountDto> {
        const result = await this.trophiesService.countAllUserTrophies(userId);
        return {
            totalCount: result
        }
    }


    // DEV
    createNewTrophy(body: CreateNewTrophyDto): Promise<GetTrophyDto> {
        return this.trophiesService.createNewTrophy(body);
    }

    uploadTropyPic(trophyId: string, buffer: Buffer) {
        return this.trophiesService.uploadTrophyPic(trophyId, buffer);
    }

    findOneTrophy(trophyId: string): Promise<GetTrophyDto> {
        return this.trophiesService.findOne(trophyId);
    }

    updateTrophy(trophyId: string, body: TrophiesUpdateDto): Promise<GetTrophyDto> {
        return this.trophiesService.updateTrophy(trophyId, body);
    }

    giveUserTrophy(trophyId: string, userId: string) {
        return this.trophiesService.giveUserTrophy(trophyId, userId);
    }

    getAllTrophies(limit: number = 50, offset: number = 0 ) {
        return this.trophiesService.getAllTrophies(limit, offset);
    }

    revokeUserTrophy(trophyId: string, userId: string): Promise<UserTrophyDto> {

        return this.trophiesService.revokeUserTrophy(userId,  trophyId);
    }

    deleteTrophy(trophyId: string): Promise<TrophyDto> {

        return this.trophiesService.deleteTrophy(trophyId);
    }
}