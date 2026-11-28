import { Controller, Get, UseFilters } from '@nestjs/common';
import { AppService } from './app.service.js';
import { ApiOperation } from '@nestjs/swagger';
import { Public } from './modules/auth/decorators/public.decorators.js';
import { HttpAllExceptionsFilter } from './api/filters/HttpAllExceptionsFilter.js';

@Controller()
@UseFilters(HttpAllExceptionsFilter)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  @ApiOperation({
    summary: 'Basic Hello world test',
    description: 'the most basic simple get to the backend service'
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
