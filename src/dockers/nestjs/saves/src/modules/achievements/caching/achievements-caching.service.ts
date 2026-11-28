import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class AchievementsCachingService {

    private readonly logger = new Logger(AchievementsCachingService.name);

}