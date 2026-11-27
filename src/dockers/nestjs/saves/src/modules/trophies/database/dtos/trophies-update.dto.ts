import z from "zod";
import { trophiesDatabaseSchema } from "../../../../infrastructure/drizzle/schema/throphies/trophies.schema.js";
import { OmitType, PartialType } from "@nestjs/swagger";
import { TrophyDto } from "../../../../infrastructure/drizzle/schema/throphies/trophies.dto.js";

export const trophiesUpdateSchema = z.object({
    ...trophiesDatabaseSchema.select.omit({id: true, imageUrl: true}).partial().shape,
    imageUrl: z.url().nullish()
})


export class TrophiesUpdateDto extends PartialType(OmitType(TrophyDto, ['id'] as const)) {

}
