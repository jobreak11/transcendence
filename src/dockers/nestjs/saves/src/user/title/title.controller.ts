import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, HttpStatus, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles/roles.guard.js';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { TitleService } from './title.service.js';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorators.js';
import { Role } from '../../auth/enums/role.enum.js';
import { ZodValidationPipe } from '../../pipes/ZodValidationPipe.js';
import {
  CreateNewTitleSchema,
  CreateNewTitleZodDto, 
  GetUserTitleDto,
  TitleDto,
  UpdateTitleSchema,
  UpdateTitleZodDto,
} from './title.dto.js';
import { title } from 'process';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ThrottlerGuard)
@Controller('title')
export class TitleController {

  constructor(
    private readonly titleService: TitleService,
  ) {
  }

  @ApiOkResponse({
    type: [TitleDto]
  })
  @ApiOperation({
    summary: "get all the titles available",
    description: " receive an array of all titles \
      available in the database"
  })
  @Get('all')
  getAllTitles(@Req() req: any) {
    // Get all the title the database have

    return this.titleService.getAllTitles();
  }

  @ApiOkResponse({
    type: [GetUserTitleDto]
  })
  @ApiOperation({
    summary: "get all the titles available for this current user / specific titles",
    description: " receive an array of this user titles \
      available"
  })
  @Get()
  getUserTitles(
    @Req() req: any,
  ) {
    // get all the titles that user have

    return this.titleService.getAllUserTitles(req.user.id);
  }

  @ApiOperation({
    summary: "find the title details",
    description: "provide the query to get the detail of the \
      specific title by id or by name"
  })
  @ApiQuery({
    name: "titleId",
    required: false,
    type: String,
    description: "the id of the title"
  })
  @ApiQuery({
    name: "titleName",
    required: false,
    type: String,
    description: "the name of the title"
  })
  @ApiForbiddenResponse({
    description: "the titleId and titleName query cannot go together",
  })
  @Get('find')
  findTitle(
    @Req() req: any,
    @Query('titleId', ParseUUIDPipe) titleId?: string,
    @Query('titleName') titleName?: string,
  ) {

    if (titleId && titleName) {
      // both title id and title name can't be at the same time

      throw new ForbiddenException("Query can't have titleId and titleName at the same time");
    }
    else if (titleId) {
      return this.titleService.findOne(titleId);
    }
    else  {
      return this.titleService.findByName(titleName as string);
    }

  }
  

  @ApiOperation({
    summary: "create new title to database",
    description: "added new title to the website \
      NOTE: Only for ADMIN Role \
    "
  })
  @Post('new')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  createNewTitle(@Req() req: any, @Body(new ZodValidationPipe(CreateNewTitleSchema)) body: CreateNewTitleZodDto) {

    return this.titleService.createNewTitle(body);
  }

  @ApiOperation({
    summary: "giver user a title",
    description: "ADMIN only"
  })
  @ApiQuery({
    name: "userId",
    required: true,
    type: String,
    description: "the target User to give the title"
  })
  @ApiQuery({
    name: "titleId",
    required: true,
    type: String,
    description: "the title you want to giv to the target user"
  })
  @Post('give')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  giveUserTitle(
    @Req() req: any,
    @Query('userId', ParseUUIDPipe) userId: string,
    @Query('titleId', ParseUUIDPipe) titleId: string,
  ) {

    return this.titleService.giveUserTitle(userId, titleId);
  }


  @ApiOperation({
    summary: "revoke title from the user",
    description: "ADMIN Only"
  })
  @ApiQuery({
    name: "userId",
    required: true,
    type: String,
    description: "the target User to revoke the title"
  })
  @ApiQuery({
    name: "titleId",
    required: true,
    type: String,
    description: "the title you want to revoke from the target user"
  })
  @Delete('revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async revokeUserTitle(
    @Req() req: any,
    @Query('userId', ParseUUIDPipe) userId: string,
    @Query('titleId', ParseUUIDPipe) titleId: string,
  ) {

    await this.titleService.revokeTitleFromUser(userId, titleId);
  }


  @ApiOperation({
    summary: "update the title",
    description: "update the target title id details"
  })
  @ApiQuery({
    name: "titleId",
    required: true,
    type: 'string',
    description: "the title id of the title you want to change"
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch('update')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updateTitle(
    @Req() req: any, 
    @Query('titleId', ParseUUIDPipe) titleId: string,
    @Body(new ZodValidationPipe(UpdateTitleSchema)) body: UpdateTitleZodDto
  ) {

    return this.titleService.updateTitle(titleId, body);
  }

  @ApiOperation({
    summary: "delete a title",
    description: "delele a sepecific title by title id. ADMIN ONLY"
  })
  @ApiQuery({
    name: "titleId",
    required: true,
    type: 'string',
    description: "the title id you want to delete"
  })
  @Delete('delete')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTitle(
    @Req() req: any,
    @Query('titleId', ParseUUIDPipe) titleId: string
  ) {

    await this.titleService.removeTitle(titleId);
  }

}
