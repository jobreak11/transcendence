import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { UserService } from "../../../modules/user/user.service.js";
import { UserAndProfileDto } from "../../../modules/user/dto/user-and-profile.dto.js";
import { PublicUserAndProfileAndTitleDto } from "./dtos/public-user-and-profile-and-title.dto.js";
import { PublicUserAndProfileDto } from "./dtos/public-user-and-profile.dto.js";
import { resultFields } from "drizzle-orm/postgres/client/dist/connection";
import { PublicUsersTotalCountDto } from "./dtos/public-users-total-count.dto.js";

@Injectable()
export class PublicUsersService {

    private readonly logger = new Logger(PublicUsersService.name);

    constructor(
        private readonly userService: UserService,

    ) {}

    async findById(userId: string)
    :Promise<PublicUserAndProfileDto>
    {
        const result = await this.userService.findOne(userId);
        return {
            id: result.id,
            email: result.email,
            createdAt: result.createdAt,
            role: result.role,
            tagId: result.tagId,
            userProfile: {
                activeTitleId: result.user_profile.activeTitleId,
                avatarUrl: result.user_profile.avatarUrl,
                cardTheme: result.user_profile.cardTheme,
                displayName: result.user_profile.displayName,
                pronoun: result.user_profile.pronoun,
                signature: result.user_profile.signature
            }
        };
    }

    async findByTagId(tagId: string)
    :Promise<PublicUserAndProfileDto>
    
    {
        const result = await this.userService.findByTagId(tagId);
        return {
            id: result.id,
            email: result.email,
            createdAt: result.createdAt,
            role: result.role,
            tagId: result.tagId,
            userProfile: {
                activeTitleId: result.user_profile.activeTitleId,
                avatarUrl: result.user_profile.avatarUrl,
                cardTheme: result.user_profile.cardTheme,
                displayName: result.user_profile.displayName,
                pronoun: result.user_profile.pronoun,
                signature: result.user_profile.signature
            }
        };
    }

    async findByEmail(email: string)
    :Promise<PublicUserAndProfileDto>
    {
        const result = await this.userService.findByEmail(email);
        return {
            id: result.id,
            email: result.email,
            createdAt: result.createdAt,
            role: result.role,
            tagId: result.tagId,
            userProfile: {
                activeTitleId: result.user_profile.activeTitleId,
                avatarUrl: result.user_profile.avatarUrl,
                cardTheme: result.user_profile.cardTheme,
                displayName: result.user_profile.displayName,
                pronoun: result.user_profile.pronoun,
                signature: result.user_profile.signature
            }
        };
    }

    async getAllUsers(limit: number = 50, offset: number = 0): Promise<PublicUserAndProfileAndTitleDto[]> {

        if (limit < 0 || limit > 1000 || offset < 0) {
            throw new BadRequestException('invalid limit or offset');
        }

        const result = await this.userService.findAllV2(limit, offset);

        const formatted: PublicUserAndProfileAndTitleDto[] = result.map((value) => {
            const {hashedRefreshToken, password, user_profile, ...extractedUser} = value;
            const {userId, active_title, ...extractedProfile} = user_profile;
            let extractedTitle: {
                createdAt: Date;
                name: string;
                description: string | null;
            } | null = null
            if (active_title) {
                const {id, ...rawExtracted} = active_title;

                extractedTitle =rawExtracted;
            }

            return {
                ...extractedUser,
                userProfile: {
                    ...extractedProfile,
                    activeTitle: extractedTitle
                },
            }
        })

        return formatted;
    }

    async getTotalCountUser(): Promise<PublicUsersTotalCountDto> {
        const result = await this.userService.countTotalUser();

        return {
            total: result
        }
    }

}