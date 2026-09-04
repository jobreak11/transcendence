import { registerAs } from "@nestjs/config";
import { JwtModuleOptions } from "@nestjs/jwt";
import { StringValue } from 'ms'

export default registerAs("jwt", ():JwtModuleOptions => ({
  secret: process.env.NESTJS_JWT_SECRET_KEY,
  signOptions: {
    expiresIn: (process.env.NESTJS_JWT_EXPIRE_TIME ?? '1h') as StringValue
  }
}));