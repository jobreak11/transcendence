import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class TrophiesRedisService {

    private readonly logger = new Logger(TrophiesRedisService.name);

}