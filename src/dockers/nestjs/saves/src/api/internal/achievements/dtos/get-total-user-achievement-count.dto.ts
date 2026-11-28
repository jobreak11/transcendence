import { ApiProperty } from "@nestjs/swagger";

export class GetTotalUserAchievementCountDto {
    @ApiProperty({
        description: "total count of the user achievements"
    })
    totalCount: number;
}