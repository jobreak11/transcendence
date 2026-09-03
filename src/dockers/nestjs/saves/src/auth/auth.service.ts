import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service.js';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthJwtPayload } from './types/auth-jwtPayload.js';

@Injectable()
export class AuthService {

  constructor(
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string) {

    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(`User ${email} not found!`);
    }

    const isPasswordMatch = await compare(password, user.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException(`User ${email} invalid credentails`);
    }

    return { id: user.id };
  }

  login(userId: number) {

    const payload:AuthJwtPayload = {sub: userId};

    return this.jwtService.sign(payload);
  }
}
