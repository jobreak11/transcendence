import z from "zod";
import { PokerCardTheme, PronounType, userProfileSchema } from "./user_profiles.schema.js";
import { ApiProperty } from "@nestjs/swagger";

type UserProfile = z.infer<typeof userProfileSchema.select>



export class UserProfileDto implements UserProfile {

  @ApiProperty({
    example: "xxxx-x-x-xx-xxx",
    description: "the id of the user"
  })
  userId: string;

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

  @ApiProperty({
    description: "The card theme user will use",
    example: "STANDARD"
  })
  cardTheme: PokerCardTheme;
}