import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "../../../modules/auth/auth.service.js";
import { JwtAuthGuard } from "../../../modules/auth/guards/jwt-auth/jwt-auth.guard.js";
import { UserThrottlerGuard } from "../../../modules/auth/guards/user-throttler/user-throttler.guard.js";
import { RolesGuard } from "../../../modules/auth/guards/roles/roles.guard.js";
import { Roles } from "../../../modules/auth/decorators/roles.decorators.js";
import { Role } from "../../../modules/auth/enums/role.enum.js";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { THROTTLER_AUTH_ADMIN_CHECK_LIMIT, THROTTLER_AUTH_ADMIN_CHECK_TTL, THROTTLER_AUTH_LOGIN_LIMIT, THROTTLER_AUTH_LOGIN_TTL, THROTTLER_AUTH_SIGNOUT_LIMIT, THROTTLER_AUTH_SIGNOUT_TTL, THROTTLER_AUTH_SIGNUP_LIMIT, THROTTLER_AUTH_SIGNUP_TTL } from "./internal-auth.constants.js";
import { ZodValidationPipe } from "../../../pipes/ZodValidationPipe.js";
import { CreateUserDto, createUserSchema } from "../../../modules/user/dto/create-user.dto.js";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiResponse, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { LoginDto, LoginSuccessResponseDto, UnauthorizedErrorDto } from "../../../modules/auth/dto/login.dto.js";
import { LocalAuthGuard } from "../../../modules/auth/guards/local-auth/local-auth.guard.js";
import { RefreshTokenSuccessDto } from "../../../modules/auth/dto/refresh-token.dto.js";
import { RefreshAuthGuard } from "../../../modules/auth/guards/refresh-auth/refresh-auth.guard.js";
import { GoogleAuthGuard } from "../../../modules/auth/guards/google-auth/google-auth.guard.js";
import { FortytwoAuthGuard } from "../../../modules/auth/guards/fortytwo-auth/fortytwo-auth.guard.js";
import { UsersRedisService } from "../../../modules/user/redis/users-redis.service.js";
import { IpThrottlerGuard } from "../../../modules/auth/guards/ip-throttler/ip-throttler.guard.js";

@Controller('auth')
export class InternalAuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}


  @HttpCode(HttpStatus.NO_CONTENT)
  @Get('check')
  @UseGuards(JwtAuthGuard, UserThrottlerGuard)
  async authCheck(@Req() req: any) {

  }

  // internal user for nginx
  @HttpCode(HttpStatus.NO_CONTENT)
  @Get('internal/admin/check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  internalAdminAuthCheck(@Req() req: any) {

  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Get('admin/check')
  @UseGuards(IpThrottlerGuard, JwtAuthGuard, RolesGuard)
  @Throttle({
    ip: {
      limit: THROTTLER_AUTH_ADMIN_CHECK_LIMIT,
      ttl: THROTTLER_AUTH_ADMIN_CHECK_TTL
    }
  })
  @Roles(Role.ADMIN)
  adminAuthCheck(@Req() req: any) {

  }

  @Post('signup')
  @Throttle({
    // signup endpoint should not allow client to register so quickly
    default: {
      limit: THROTTLER_AUTH_SIGNUP_LIMIT,
      ttl: THROTTLER_AUTH_SIGNUP_TTL
    }
  })
  @UseGuards(ThrottlerGuard)
  registerUser(@Body(new ZodValidationPipe(createUserSchema)) createUserDto: CreateUserDto) {
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
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard, UserThrottlerGuard)
  @Throttle({
    default: {
      limit: THROTTLER_AUTH_LOGIN_LIMIT,
      ttl: THROTTLER_AUTH_LOGIN_TTL
    }
  })
  @Post('login')
  async login(@Req() req:any) {

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
  @UseGuards(JwtAuthGuard, UserThrottlerGuard)
  @Throttle({
    default: {
      limit: THROTTLER_AUTH_SIGNOUT_LIMIT,
      ttl: THROTTLER_AUTH_SIGNOUT_TTL
    }
  })
  @Post('signout')
  signOut(@Req() req: any) {
    this.authService.signOut(req.user.id)
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google/login')
  googleLogin() {

  }


  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req:any, @Query('state') state: string) {



    const decodeRedirect = state ? decodeURIComponent(state) : '/';
    const response = await this.authService.login(req.user.id);

    console.log({state, response});
    return {...response, callbackUrl: decodeRedirect};
  }

  @UseGuards(FortytwoAuthGuard)
  @Get('42/login')
  fortyTwoLogin() {

  }


  @UseGuards(FortytwoAuthGuard)
  @Get('42/callback')
  async fortyTwoCallback(@Req() req:any, @Query('state') state: string) {

    const decodeRedirect = state ? decodeURIComponent(state) : '/';
    const response = await this.authService.login(req.user.id);

    return {...response, callbackUrl: decodeRedirect};
  }


}

