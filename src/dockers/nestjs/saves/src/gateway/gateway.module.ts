import { Module } from "@nestjs/common"
import { MyGateway } from "./gateway.js";
import { JwtService } from "@nestjs/jwt";
import { AuthModule } from "../auth/auth.module.js";
import { UserService } from "../user/user.service.js";
import { UserModule } from "../user/user.module.js";

@Module({
  providers: [MyGateway],
  imports: [AuthModule, UserModule]
})
export class GatewayModule {

}