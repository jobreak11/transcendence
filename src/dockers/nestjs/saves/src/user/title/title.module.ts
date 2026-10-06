import { Module } from '@nestjs/common';
import { TitleService } from './title.service.js';
import { DrizzleModule } from '../../drizzle/drizzle.module.js';
import { TitleController } from './title.controller.js';

@Module({
  imports: [DrizzleModule],
  providers: [TitleService],
  exports: [TitleService],
  controllers: [TitleController]
})
export class TitleModule {}
