import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { ApiOperation } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorators.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Basic Hello world test',
    description: 'the most basic simple get to the backend service'
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
