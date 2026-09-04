import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service.js';
import { JwtService } from '@nestjs/jwt';
import { AuthJwtPayload } from './types/auth-jwtPayload.js';
import refreshJwtConfig from './config/refresh-jwt.config.js';
import type { ConfigType } from '@nestjs/config';
import * as argon2 from 'argon2'
import { CurrentUser } from './types/current-user.js';
import { CreateUserDto } from '../user/dto/create-user.dto.js';

@Injectable()
export class AuthService {

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @Inject(refreshJwtConfig.KEY) private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>
  ) {}

  registerUser(createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  async validateUser(email: string, password: string) {

    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(`User ${email} not found!`);
    }

    const isPasswordMatch = await argon2.verify(user.password, password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException(`User ${email} invalid credentails`);
    }

    return { id: user.id };
  }

  async login(userId: number) {

    //const payload:AuthJwtPayload = {sub: userId};
    //const token = this.jwtService.sign(payload);
    //const refreshToken = this.jwtService.sign(payload, this.refreshTokenConfig);

    const {accessToken, refreshToken} = await this.generateTokens(userId)
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.userService.updateHashedRefreshToken(userId, hashedRefreshToken);

    return {
      id: userId,
      accessToken,
      refreshToken
    };
  }

  async generateTokens(userId: number) {
    const payload: AuthJwtPayload = { sub: userId}
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, this.refreshTokenConfig),
    ]);

    return ({
      accessToken,
      refreshToken
    })
  }

  async refreshToken(userId: number) {
    const {accessToken, refreshToken} = await this.generateTokens(userId)
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.userService.updateHashedRefreshToken(userId, hashedRefreshToken);

    return {
      id: userId,
      accessToken,
      refreshToken
    };
  }

  async validateRefreshToken(userId: number, refreshToken: string) {
    const user = await this.userService.findOne(userId);

    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Invalid Refresh Token');
    }

    const refreshTokenMatch = await argon2.verify(user.hashedRefreshToken, refreshToken);

    if (!refreshTokenMatch) {
      throw new UnauthorizedException('Invalid Refresh Token');
    }

    return ({
      id: userId
    })
  }

  async signOut(userId: number){
    await this.userService.updateHashedRefreshToken(userId, null)
  }

  async validateJwtUser(userId: number) {
    const user = await this.userService.findOne(userId);

    if (!user) {
      throw new UnauthorizedException('User Not Found!');
    }

    const currentUser: CurrentUser = {
      id: user.id,
      role: user.role
    };

    return currentUser;
  }

}
