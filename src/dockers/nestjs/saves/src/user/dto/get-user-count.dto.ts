import { ApiProperty } from "@nestjs/swagger";


export class GetUserTotalCountDto {

  @ApiProperty({
    description: "the total amount of user",
    example: 100
  })
  totalUserCount: number;
}