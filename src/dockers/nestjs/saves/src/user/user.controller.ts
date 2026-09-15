import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, NotImplementedException, SetMetadata, HttpCode, HttpStatus, ParseIntPipe, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiForbiddenResponse, ApiNoContentResponse, ApiOperation, ApiResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { UnauthorizedErrorDto } from '../auth/dto/login.dto.js';
import { GetUserProfileDto } from './dto/get-user-profile.dto.js';
import { Role } from '../auth/enums/role.enum.js';
import { Roles } from '../auth/decorators/roles.decorators.js';
import { Multer } from 'multer'
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';
import { FileInterceptor } from '@nestjs/platform-express'
import { SHARED_STORAGE_PATH, STORAGE_URL_PATH } from '../constant.js';
import * as path from 'path'
import * as fs from 'fs/promises'
import type { AuthJwtFastifyRequest } from '../auth/types/auth-jwtFastifyRequest.js';

@UseGuards(RolesGuard)
@Roles(Role.USER)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({summary: 'Register a new user account'})
  @ApiResponse({status: 201, description: 'User created successfully'})
  @ApiResponse({status: 401, description: 'validation failed.', type: UnauthorizedErrorDto})
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'get the current user profile',
    description: 'use Authentication: Bearer <JWT token> in this get request \
    and the backend will retrieve the user profile infomation'
  })
  @ApiResponse({
    status: 200,
    type: GetUserProfileDto,
    description: "your user profile data"
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedErrorDto,
    description: 'missing or invalid JWT token'
  })
  //@UseGuards(JwtAuthGuard)
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req:any){
    return this.userService.findOne(req.user.id);
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
  @UseGuards(JwtAuthGuard)
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


    return this.userService.uploadProfilePic(req.user.id, buffer);
  }


  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Not implemented yet.'
  })
  @Patch('update')
  @UseGuards(JwtAuthGuard)
  update(@Req() req:any, @Body() updateUserDto: UpdateUserDto) {
    //throw new NotImplementedException('still not implement')
    return this.userService.update(req.user.id, updateUserDto);
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
    return this.userService.remove(+id);
  }

}
