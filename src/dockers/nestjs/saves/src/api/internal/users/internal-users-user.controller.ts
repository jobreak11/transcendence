import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, InternalServerErrorException, Logger, Patch, PayloadTooLargeException, Post, Query, Req, UseFilters, UseGuards } from "@nestjs/common";
import { UserService } from "../../../modules/user/user.service.js";
import { TitlesService } from "../../../modules/titles/titles.service.js";
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { GetUserProfileDto, getUserProfileSchema } from "./dtos/get-user-profile.dto.js";
import { UnauthorizedErrorDto } from "../../../modules/auth/dto/login.dto.js";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { JwtAuthGuard } from "../../../modules/auth/guards/jwt-auth/jwt-auth.guard.js";
import { THROTTLER_USER_PROFILE_LIMIT, THROTTLER_USER_PROFILE_TTL, THROTTLER_USER_PROFILE_UPDATE_LIMIT, THROTTLER_USER_PROFILE_UPDATE_TTL, THROTTLER_USER_PROFILE_UPLOADPROFILEPIC_LIMIT, THROTTLER_USER_PROFILE_UPLOADPROFILEPIC_TTL } from "./internal-users.constants.js";
import z from "zod";
import { UserThrottlerGuard } from "../../../modules/auth/guards/user-throttler/user-throttler.guard.js";
import { type AuthJwtFastifyRequest } from "../../../modules/auth/types/auth-jwtFastifyRequest.js";
import { ZodValidationPipe } from "../../../pipes/ZodValidationPipe.js";
import { UpdateUserDto, updateUserSchema } from "../../../modules/user/dto/update-user.dto.js";
import { HttpAllExceptionsFilter } from "../../filters/HttpAllExceptionsFilter.js";
import { IpThrottlerGuard } from "../../../modules/auth/guards/ip-throttler/ip-throttler.guard.js";

@ApiTags("Users")
@UseFilters(HttpAllExceptionsFilter)
@UseGuards(IpThrottlerGuard, JwtAuthGuard, UserThrottlerGuard)
@Controller('user')
export class InternalUsersUserController {

  private readonly logger = new Logger(InternalUsersUserController.name);

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
  @Throttle({
    ip: {
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
  @Throttle({
    ip: {
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
  @Throttle({
    ip: {
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
  












}