import { ApiProperty } from "@nestjs/swagger";

export class GetTotalAllAchievementCountDto {
    @ApiProperty({
        description: "total count of all the achievements"
    })
    totalCount: number;
}