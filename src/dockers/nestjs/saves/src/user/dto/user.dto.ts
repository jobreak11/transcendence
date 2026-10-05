import { ApiProperty } from "@nestjs/swagger";
import { Role } from "../../auth/enums/role.enum.js";
import { PronounType, users } from "../../drizzle/schema/users.schema.js";

type User = typeof users.$inferSelect;

export class UserDto implements User {
  @ApiProperty({
    example: "01a105d0-bf8f-758a-a1ab-cf9098fded20",
    description: "the uuid main id for user table",
  })
  id: string;

  @ApiProperty({
    example: "YYMMDD_0000",
    description: "tag id of user"
  })
  tagId: string;

  @ApiProperty({
    example: "user@example.com",
    description: "the email of the user"
  })
  email: string;

  @ApiProperty({
    example: "SecurePassword123",
    description: "the hashed password of the user"
  })
  password: string;

  @ApiProperty({
    example: Role.USER,
    description: "The role of the user",
    enum: Role
  })
  role: Role;

  @ApiProperty({
    example: "asdflkaeflkasdflkasf",
    description: "the refresh token of the user"
  })
  hashedRefreshToken: string | null;

  @ApiProperty({
    example: "InwZa007",
    description: "the display name of the user"
  })
  displayName: string | null;

  @ApiProperty({
    description: "The url to the profile image of the user"
  })
  avatarUrl: string | null;

  @ApiProperty({
    description: "The time and date that this user was created"
  })
  createdAt: Date;

  @ApiProperty({
    description: "The pronoun of the user",
    example: PronounType.THEY_THEM,
    enum: PronounType
  })
  pronoun: PronounType | null;

  @ApiProperty({
    description: "signature is like something the user want to say in a form of small message in their profile",
    example: "I'm popeye popsiam USA.",
  })
  signature: string | null;

  @ApiProperty({
    description: "title user wants to show on their profile",
    example: "God-Like win streaks"
  })
  activeTitleId: string | null;

}
