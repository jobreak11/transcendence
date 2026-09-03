import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, NotImplementedException } from '@nestjs/common';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { User } from './entities/user.entity.js';
import { UnauthorizedErrorDto } from '../auth/dto/login.dto.js';
import { GetUserProfileDto } from './dto/get-user-profile.dto.js';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({summary: 'Register a new user account'})
  @ApiResponse({status: 201, description: 'User created successfully', type: User})
  @ApiResponse({status: 401, description: 'validation failed.', type: UnauthorizedErrorDto})
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
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req:any){
    return this.userService.findOne(req.user.id);
  }


  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    throw new NotImplementedException('still not implement')
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    throw new NotImplementedException('still not implement')
    return this.userService.remove(+id);
  }
}
