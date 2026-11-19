import z from "zod";
import { achievementsDatabaseSchema } from "../../../../infrastructure/drizzle/schema/achievements/achievements.schema.js";
import { OmitType } from "@nestjs/swagger";
import { AchievementDto } from "../../../../infrastructure/drizzle/schema/achievements/achievements.dto.js";

export const achievementsUpdateSchema = z.object({
    ...achievementsDatabaseSchema.select.omit({id: true}).partial().shape
})

type test = z.infer<typeof achievementsUpdateSchema>;
export class AchievementUpdateDto extends OmitType(AchievementDto, ['id'] as const) {

}