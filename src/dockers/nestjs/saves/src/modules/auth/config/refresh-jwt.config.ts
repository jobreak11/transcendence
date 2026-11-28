
import { registerAs } from "@nestjs/config";
import { JwtModuleOptions, JwtSignOptions } from "@nestjs/jwt";
import { StringValue } from 'ms'

export default registerAs("refresh-jwt", ():JwtSignOptions => ({
  secret: process.env.NESTJS_JWT_REFRESH_SECRET_KEY,
  expiresIn: (process.env.NESTJS_JWT_REFRESH_EXPIRE_TIME ?? '7d') as StringValue
}));