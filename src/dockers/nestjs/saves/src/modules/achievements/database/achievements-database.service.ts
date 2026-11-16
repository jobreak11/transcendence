import { Inject, Injectable, Logger } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { dbSchema } from "../../../infrastructure/drizzle/schema/schema.js";
import { DRIZZLE } from "../../../infrastructure/drizzle/drizzle.module.js";

@Injectable()
export class AchievementsDatabaseService {

    private readonly logger = new Logger(AchievementsDatabaseService.name);

    constructor(
        @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof dbSchema.dbRelations>,

    ) {
    }

    createOne() {
        
    }

}