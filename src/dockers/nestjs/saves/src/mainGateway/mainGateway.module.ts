import { Module } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt";
import { AuthModule } from "../auth/auth.module.js";
import { UserService } from "../user/user.service.js";
import { UserModule } from "../user/user.module.js";
import { MainGateway } from "./mainGateway.js";

@Module({
  providers: [MainGateway],
  imports: [AuthModule, UserModule]
})
export class MainGatewayModule {

}