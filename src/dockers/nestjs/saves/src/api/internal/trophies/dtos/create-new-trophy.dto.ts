import z from "zod"
import { trophiesDatabaseSchema } from "../../../../infrastructure/drizzle/schema/throphies/trophies.schema.js"
import { ApiProperty, IntersectionType, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { TrophyDto } from "../../../../infrastructure/drizzle/schema/throphies/trophies.dto.js";

const createNewTrophySchema = z.object({
    ...trophiesDatabaseSchema.insert.omit({id: true}).shape
})

type out = z.infer<typeof createNewTrophySchema>;

export class CreateNewTrophyDto extends IntersectionType(
    PickType(TrophyDto, ['name'] as const),
    PartialType(OmitType(TrophyDto, ['id'] as const))
) {

}
