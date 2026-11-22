import { BadRequestException, Body, ConflictException, Controller, Delete, ForbiddenException, Get, HttpCode, HttpStatus, InternalServerErrorException, Logger, ParseIntPipe, ParseUUIDPipe, Patch, PayloadTooLargeException, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiConsumes, ApiForbiddenResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiResponse, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { UserService } from "../../../modules/user/user.service.js";
import { GetUserProfileDto, getUserProfileSchema } from "./dtos/get-user-profile.dto.js";
import { UnauthorizedErrorDto } from "../../../modules/auth/dto/login.dto.js";
import { JwtAuthGuard } from "../../../modules/auth/guards/jwt-auth/jwt-auth.guard.js";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { THROTTLER_USER_ALLCOUNT_LIMIT, THROTTLER_USER_ALLCOUNT_TTL, THROTTLER_USER_BATCH_LIMIT, THROTTLER_USER_BATCH_TTL, THROTTLER_USER_PROFILE_LIMIT, THROTTLER_USER_PROFILE_TTL, THROTTLER_USER_PROFILE_UPDATE_LIMIT, THROTTLER_USER_PROFILE_UPDATE_TTL, THROTTLER_USER_PROFILE_UPLOADPROFILEPIC_LIMIT, THROTTLER_USER_PROFILE_UPLOADPROFILEPIC_TTL, THROTTLER_USER_SET_ROLE_LIMIT, THROTTLER_USER_SET_ROLE_TTL, USER_SERVICE_PAGE_LIMIT_MAX } from "./internal-users.constants.js";
import z from "zod";
import { UserThrottlerGuard } from "../../../modules/auth/guards/user-throttler/user-throttler.guard.js";
import { type AuthJwtFastifyRequest } from "../../../modules/auth/types/auth-jwtFastifyRequest.js";
import { ZodValidationPipe } from "../../../pipes/ZodValidationPipe.js";
import { UpdateUserDto, updateUserSchema } from "../../../modules/user/dto/update-user.dto.js";
import { Roles } from "../../../modules/auth/decorators/roles.decorators.js";
import { Role } from "../../../modules/auth/enums/role.enum.js";
import { RolesGuard } from "../../../modules/auth/guards/roles/roles.guard.js";
import { UserSetRoleDto, userSetRoleSchema } from "../../../modules/user/dto/set-role-user.dto.js";
import { CreateUserDto, createUserSchema } from "../../../modules/user/dto/create-user.dto.js";
import { UserAndProfileDto } from "../../../modules/user/dto/user-and-profile.dto.js";
import { GetUserTotalCountDto } from "./dtos/get-user-count.dto.js";
import { TitlesService } from "../../../modules/titles/titles.service.js";

@Controller('user')
export class InternalUsersController {
  private readonly logger = new Logger(InternalUsersController.name);

  constructor(
    private readonly userService: UserService,
    private readonly titleService: TitlesService,
  ) {

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
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @Throttle({
    default: {
      limit: THROTTLER_USER_PROFILE_LIMIT,
      ttl: THROTTLER_USER_PROFILE_TTL
    }
  })
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
    summary: "set the role of the user"
  })
  @Roles(Role.ADMIN)
  @Throttle({
    default: {
      limit : THROTTLER_USER_SET_ROLE_LIMIT,
      ttl: THROTTLER_USER_SET_ROLE_TTL
    }
  })
  @UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
  @Post('setRole')
  async setUserRole(
    @Req() req: any,
    @Body(new ZodValidationPipe(userSetRoleSchema)) body: UserSetRoleDto
  ) {

    // Rules

    // 1. you cannot change the role of yourself
    if (req.user.id === body.userId) {
      throw new ForbiddenException("cannot set new role for yourself")
    }

    // cannot set other role to admin
    if (body.newRole === Role.ADMIN) {
      throw new ForbiddenException("cannot set other user to admin, should have only one admin")
    }

    const targetUser = await this.userService.findOne(body.userId);
    const setterUser = await this.userService.findOne(req.user.id);

    // ADMIN
    // EDITOR ( aka dev )
    // USER

    return this.userService.setRole(body.userId, body.newRole);
  }


  @ApiOperation({
    summary: 'Register a new user account',
    description: `register new user api for ADMIN role`
  })
  @ApiResponse({status: 201, description: 'User created successfully'})
  @ApiResponse({status: 401, description: 'validation failed.', type: UnauthorizedErrorDto})
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('create')
  create(
    @Req() req: any,
    @Body(new ZodValidationPipe(createUserSchema)) createUserDto: CreateUserDto
  ) {
    return this.userService.create(createUserDto);
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
  @Throttle({
    default: {
      ttl: 10_000,
      limit: 20
    }
  })
  @UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
  //@UseGuards(JwtAuthGuard)
  @Delete('delete')
  async remove(
    @Req() req: any,
    @Query('userId', ParseUUIDPipe) userId: string
  ) {

    if (userId === req.user.id) {
      throw new ConflictException("cannot delete youeself user");
    }

    const [user, removerUser] = await Promise.all([
      this.userService.findOne(userId),
      this.userService.findOne(req.user.id),
    ])

    if (removerUser.role !== Role.ADMIN && user.role !== Role.USER) {
      // cannot remove

      throw new ForbiddenException("only ADMIN can remove account role higher than user")
    }

    this.logger.debug(`api reached user id to remove is ${userId}`)
    return this.userService.remove(userId);
  }

  @ApiOperation({
    summary: "get multiple user info",
    description: "for ADMIN AND EDITOR"
  })
  @Get()
  @Throttle({
    default: {
      limit: THROTTLER_USER_BATCH_LIMIT,
      ttl: THROTTLER_USER_BATCH_TTL
    }
  })
  @Roles(Role.ADMIN, Role.EDITOR)
  @UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
  getBatchUsers(
    @Req() req: any,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('offset', ParseIntPipe) offset: number,
  ): Promise<UserAndProfileDto[]> {
    if (limit < 1 || offset < 0 || limit > USER_SERVICE_PAGE_LIMIT_MAX) {
      throw new BadRequestException("invalid query values");
    }
    return this.userService.getUsers(limit, offset)
  }

  // count overall user
  @Get('totalCount')
  @Throttle({
    default: {
      limit: THROTTLER_USER_ALLCOUNT_LIMIT,
      ttl: THROTTLER_USER_ALLCOUNT_TTL
    }
  })
  @Roles(Role.ADMIN, Role.EDITOR)
  @UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
  async totalUserCount(
    @Req() req:any,
  ): Promise<GetUserTotalCountDto> {

    const total = await this.userService.allUserCount();

    return {
      totalUserCount: total
    }
  }
}