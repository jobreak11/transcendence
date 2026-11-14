import { Module } from '@nestjs/common';
import { DrizzleModule } from '../../infrastructure/drizzle/drizzle.module.js';
import { TitlesService } from './titles.service.js';
import { TitlesDatabaseService } from './database/titles-database.service.js';
import { TitlesRedisService } from './redis/title-redis.service.js';
import { TitlesCachingService } from './caching/titles-caching.service.js';

@Module({
  imports: [DrizzleModule],
  providers: [TitlesService, TitlesDatabaseService, TitlesRedisService, TitlesCachingService],
  exports: [TitlesService],
})
export class TitlesModule {}
