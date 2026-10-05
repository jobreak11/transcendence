import { ApiProperty, IntersectionType, OmitType, PartialType } from "@nestjs/swagger";
import { PronounType } from "../../drizzle/schema/users.schema.js";
import { UserDto } from "./user.dto.js";

export class GetUserProfileDto extends IntersectionType(
    OmitType(UserDto, ['id', 'password', 'hashedRefreshToken', 'activeTitleId'] as const)
) {
}

//export class GetUserProfileDto {

//  @ApiProperty({
//    example: "awea-asdfawf-asdfa",
//    description: 'your uuid user'
//  })
//  id: string;

//  @ApiProperty({
//    example: 'user@example.com',
//    description: 'your email'
//  })
//  email: string;

//  @ApiProperty({
//    example: 'Date something dunno',
//    description: 'date that your account was created'
//  })
//  createdAt: Date;

//  @ApiProperty({
//    example: '/asdf/sdf/asdf.asdf',
//    description: 'your url to retrieve image of your avatar'
//  })
//  avatarUrl: string | null;

//  @ApiProperty({
//    example: 'YYMMDD_XXXX',
//    description: 'tagID of the user'
//  })
//  tagId: string;

//  @ApiProperty({
//    example: 'YYMMDD_XXXX',
//    description: 'tag id of the user'
//  })
//  displayName: string | null;

//  pronoun: PronounType | null;



