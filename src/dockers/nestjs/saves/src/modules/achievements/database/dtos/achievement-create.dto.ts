import z from "zod";
import { achievementsDatabaseSchema } from "../../../../infrastructure/drizzle/schema/achievements/achievements.schema.js";
import { IntersectionType, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { AchievementDto } from "../../../../infrastructure/drizzle/schema/achievements/achievements.dto.js";

export const achievementsCreateSchema = z.object({
    ...achievementsDatabaseSchema.insert.omit({id: true}).shape
})

export class AchievementCreateDto extends IntersectionType(
    PickType(AchievementDto, ['name'] as const),
    PartialType(OmitType(AchievementDto, ['name', 'id'] as const))
) {

}