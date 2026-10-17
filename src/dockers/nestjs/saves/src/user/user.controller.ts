import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, NotImplementedException, SetMetadata, HttpCode, HttpStatus, ParseIntPipe, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, BadRequestException, PayloadTooLargeException, Query, InternalServerErrorException, Logger } from '@nestjs/common';
import { UserService } from './user.service.js';
import { CreateUserDto, createUserSchema } from './dto/create-user.dto.js';
import { UpdateUserDto, updateUserSchema } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiConsumes, ApiForbiddenResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { UnauthorizedErrorDto } from '../auth/dto/login.dto.js';
import { GetUserProfileDto, getUserProfileSchema } from './dto/get-user-profile.dto.js';
import { Role } from '../auth/enums/role.enum.js';
import { Roles } from '../auth/decorators/roles.decorators.js';
import { Multer } from 'multer'
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';
import { FileInterceptor } from '@nestjs/platform-express'
import { SHARED_STORAGE_PATH, STORAGE_URL_PATH, THROTTLER_USER_PROFILE_LIMIT, THROTTLER_USER_PROFILE_TTL, THROTTLER_USER_PROFILE_UPDATE_LIMIT, THROTTLER_USER_PROFILE_UPDATE_TTL, THROTTLER_USER_PROFILE_UPLOADPROFILEPIC_LIMIT, THROTTLER_USER_PROFILE_UPLOADPROFILEPIC_TTL } from '../constant.js';
import * as path from 'path'
import * as fs from 'fs/promises'
import type { AuthJwtFastifyRequest } from '../auth/types/auth-jwtFastifyRequest.js';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { UserThrottlerGuard } from '../auth/guards/user-throttler/user-throttler.guard.js';
import { TitleService } from './title/title.service.js';
import { ZodValidationPipe } from '../pipes/ZodValidationPipe.js';
import z from 'zod';

@Controller('user')
export class UserController {

  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly userService: UserService,
    private readonly titleService: TitleService
  ) {}

  @ApiOperation({summary: 'Register a new user account'})
  @ApiResponse({status: 201, description: 'User created successfully'})
  @ApiResponse({status: 401, description: 'validation failed.', type: UnauthorizedErrorDto})
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body(new ZodValidationPipe(createUserSchema)) createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user profile',
    description:
      'Retrieves the authenticated user’s profile if no query params are passed. Provide either `id` or `tagId` to view another user’s profile. Providing both will return a 400 error.',
  })
  @ApiQuery({
    name: 'id',
    required: false,
    type: String,
    description: 'Lookup target profile by User ID (mutually exclusive with tagId)',
    example: 'usr_12345',
  })
  @ApiQuery({
    name: 'tagId',
    required: false,
    type: String,
    description: 'Lookup target profile by Tag/Handle (mutually exclusive with id)',
    example: 'gamer_tag_99',
  })
  @ApiOkResponse({
    type: GetUserProfileDto,
    description: 'Successfully retrieved user profile data',
  })
  @ApiBadRequestResponse({
    description: 'Both `id` and `tagId` were provided simultaneously',
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedErrorDto,
    description: 'Missing or invalid JWT token',
  })
  @UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
  @Throttle({
    default: {
      limit: THROTTLER_USER_PROFILE_LIMIT,
      ttl: THROTTLER_USER_PROFILE_TTL
    }
  })
  @Roles(Role.USER)
  @Get('profile')
  async getProfile(
    @Req() req: any,
    @Query('id') id?: string,
    @Query('tagId') tagId?: string,
  ): Promise<GetUserProfileDto> {

    let result;
    if (tagId && id) {
      throw new BadRequestException('must not contain both query params!');
    } else if (!tagId && !id) {
      result = await this.userService.findOne(req.user.id);
    } else if (tagId) {
      result = await this.userService.findByTagId(tagId);
    } else {
      result = await this.userService.findOne(id ?? '');
    }

    let resName: string | null = null;
    if (result.user_profile?.activeTitleId) {
      // get the name immediately
      const {name} = await this.titleService.findOne(result.user_profile.activeTitleId);

      if (name)
        resName = name;
    }

    const slice = getUserProfileSchema.safeParse({...result, titleName: resName});

    if (slice.success) {
      return slice.data
    }

    this.logger.error({
      message: "from getProfile()",
      error: "zod schema failed",
      zodError: z.treeifyError(slice.error)
    })
    throw new InternalServerErrorException("internal error");

  }


  //@Post('profile/uploadProfilePic')
  //@
  //uploadProfilePic(@Req() req:any, @Body()) {

  //}



  // @Post('profile/uploadProfilePic')
  // @UseInterceptors(FileInterceptor('file'))
  // async uploadProfilePic(@Req() req:any, @UploadedFile(
  //   new ParseFilePipe({
  //     validators: [
        
  //       /* FIX: user can upload any type of file, any size
  //       but would trim the size to be a square, maybe include another
  //       type of image later

  //       - scale, resize the image down ? if the profile picture
  //       is too big to store.
  //        */

  //       new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
  //       new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
  //     ],
  //   })
  // ) file: Express.Multer.File) {

  //   //console.log({ routeCheck: 'isHere', req});
  //   return this.userService.uploadProfilePic(req.user.id, file);
  // }

    @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload user profile picture' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Profile image file (JPG, JPEG, PNG, max 5MB)',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, UserThrottlerGuard)
  @Throttle({
    default: {
      limit: THROTTLER_USER_PROFILE_UPLOADPROFILEPIC_LIMIT,
      ttl: THROTTLER_USER_PROFILE_UPLOADPROFILEPIC_TTL
    }
  })
  @Post('profile/uploadProfilePic')
  async uploadProfilePic(@Req() req: AuthJwtFastifyRequest) {

    if (! req.isMultipart()) {
      throw new BadRequestException(`Expected multipart/form-data`);
    }

    const part = await req.file({
      limits: {
        fileSize: 1024 * 1024 * 10, // 10MB Limit
      },
    });

    if (!part) {
      throw new BadRequestException('File is required');

    }

    if (part.fieldname !== 'file') {
      part.file.resume();
      throw new BadRequestException('Field name must be "file"');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimeTypes.includes(part.mimetype)) {
      throw new BadRequestException('Only JPG, JPEG, and PNG files are allowed');
    }

    const buffer = await part.toBuffer();

    if (part.file.truncated) {
      throw new PayloadTooLargeException('File size exceeds the 10MB limit');
    }

    const res = await this.userService.uploadProfilePic(req.user.id, buffer);

    return {
      avatarUrl: res.user_profile?.avatarUrl ?? null
    }
  }


  @ApiBearerAuth()
  @ApiOperation({
    summary: 'update the user profile',
    description: 'update the user profile'
  })
  @Patch('update')
  @UseGuards(JwtAuthGuard, UserThrottlerGuard)
  @Throttle({
    default: {
      limit: THROTTLER_USER_PROFILE_UPDATE_LIMIT,
      ttl: THROTTLER_USER_PROFILE_UPDATE_TTL
    }
  })
  async update(@Req() req:any, @Body(new ZodValidationPipe(updateUserSchema)) updateUserDto: UpdateUserDto)
  : Promise<GetUserProfileDto>
  {
    //throw new NotImplementedException('still not implement')

    const result = await this.userService.update(req.user.id, updateUserDto);

    let resName: string | null = null;
    if (result.user_profile?.activeTitleId) {
      const {name} = await this.titleService.findOne(result.user_profile.activeTitleId);
      resName = name;
    }

    const slice = getUserProfileSchema.safeParse({...result, titleName: resName});

    if (slice.success) {
      return slice.data
    }

    this.logger.error({
      message: "from getProfile()",
      error: "zod schema failed"
    })
    throw new InternalServerErrorException("internal error");

  }

  @ApiOperation({
    summary: `Delete user from the database`,
    description: `takes access_token from Authorization: Bearer header \
    and allow only role ${Role.ADMIN} and ${Role.EDITOR} to delete user
    `
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedErrorDto,
    description: 'invalid role, invalid Token, or expired Token'
  })
  @ApiNoContentResponse({
    description: 'successfully deleted'
  })
  @ApiForbiddenResponse({
    description: 'invalid role?'
  })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Roles(Role.EDITOR, Role.ADMIN)
  //@UseGuards(RolesGuard)
  //@UseGuards(JwtAuthGuard)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

}
