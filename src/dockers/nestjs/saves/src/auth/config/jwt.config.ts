import { registerAs } from "@nestjs/config";
import { JwtModuleOptions } from "@nestjs/jwt";

export default registerAs("jwt", ():JwtModuleOptions => ({
  secret: process.env.NESTJS_JWT_SECRET_KEY,
  signOptions: {
    expiresIn: '1d'
  }
}));