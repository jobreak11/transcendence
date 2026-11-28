import { ApiProperty } from "@nestjs/swagger";

export class GetAllUserTrophiesCountDto {

    @ApiProperty({
        description: "totalCount of all the trophies this user got"
    })
    totalCount: number;
}
