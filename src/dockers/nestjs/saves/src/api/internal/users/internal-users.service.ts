import { Injectable, Logger } from "@nestjs/common";
import { TitlesService } from "../../../modules/titles/titles.service.js";
import { UserService } from "../../../modules/user/user.service.js";

@Injectable()
export class InternalUsersService {

    private readonly logger = new Logger(InternalUsersService.name);

    constructor(
        private readonly titlesService: TitlesService,
        private readonly userService: UserService
    ) {

    }

    async giveUserDefaultTitle(userId: string) {

        const [userData, defaultTitleData] = await Promise.all([
            this.userService.findOne(userId),
            this.titlesService.findByName("Poker Rookie")
        ]);
        
        if (defaultTitleData) {

            await this.titlesService.giveUserTitle(userId, defaultTitleData.id);
            await this.userService.update(userId, { user_profile: { activeTitleId: defaultTitleData.id}});
        }

    }


}