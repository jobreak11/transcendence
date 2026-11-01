import { ApiProperty, IntersectionType, PartialType, PickType } from "@nestjs/swagger";
import { titles } from "../../drizzle/schema/titles.schema.js";
import { z } from "zod";
import { user_titles } from "../../drizzle/schema/user_titles.schema.js";

type TitleSelect = typeof titles.$inferSelect;
export class TitleDto implements TitleSelect {
  @ApiProperty({
    example: "xxxx_xxxx_xxxx",
    description: "The id of the title"
  })
  id: string;

  @ApiProperty({
    example: "all in one",
    description: "the name of the title"
  })
  name: string;

  @ApiProperty({
    example: "the person really likes to all in.",
    description: "the description of the title"
  })
  description: string | null;

  @ApiProperty({
    description: "The time and date of when this title was added"
  })
  createdAt: Date;
};

type UserTitleSelect = typeof user_titles.$inferSelect;
export class UserTitleDto implements UserTitleSelect {

  @ApiProperty({
    description: "the id of the user that own this title"
  })
  userId: string;

  @ApiProperty({
    description: "the title id"
  })
  titleId: string;

  @ApiProperty({
    description: "the date this user got the title"
  })
  unlockedAt: Date;
}

export const CreateNewTitleSchema = z.object({
  name: z.string().max(100),
  description: z.string().max(5000).optional().nullable(),
  createdAt: z.date().optional()
})

type _CreateNewTitleZodDtoBase = z.infer<typeof CreateNewTitleSchema>

export class CreateNewTitleZodDto implements _CreateNewTitleZodDtoBase {

  @ApiProperty({
    description: "the name of the title to create",
    required: true
  })
  name: string;

  @ApiProperty({
    description: "The description of the new title",
    required: false
  })
  description?: string | null;

  @ApiProperty({
    description: "the Created time of the title. no need this is optional",
    required: false
  })
  createdAt?: Date;
}

export class GetUserTitleDto extends IntersectionType(
  PickType(TitleDto, ['name', 'description'] as const),
  PickType(UserTitleDto, ['unlockedAt', 'titleId'] as const)
) {
}

export const UpdateTitleSchema = z.object({
  name: z.string().max(100).optional(),
  description: z.string().max(5000).optional().nullable(),
  createdAt: z.date().optional()
})

type _UpdateTitleZodDtoBase = z.infer<typeof UpdateTitleSchema>;

export class UpdateTitleZodDto implements _UpdateTitleZodDtoBase {

  @ApiProperty({
    description: "the name of the title",
    required: true
  })
  name?: string;

  @ApiProperty({
    description: "The description of the title",
    required: false
  })
  description?: string | null;

  @ApiProperty({
    description: "the Created time of the title. no need this is optional",
    required: false
  })
  createdAt?: Date;
}
