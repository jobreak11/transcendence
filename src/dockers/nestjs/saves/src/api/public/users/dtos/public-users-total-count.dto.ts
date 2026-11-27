import { ApiProperty } from "@nestjs/swagger";

export class PublicUsersTotalCountDto {

    @ApiProperty({
        description: "the total number of user in the system"
    })
    total: number;

}