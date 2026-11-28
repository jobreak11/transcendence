import { Injectable, Logger } from "@nestjs/common";
import { TitlesService } from "../../../modules/titles/titles.service.js";
import { UserService } from "../../../modules/user/user.service.js";

@Injectable()
export class InternalAuthService {

    private readonly logger = new Logger(InternalAuthService.name);

    constructor(
        private readonly titlesService: TitlesService,
        private readonly usersService: UserService
    ) {}

    async giveUserDefaultTitle(userId: string) {

        const [userData, defaultTitleData] = await Promise.all([
            this.usersService.findOne(userId),
            this.titlesService.findByName("Poker Rookie")
        ]);
        
        if (defaultTitleData) {

            await this.titlesService.giveUserTitle(userId, defaultTitleData.id);
            await this.usersService.update(userId, { user_profile: { activeTitleId: defaultTitleData.id}});
        }

    }

}