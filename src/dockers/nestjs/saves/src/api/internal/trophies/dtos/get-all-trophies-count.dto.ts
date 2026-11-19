import { ApiProperty } from "@nestjs/swagger";

export class GetAllTrophiesCountDto {
    @ApiProperty({
        description: "the total count of overall trophies available"
    })
    totalCount: number;
}