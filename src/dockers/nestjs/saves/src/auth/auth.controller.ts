import { Controller, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard.js';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { LoginDto, LoginSuccessResponseDto, UnauthorizedErrorDto } from './dto/login.dto.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  @ApiOperation({
    summary: 'User Login',
    description: 'Accepts email and password, verifies credentials, \
    and returns a JWT.'
  })
  @ApiBody({
    type: LoginDto,
    description: 'User login credentials'
  })
  @ApiOkResponse({
    description: 'Logged in successfully',
    type: LoginSuccessResponseDto
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password',
    type: UnauthorizedErrorDto
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req:any) {

    const token = this.authService.login(req.user.id);

    return {id: req.user.id, token}
  }
}
