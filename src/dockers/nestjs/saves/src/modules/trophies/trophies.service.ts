import { Injectable, Logger } from "@nestjs/common";
import { TrophiesDatabaseService } from "./database/trophies-database.service.js";
import { UserService } from "../user/user.service.js";
import { CreateNewTrophyDto } from "../../api/internal/trophies/dtos/create-new-trophy.dto.js";
import { TrophiesUpdateDto } from "./database/dtos/trophies-update.dto.js";

@Injectable()
export class TrophiesService {

    private readonly logger = new Logger(TrophiesService.name);

    constructor(
        private readonly userService: UserService,

        private readonly trophiesDatabaseService: TrophiesDatabaseService,
    ) {}

    async getUserTrophies(userId: string, limit: number = 50, offset: number = 0) {
        const userData = await this.userService.findOne(userId);
        return this.trophiesDatabaseService.getUserTrophies(userId, limit, offset);
    }

    countAllTrophies() {
        return this.trophiesDatabaseService.countAll();
    }

    async countAllUserTrophies(userId: string) {
        const userData = await this.userService.findOne(userId);
        return this.trophiesDatabaseService.countAllUserTrophy(userId);
    }

    createNewTrophy(body: CreateNewTrophyDto) {
        return this.trophiesDatabaseService.createTrophy(body);
    }

    updateTrophy(trophyId: string, body: TrophiesUpdateDto) {
        return this.trophiesDatabaseService.update(trophyId, body);
    }

    uploadTrophyPic(trophyId: string, buffer: Buffer, extension: string) {

        return this.trophiesDatabaseService.uploadTrophyPic(trophyId, buffer, extension);
    }

    findOne(trophyId: string) {
        return this.trophiesDatabaseService.findOne(trophyId);
    }

    async giveUserTrophy(trophyId: string, userId: string) {
        await Promise.all([
            this.userService.findOne(userId),
            this.findOne(trophyId)
        ])

        return this.trophiesDatabaseService.giveUserTrophy(userId, trophyId);
    }

    getAllTrophies(limit: number = 50, offset: number = 0) {
        return this.trophiesDatabaseService.getAllTrophies(limit, offset);
    }


    revokeUserTrophy(userId: string, trophyId: string) {
        return this.trophiesDatabaseService.revokeUserTrophy(userId, trophyId)
    }

    deleteTrophy(trophyId: string) {
        return this.trophiesDatabaseService.deleteTrophy(trophyId);
    }

}