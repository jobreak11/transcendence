import { Controller, HttpCode, HttpStatus, Body, Post, Req, Request, UseGuards, NotImplementedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard.js';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { LoginDto, LoginSuccessResponseDto, UnauthorizedErrorDto } from './dto/login.dto.js';
import { RefreshAuthGuard } from './guards/refresh-auth/refresh-auth.guard.js';
import { RefreshTokenSuccessDto } from './dto/refresh-token.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard.js';
import { Public } from './decorators/public.decorators.js';
import { CreateUserDto } from '../user/dto/create-user.dto.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  registerUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.registerUser(createUserDto);
  }


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
  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req:any) {

    return this.authService.login(req.user.id);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: "Refresh JWT Token API",
    description: 'takes the refresh token from \'Authorization: Bearer refreshToken\' \
    in the header of the request'
  })
  @ApiOkResponse({
    type: RefreshTokenSuccessDto,
    description: 'upon success would return new JWT token back'
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedErrorDto,
    description: 'invalid to expired refresh token. need to re-login for new generated one.'
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  refreshToken(@Req() req: any) {
    return this.authService.refreshToken(req.user.id)
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Revoke the jwt refresh token',
    description: 'take the access_token from Authoriazation: Bearer header \
    from the POST request and set the hashedRefeshToken in the user table to \
    NULL'
  })
  @ApiResponse({
    status: 204,
    description: 'successfully logged out'
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedErrorDto,
    description: 'invalid access_token or expired'
  })
  @UseGuards(JwtAuthGuard)
  @Post('signout')
  signOut(@Req() req: any) {
    this.authService.signOut(req.user.id)
  }

}
