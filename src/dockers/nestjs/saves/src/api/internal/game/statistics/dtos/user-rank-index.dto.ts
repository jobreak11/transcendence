import { ApiProperty } from "@nestjs/swagger";

export class UserRankIndexDto {
    @ApiProperty({
        description: "the rank index position of this user"
    })
    rankIndex: number;

    @ApiProperty({
        description: "the total user count in the system for percentile calculation"
    })
    totalUserCount: number;
}