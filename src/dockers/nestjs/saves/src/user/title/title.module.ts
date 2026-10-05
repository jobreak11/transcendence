import { Module } from '@nestjs/common';
import { TitleService } from './title.service.js';
import { DrizzleModule } from '../../drizzle/drizzle.module.js';

@Module({
  imports: [DrizzleModule],
  providers: [TitleService],
  exports: [TitleService]
})
export class TitleModule {}
