import { ApiProperty } from "@nestjs/swagger";

export class UsersApiTotalUserApiCountDto {
    @ApiProperty({
        description: "the total amount of api that the user own"
    })
    totalCount: number;
}